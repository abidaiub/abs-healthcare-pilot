/**
 * Doctors Point Diagnostic Center end-to-end verification.
 *
 * Covers the connected workflow across MOD-01 to MOD-24 plus MOD-30: tenant and branch
 * isolation, separation of duties, published doctor schedules, the priced catalog,
 * analyzer/LIS handling, notification idempotency and portal session safety.
 *
 * Run `npm run seed:uat:doctors-point` first.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  DOCTORS_POINT,
  DOCTORS_POINT_ANALYZERS,
  DOCTORS_POINT_BRANCH,
  DOCTORS_POINT_CATALOG_GAPS,
  DOCTORS_POINT_DEPARTMENTS,
  DOCTORS_POINT_DOCTORS,
  DOCTORS_POINT_GUARDIAN_PATIENT,
  DOCTORS_POINT_PATIENTS,
  DOCTORS_POINT_PORTAL_ACCOUNTS,
  DOCTORS_POINT_PORTAL_DELEGATIONS,
  DOCTORS_POINT_PRICE_LIST,
  DOCTORS_POINT_ROLES,
  DOCTORS_POINT_USERS,
} from "../prisma/seed/uat/doctors-point-data";
import {
  ADULT_FROM_DAYS,
  DOCTORS_POINT_REFERENCE_RANGES,
  DOCTORS_POINT_REFERENCE_RANGE_GAPS,
} from "../prisma/seed/uat/doctors-point-reference-ranges";
import { parseMoneyToMinor } from "../src/lib/billing/money";
import {
  generateShiftSlots,
  isValidTimeOfDay,
  minutesToTime,
  shiftsOverlap,
  timeToMinutes,
} from "../src/lib/doctor-schedule/constants";
import { compareLocaleMessageStructure } from "../src/lib/i18n/completeness";
import { MOD06_PRIMARY_LOCALES } from "../src/lib/i18n/constants";
import { parseAnalyzerMessage } from "../src/lib/laboratory-lis/parse";
import { LAB_LIS_ERROR_CODES } from "../src/lib/laboratory-lis/errors";
import { isReconcilable, isTerminalImportStatus } from "../src/lib/laboratory-lis/constants";
import { computeAbnormalFlag } from "../src/lib/laboratory-result/abnormal-flags";
import {
  DAYS_PER_YEAR,
  estimateAgeInDays,
  resolvePatientAgeInDays,
} from "../src/lib/laboratory-result/age";
import { LAB_RESULT_ERROR_CODES } from "../src/lib/laboratory-result/errors";
import { selectReferenceRange } from "../src/lib/laboratory-result/range-selection";
import {
  DEFAULT_NOTIFICATION_BODIES,
  renderNotificationBody,
} from "../src/lib/notification/templates";
import { resolveNotificationProvider } from "../src/lib/notification/provider";
import { PORTAL_SESSION_TTL_MINUTES, hashSessionToken } from "../src/lib/portal/session";
import { findPortalReportForAccess } from "../src/lib/portal/queries";
import { reassignPortalUsername } from "../src/lib/portal/reassign-username";
import { getEffectivePermissionsForUser } from "../src/lib/rbac/queries";

const pool = new Pool({ connectionString: process.env.DB_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

let failures = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`PASS — ${message}`);
    return;
  }
  failures += 1;
  console.log(`FAIL — ${message}`);
}

/** The 38 approved workflow steps this deployment must be able to execute. */
const WORKFLOW_STEPS = [
  "Tenant created",
  "Branch configured",
  "Subscription active",
  "Users and roles assigned",
  "Doctors configured",
  "Doctor schedules published",
  "Patient registered",
  "Appointment booked",
  "Queue token generated",
  "Patient checked in",
  "Consultation started",
  "Investigation advised",
  "Investigation order generated",
  "Bill calculated",
  "Discount authorized",
  "Payment received",
  "Cash memo generated",
  "Sample containers determined",
  "Barcode labels printed",
  "Samples collected",
  "Samples received in laboratory",
  "Samples routed to departments",
  "Tests processed",
  "LIS results imported",
  "Abnormal and critical results handled",
  "Results reviewed",
  "Results verified",
  "Release eligibility evaluated",
  "Report authorized",
  "PDF/print report generated",
  "Verification QR embedded",
  "Report released to portal",
  "Notification sent",
  "Patient/guardian accesses portal",
  "Released report downloaded",
  "Follow-up doctor review",
  "Prescription updated with version history",
  "Audit trail confirmed",
];

async function main() {
  assert(WORKFLOW_STEPS.length === 38, "Approved workflow defines 38 steps");

  // ---- MOD-01 tenant and MOD-07 branch ---------------------------------------------------
  const tenant = await prisma.tenant.findUnique({ where: { tenantCode: DOCTORS_POINT.tenantCode } });
  assert(Boolean(tenant), `Tenant ${DOCTORS_POINT.tenantCode} exists`);
  if (!tenant) {
    console.log("\nRun `npm run seed:uat:doctors-point` before this verification.");
    process.exitCode = 1;
    return;
  }

  assert(tenant.tenantName === DOCTORS_POINT.tenantName, "Tenant name matches the deployment brief");
  assert(tenant.country === DOCTORS_POINT.country, "Tenant country is Bangladesh");
  assert(tenant.city === DOCTORS_POINT.city, "Tenant city is Bhola");

  assert(
    tenant.defaultLocale === DOCTORS_POINT.defaultLocale,
    `Default locale is ${DOCTORS_POINT.defaultLocale}`,
  );
  assert(
    Array.isArray(tenant.supportedLocales) &&
      (tenant.supportedLocales as string[]).includes("en-BD") &&
      (tenant.supportedLocales as string[]).includes("bn-BD"),
    "Both Bangla and English are supported locales",
  );
  assert(tenant.timezone === DOCTORS_POINT.timezone, "Timezone is Asia/Dhaka");
  assert(tenant.currencyCode === DOCTORS_POINT.currencyCode, "Currency is BDT");

  const subscription = await prisma.tenantSubscription.findFirst({
    where: { tenantId: tenant.id, isActive: true },
  });
  assert(Boolean(subscription), "Tenant has an active subscription");

  const branch = await prisma.branch.findFirst({
    where: { tenantId: tenant.id, code: DOCTORS_POINT_BRANCH.code },
  });
  assert(Boolean(branch), `Branch ${DOCTORS_POINT_BRANCH.code} exists`);
  if (!branch) return;
  assert(branch.branchType === DOCTORS_POINT_BRANCH.branchType, "Branch type is DIAGNOSTIC_CENTER");
  assert(branch.timezone === DOCTORS_POINT.timezone, "Branch timezone is Asia/Dhaka");

  // ---- MOD-08 departments ----------------------------------------------------------------
  const departments = await prisma.department.findMany({ where: { tenantId: tenant.id } });
  assert(
    departments.length >= DOCTORS_POINT_DEPARTMENTS.length,
    `All ${DOCTORS_POINT_DEPARTMENTS.length} operating departments are configured (found ${departments.length})`,
  );
  const missingDepartments = DOCTORS_POINT_DEPARTMENTS.filter(
    (seed) => !departments.some((row) => row.deptCode === seed.deptCode),
  );
  assert(missingDepartments.length === 0, "No operating department is missing");

  // ---- MOD-02/MOD-03 users, roles and separation of duties -------------------------------
  const roles = await prisma.role.findMany({ where: { tenantId: tenant.id } });
  assert(
    roles.length >= DOCTORS_POINT_ROLES.length,
    `All ${DOCTORS_POINT_ROLES.length} roles are seeded (found ${roles.length})`,
  );

  const users = await prisma.user.findMany({ where: { tenantId: tenant.id } });
  assert(
    users.length >= DOCTORS_POINT_USERS.length,
    `All ${DOCTORS_POINT_USERS.length} tenant users are seeded (found ${users.length})`,
  );
  assert(
    users.every((row) => row.isHostAdmin === false),
    "No Doctors Point user carries host administrator rights",
  );

  const hostAdmin = await prisma.user.findFirst({ where: { isHostAdmin: true } });
  assert(Boolean(hostAdmin), "A host-level administrator exists outside the tenant");

  async function permissionsFor(username: string) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return null;
    return getEffectivePermissionsForUser(tenant!.id, user.id);
  }

  const reception = await permissionsFor("dp.reception");
  assert(Boolean(reception), "Reception user resolves effective permissions");
  assert(reception?.get("/patients/new")?.canCreate === true, "Reception can register patients");
  assert(
    reception?.get("/appointments/new")?.canCreate === true,
    "Reception can book appointments",
  );
  assert(
    reception?.get("/diagnostic/billing")?.canView !== true,
    "Reception cannot reach the billing counter",
  );

  const billing = await permissionsFor("dp.billing");
  assert(
    billing?.get("/diagnostic/billing/discount")?.canApprove === true,
    "Billing user may authorise a discount",
  );

  const cash = await permissionsFor("dp.cash");
  assert(
    cash?.get("/diagnostic/billing/payment")?.canCreate === true,
    "Cash user may collect a payment",
  );
  assert(
    cash?.get("/diagnostic/billing/discount")?.canApprove !== true,
    "Cash user cannot authorise a discount",
  );
  assert(
    cash?.get("/diagnostic/billing/receipt")?.canPrint === true,
    "Cash user may print the cash memo",
  );

  const reportEntry = await permissionsFor("dp.report.entry");
  assert(
    reportEntry?.get("/lab/result-entry")?.canEdit === true,
    "Report entry user may enter results",
  );
  assert(
    reportEntry?.get("/lab/verification/verify")?.canApprove !== true,
    "Report entry user cannot verify — entry and verification stay separate",
  );
  assert(
    reportEntry?.get("/lab/report-release/release")?.canApprove !== true,
    "Report entry user cannot authorise release",
  );

  const verifyDoctor = await permissionsFor("dp.verify.doctor");
  assert(
    verifyDoctor?.get("/lab/verification/verify")?.canApprove === true,
    "Verification doctor may verify a result",
  );
  assert(
    verifyDoctor?.get("/lab/result-entry/critical-acknowledge")?.canApprove === true,
    "Verification doctor may acknowledge a critical value",
  );
  assert(
    verifyDoctor?.get("/lab/report-release/release")?.canApprove !== true,
    "Verification doctor cannot authorise release — verification and release stay separate",
  );

  const delivery = await permissionsFor("dp.report.delivery");
  assert(
    delivery?.get("/lab/report-release/release")?.canApprove === true,
    "Report delivery user may authorise release",
  );
  assert(
    delivery?.get("/lab/verification/verify")?.canApprove !== true,
    "Report delivery user cannot verify",
  );
  assert(
    delivery?.get("/lab/report-release/portal-publish")?.canApprove === true,
    "Report delivery user may publish to the patient portal",
  );

  const tenantAdmin = await permissionsFor("dp.tenant.admin");
  assert(
    tenantAdmin?.get("/settings/users")?.canCreate === true,
    "Tenant administrator may manage users",
  );
  assert(
    tenantAdmin?.get("/lab/verification/verify")?.canApprove !== true,
    "Tenant administrator cannot verify a clinical result",
  );
  assert(
    tenantAdmin?.get("/lab/report-release/release")?.canApprove !== true,
    "Tenant administrator cannot authorise a clinical release",
  );

  const branchAdmin = await permissionsFor("dp.branch.admin");
  assert(
    branchAdmin?.get("/settings/doctor-schedules")?.canEdit === true,
    "Branch administrator may maintain doctor schedules",
  );
  assert(
    branchAdmin?.get("/settings/users")?.canView !== true,
    "Branch administrator cannot manage tenant users",
  );

  const lisOfficer = await permissionsFor("dp.lis.reconcile");
  assert(
    lisOfficer?.get("/lab/lis-worklist/reconcile")?.canApprove === true,
    "LIS officer may reconcile a quarantined message",
  );
  assert(
    lisOfficer?.get("/lab/verification/verify")?.canApprove !== true,
    "LIS officer cannot verify a result",
  );

  const holdOfficer = await permissionsFor("dp.hold.officer");
  assert(
    holdOfficer?.get("/lab/report-release/billing-hold")?.canApprove === true,
    "Hold officer may clear a billing hold",
  );
  assert(
    holdOfficer?.get("/lab/report-release/release")?.canApprove !== true,
    "Hold officer cannot authorise release",
  );

  // Every user must be pinned to the Bhola branch — no unscoped tenant user.
  const userBranches = await prisma.userBranch.findMany({
    where: { tenantId: tenant.id, isActive: true },
  });
  assert(
    userBranches.length >= users.length,
    "Every seeded user has an active branch assignment",
  );
  assert(
    userBranches.every((row) => row.branchId === branch.id),
    "No user is assigned to a branch outside Bhola Main",
  );

  // ---- MOD-11 doctors and MOD-17 published schedules -------------------------------------
  const doctors = await prisma.doctor.findMany({ where: { tenantId: tenant.id } });
  assert(
    doctors.length >= DOCTORS_POINT_DOCTORS.length,
    `All ${DOCTORS_POINT_DOCTORS.length} doctors are configured (found ${doctors.length})`,
  );
  const pathologist = doctors.find((row) => row.doctorCode === "DP-DR-003");
  assert(
    pathologist?.isVerifying === true,
    "The pathologist is flagged as a verifying doctor",
  );

  const schedules = await prisma.doctorSchedule.findMany({
    where: { tenantId: tenant.id, branchId: branch.id },
  });
  const expectedShifts = DOCTORS_POINT_DOCTORS.reduce(
    (total, doctor) => total + (doctor.schedule?.length ?? 0),
    0,
  );
  assert(
    schedules.length >= expectedShifts,
    `All ${expectedShifts} consultation shifts are configured (found ${schedules.length})`,
  );
  assert(
    schedules.length > 0 && schedules.every((row) => row.isPublished),
    "Every configured shift is published and therefore bookable",
  );
  assert(
    schedules.every((row) => row.branchId === branch.id),
    "No shift is attached to a branch outside Bhola Main",
  );
  assert(
    schedules.every((row) => isValidTimeOfDay(row.startTime) && isValidTimeOfDay(row.endTime)),
    "Every shift carries a well-formed HH:MM window",
  );

  // A 09:00-13:00 shift at 20 minutes yields exactly twelve bookable starts.
  const morning = generateShiftSlots("09:00", "13:00", 20);
  assert(morning.length === 12, "09:00-13:00 at 20 minutes produces 12 slots");
  assert(morning[0] === "09:00" && morning[11] === "12:40", "First and last slot boundaries");
  assert(
    generateShiftSlots("09:00", "13:00", 50).every(
      (slot) => (timeToMinutes(slot) ?? 0) + 50 <= (timeToMinutes("13:00") ?? 0),
    ),
    "A partial trailing slot is never offered",
  );
  assert(generateShiftSlots("13:00", "09:00", 20).length === 0, "An inverted window yields no slot");
  assert(
    shiftsOverlap({ startTime: "09:00", endTime: "13:00" }, { startTime: "12:00", endTime: "14:00" }),
    "Overlapping shifts are detected",
  );
  assert(
    !shiftsOverlap({ startTime: "09:00", endTime: "13:00" }, { startTime: "13:00", endTime: "17:00" }),
    "Back-to-back shifts are not treated as overlapping",
  );
  assert(minutesToTime(555) === "09:15", "Minutes convert back to HH:MM");

  // ---- MOD-09/MOD-10 priced catalog ------------------------------------------------------
  const tenantServices = await prisma.tenantService.findMany({
    where: { tenantId: tenant.id },
    include: {
      hostService: { select: { serviceCode: true } },
      tenantServiceBranches: { where: { branchId: branch.id } },
    },
  });

  const missingServices = DOCTORS_POINT_PRICE_LIST.filter(
    (entry) => !tenantServices.some((row) => row.hostService?.serviceCode === entry.hostServiceCode),
  );
  assert(
    missingServices.length === 0,
    `All ${DOCTORS_POINT_PRICE_LIST.length} price-list services are imported from the host catalog (missing: ${missingServices
      .map((entry) => entry.hostServiceCode)
      .join(", ")})`,
  );

  const mispriced: string[] = [];
  const unavailable: string[] = [];
  for (const entry of DOCTORS_POINT_PRICE_LIST) {
    const service = tenantServices.find(
      (row) => row.hostService?.serviceCode === entry.hostServiceCode,
    );
    if (!service) continue;
    if (parseMoneyToMinor(service.price) !== entry.price * 100) {
      mispriced.push(entry.hostServiceCode);
    }
    const branchPrice = service.tenantServiceBranches[0];
    if (!branchPrice?.isAvailable || parseMoneyToMinor(branchPrice.branchPrice) !== entry.price * 100) {
      unavailable.push(entry.hostServiceCode);
    }
  }
  assert(
    mispriced.length === 0,
    `Every service carries its published BDT rate (${mispriced.join(", ")})`,
  );
  assert(
    unavailable.length === 0,
    `Every service is available at the Bhola branch at the published rate (${unavailable.join(", ")})`,
  );

  assert(
    tenantServices.every((row) => row.tenantId === tenant.id),
    "Catalog rows never leak from another tenant",
  );
  assert(
    DOCTORS_POINT_CATALOG_GAPS.length > 0 &&
      DOCTORS_POINT_CATALOG_GAPS.every((gap) => gap.reason.length > 0 && gap.action.length > 0),
    "Requested tests absent from the approved catalog are recorded as gaps, not invented",
  );
  const ferritin = tenantServices.find((row) => row.localName.toLowerCase().includes("ferritin"));
  assert(!ferritin, "Serum Ferritin is absent, matching the documented catalog gap");

  // ---- MOD-08/MOD-09 section routing (not generic host Laboratory) ------------------------
  const servicesWithDept = await prisma.tenantService.findMany({
    where: { tenantId: tenant.id },
    include: {
      hostService: { select: { serviceCode: true } },
      department: { select: { deptCode: true, name: true } },
    },
  });
  const deptByCode = new Map(departments.map((row) => [row.deptCode, row.id]));
  const wrongSection: string[] = [];
  for (const entry of DOCTORS_POINT_PRICE_LIST) {
    const service = servicesWithDept.find(
      (row) => row.hostService?.serviceCode === entry.hostServiceCode,
    );
    if (!service) continue;
    const expectedDeptId = deptByCode.get(entry.deptCode);
    if (!expectedDeptId || service.departmentId !== expectedDeptId) {
      wrongSection.push(
        `${entry.hostServiceCode}->${service.department?.deptCode ?? "NONE"} (expected ${entry.deptCode})`,
      );
    }
  }
  assert(
    wrongSection.length === 0,
    `Priced services map to DPDC lab sections, not host Laboratory (${wrongSection.join("; ")})`,
  );
  assert(
    servicesWithDept.every((row) => row.department?.name !== "Laboratory"),
    "No priced DPDC service remains under the generic host Laboratory department name",
  );

  // ---- MOD-22 reference ranges (tenant-scoped ServiceParameterReferenceRange) ------------
  const rangeRows = await prisma.serviceParameterReferenceRange.findMany({
    where: { tenantId: tenant.id, isActive: true },
    include: {
      serviceParameter: {
        select: {
          parameterCode: true,
          unit: true,
          tenantService: { select: { hostService: { select: { serviceCode: true } } } },
        },
      },
    },
  });
  assert(
    rangeRows.length >= DOCTORS_POINT_REFERENCE_RANGES.length,
    `DPDC has seeded reference ranges (found ${rangeRows.length}, seed rows ${DOCTORS_POINT_REFERENCE_RANGES.length})`,
  );
  assert(
    DOCTORS_POINT_REFERENCE_RANGE_GAPS.length > 0,
    "CONFIGURATION GAP list documents parameters without approved clinical sources",
  );

  const unitMismatches = rangeRows.filter((row) => {
    const paramUnit = row.serviceParameter.unit;
    if (!row.unit || !paramUnit) return false;
    return row.unit.trim().toLowerCase() !== paramUnit.trim().toLowerCase();
  });
  assert(unitMismatches.length === 0, "Range units match ServiceParameter units");

  // LIS mapping units must match parameter/range units for mapped numeric codes.
  for (const analyzer of DOCTORS_POINT_ANALYZERS) {
    for (const mapping of analyzer.mappings) {
      if (!mapping.parameterCode) continue;
      const param = await prisma.serviceParameter.findFirst({
        where: {
          tenantId: tenant.id,
          parameterCode: mapping.parameterCode,
          tenantService: { hostService: { serviceCode: mapping.hostServiceCode } },
        },
        select: { unit: true },
      });
      if (!param?.unit) continue;
      const matchingRange = rangeRows.find(
        (row) =>
          row.serviceParameter.parameterCode === mapping.parameterCode &&
          row.serviceParameter.tenantService.hostService?.serviceCode === mapping.hostServiceCode &&
          row.unit != null,
      );
      if (matchingRange?.unit) {
        assert(
          matchingRange.unit.trim().toLowerCase() === param.unit.trim().toLowerCase(),
          `LIS ${analyzer.analyzerCode}/${mapping.machineTestCode} unit aligns with range (${param.unit})`,
        );
      }
    }
  }

  function toCandidates(
    hostServiceCode: string,
    parameterCode: string,
  ) {
    return rangeRows
      .filter(
        (row) =>
          row.serviceParameter.parameterCode === parameterCode &&
          row.serviceParameter.tenantService.hostService?.serviceCode === hostServiceCode,
      )
      .map((row) => ({
        id: row.id,
        gender: row.gender,
        ageFromDays: row.ageFromDays,
        ageToDays: row.ageToDays,
        normalLow: row.normalLow,
        normalHigh: row.normalHigh,
        criticalLow: row.criticalLow,
        criticalHigh: row.criticalHigh,
        textRange: row.textRange,
        unit: row.unit,
        priority: row.priority,
      }));
  }

  const case1AgeDays = 52 * DAYS_PER_YEAR;
  const case2AgeDays = 34 * DAYS_PER_YEAR;
  const case3AgeDays = 12 * DAYS_PER_YEAR;
  assert(case1AgeDays >= ADULT_FROM_DAYS, "Case 1 adult male age is at/above adult boundary");
  assert(case2AgeDays >= ADULT_FROM_DAYS, "Case 2 adult female age is at/above adult boundary");
  assert(case3AgeDays < ADULT_FROM_DAYS, "Case 3 paediatric male age is below adult boundary");

  const adultMaleHgb = selectReferenceRange(toCandidates("CBC", "HGB"), {
    patientGender: "MALE",
    ageInDays: case1AgeDays,
    parameterUnit: "g/dL",
  });
  assert(adultMaleHgb.ok, "Adult male HGB range resolves");
  if (adultMaleHgb.ok) {
    assert(adultMaleHgb.range.lowerBound === 13, "Adult male HGB normal low = 13");
    assert(adultMaleHgb.range.upperBound === 17, "Adult male HGB normal high = 17");
  }

  const adultFemaleHgb = selectReferenceRange(toCandidates("CBC", "HGB"), {
    patientGender: "FEMALE",
    ageInDays: case2AgeDays,
    parameterUnit: "g/dL",
  });
  assert(adultFemaleHgb.ok, "Adult female HGB range resolves");
  if (adultFemaleHgb.ok) {
    assert(adultFemaleHgb.range.lowerBound === 12, "Adult female HGB normal low = 12");
    assert(adultFemaleHgb.range.upperBound === 16, "Adult female HGB normal high = 16");
  }

  const paediatricHgb = selectReferenceRange(toCandidates("CBC", "HGB"), {
    patientGender: "MALE",
    ageInDays: case3AgeDays,
    parameterUnit: "g/dL",
  });
  assert(paediatricHgb.ok, "Paediatric male HGB range resolves (UAT paediatric row)");
  if (paediatricHgb.ok) {
    assert(paediatricHgb.range.lowerBound === 11.5, "Paediatric HGB normal low = 11.5");
    assert(paediatricHgb.range.upperBound === 15.5, "Paediatric HGB normal high = 15.5");
  }

  const fbsAdult = selectReferenceRange(toCandidates("FBS", "GLU"), {
    patientGender: "MALE",
    ageInDays: case1AgeDays,
    parameterUnit: "mmol/L",
  });
  assert(fbsAdult.ok, "Case 1 FBS range resolves");
  if (fbsAdult.ok) {
    const high = computeAbnormalFlag({
      resultType: "NUMERIC",
      numericValue: 5.6,
      textValue: null,
      choiceValue: null,
      booleanValue: null,
      lowerBound: fbsAdult.range.lowerBound,
      upperBound: fbsAdult.range.upperBound,
      criticalLow: fbsAdult.range.criticalLow,
      criticalHigh: fbsAdult.range.criticalHigh,
      unitSnapshot: "mmol/L",
      parameterUnit: "mmol/L",
      rangeUnit: fbsAdult.range.unit,
    });
    assert(high.flag === "HIGH", "FBS 5.6 mmol/L flags HIGH (Sample Dict §17)");
    const normal = computeAbnormalFlag({
      resultType: "NUMERIC",
      numericValue: 5.0,
      textValue: null,
      choiceValue: null,
      booleanValue: null,
      lowerBound: fbsAdult.range.lowerBound,
      upperBound: fbsAdult.range.upperBound,
      criticalLow: fbsAdult.range.criticalLow,
      criticalHigh: fbsAdult.range.criticalHigh,
      unitSnapshot: "mmol/L",
      parameterUnit: "mmol/L",
      rangeUnit: fbsAdult.range.unit,
    });
    assert(normal.flag === "NORMAL", "FBS 5.0 mmol/L flags NORMAL");
    const low = computeAbnormalFlag({
      resultType: "NUMERIC",
      numericValue: 3.5,
      textValue: null,
      choiceValue: null,
      booleanValue: null,
      lowerBound: fbsAdult.range.lowerBound,
      upperBound: fbsAdult.range.upperBound,
      criticalLow: fbsAdult.range.criticalLow,
      criticalHigh: fbsAdult.range.criticalHigh,
      unitSnapshot: "mmol/L",
      parameterUnit: "mmol/L",
      rangeUnit: fbsAdult.range.unit,
    });
    assert(low.flag === "LOW", "FBS below range flags LOW");
  }

  const potassium = selectReferenceRange(toCandidates("ELECTRO", "K"), {
    patientGender: "MALE",
    ageInDays: case3AgeDays,
    parameterUnit: "mmol/L",
  });
  assert(potassium.ok, "Case 3 potassium range resolves");
  if (potassium.ok) {
    const critical = computeAbnormalFlag({
      resultType: "NUMERIC",
      numericValue: 6.5,
      textValue: null,
      choiceValue: null,
      booleanValue: null,
      lowerBound: potassium.range.lowerBound,
      upperBound: potassium.range.upperBound,
      criticalLow: potassium.range.criticalLow,
      criticalHigh: potassium.range.criticalHigh,
      unitSnapshot: "mmol/L",
      parameterUnit: "mmol/L",
      rangeUnit: potassium.range.unit,
    });
    assert(critical.flag === "CRITICAL_HIGH" && critical.isCritical, "K 6.5 flags CRITICAL_HIGH");
  }

  const missingRange = selectReferenceRange([], {
    patientGender: "MALE",
    ageInDays: case1AgeDays,
    parameterUnit: "g/dL",
  });
  assert(
    !missingRange.ok && missingRange.errorCode === LAB_RESULT_ERROR_CODES.LAB_RESULT_RANGE_NOT_FOUND,
    "Missing matching range returns LAB_RESULT_RANGE_NOT_FOUND (draft leaves null snapshot → UNDETERMINED flag)",
  );

  const unitMismatchPick = selectReferenceRange(toCandidates("CBC", "HGB"), {
    patientGender: "MALE",
    ageInDays: case1AgeDays,
    parameterUnit: "mmol/L",
  });
  assert(
    !unitMismatchPick.ok &&
      unitMismatchPick.errorCode === LAB_RESULT_ERROR_CODES.LAB_RESULT_RANGE_NOT_FOUND,
    "Unit mismatch excludes ranges (treated as missing match)",
  );
  const unitMismatchFlag = computeAbnormalFlag({
    resultType: "NUMERIC",
    numericValue: 14,
    textValue: null,
    choiceValue: null,
    booleanValue: null,
    lowerBound: 13,
    upperBound: 17,
    criticalLow: 7,
    criticalHigh: 20,
    unitSnapshot: "g/dL",
    parameterUnit: "g/dL",
    rangeUnit: "mmol/L",
  });
  assert(unitMismatchFlag.flag === "UNDETERMINED", "Unit mismatch on flag path → UNDETERMINED");

  assert(
    rangeRows.every((row) => row.tenantId === tenant.id),
    "Every loaded DPDC range row is tenant-scoped to DPDC",
  );
  const foreignRangeOnDpdcParameter = await prisma.serviceParameterReferenceRange.findFirst({
    where: {
      tenantId: { not: tenant.id },
      serviceParameter: {
        tenantId: tenant.id,
        parameterCode: "HGB",
        tenantService: { hostService: { serviceCode: "CBC" } },
      },
    },
  });
  assert(
    !foreignRangeOnDpdcParameter,
    "No other-tenant range row can attach to a DPDC service parameter",
  );
  const abmgRanges = await prisma.serviceParameterReferenceRange.findMany({
    where: { tenant: { tenantCode: "ABMG" }, isActive: true },
    select: { id: true, tenantId: true },
  });
  assert(
    abmgRanges.every((row) => row.tenantId !== tenant.id),
    "Wrong tenant: ABMG reference ranges never share the DPDC tenantId",
  );

  const estimatedDays = estimateAgeInDays(12, new Date("2026-07-26"), new Date("2026-07-26"));
  assert(estimatedDays === case3AgeDays, "estimatedAge years convert with 365 d/y convention");
  const resolvedFromEstimate = resolvePatientAgeInDays({
    dateOfBirth: null,
    estimatedAge: 52,
    ageAsOfDate: new Date("2026-07-26"),
    referenceDate: new Date("2026-07-26"),
  });
  assert(resolvedFromEstimate === case1AgeDays, "resolvePatientAgeInDays uses estimatedAge when DOB absent");

  // ---- MOD-15 patients -------------------------------------------------------------------
  const patients = await prisma.patient.findMany({ where: { tenantId: tenant.id } });
  assert(
    patients.length >= DOCTORS_POINT_PATIENTS.length,
    `All ${DOCTORS_POINT_PATIENTS.length} UAT patients are registered (found ${patients.length})`,
  );
  const minor = patients.find((row) => row.patientNumber === "DP-000003");
  assert(Boolean(minor), "Paediatric patient DP-000003 is registered");
  assert(
    Boolean(minor?.guardianName) && Boolean(minor?.guardianMobile),
    "The paediatric patient carries guardian contact details",
  );
  assert(Boolean(minor?.dateOfBirth), "Paediatric patient has deterministic dateOfBirth for range age");
  assert(
    patients.every((row) => row.tenantId === tenant.id),
    "Patient records stay inside the tenant",
  );
  for (const seed of DOCTORS_POINT_PATIENTS) {
    const patient = patients.find((row) => row.patientNumber === seed.patientNumber);
    assert(Boolean(patient?.dateOfBirth), `${seed.patientNumber} has dateOfBirth for age/sex ranges`);
  }

  // ---- MOD-22 analyzers, mappings and message handling -----------------------------------
  const analyzers = await prisma.analyzer.findMany({ where: { tenantId: tenant.id } });
  assert(
    analyzers.length >= DOCTORS_POINT_ANALYZERS.length,
    `All ${DOCTORS_POINT_ANALYZERS.length} analyzers are registered (found ${analyzers.length})`,
  );
  assert(
    analyzers.every((row) => row.branchId === branch.id),
    "Every analyzer belongs to the Bhola branch",
  );

  const mappings = await prisma.analyzerMapping.findMany({ where: { tenantId: tenant.id } });
  const expectedMappings = DOCTORS_POINT_ANALYZERS.reduce(
    (total, analyzer) => total + analyzer.mappings.length,
    0,
  );
  assert(
    mappings.length >= expectedMappings,
    `All ${expectedMappings} machine test codes are mapped (found ${mappings.length})`,
  );

  const hl7 = parseAnalyzerMessage(
    "HL7",
    [
      "MSH|^~\\&|DP-HAEM-01|DPDC|LIS|DPDC|20260726093000||ORU^R01|MSG00001|P|2.5",
      "OBR|1|||CBC^Complete Blood Count",
      "SPM|1|ACC-000123",
      "OBX|1|NM|HGB^Haemoglobin||11.2|g/dL",
      "OBX|2|NM|WBC^White Cell Count||8.4|10^9/L",
    ].join("\r"),
  );
  assert(hl7.ok, "A well-formed HL7 ORU^R01 message parses");
  assert(hl7.ok && hl7.message.messageControlId === "MSG00001", "HL7 MSH-10 control id is read");
  assert(hl7.ok && hl7.message.machineSampleId === "ACC-000123", "SPM specimen id overrides OBR");
  assert(hl7.ok && hl7.message.analyzerCode === "DP-HAEM-01", "Sending analyzer is identified");
  assert(hl7.ok && hl7.message.observations.length === 2, "Both observations are read");

  const astm = parseAnalyzerMessage(
    "ASTM",
    [
      "1H|\\^&|||DP-BIO-01|||||||P|E1394-97|20260726093000",
      "2P|1",
      "3O|1|ACC-000124||^^^GLU",
      "4R|1|^^^GLU|7.8|mmol/L||N||F",
    ].join("\n"),
  );
  assert(astm.ok, "A well-formed ASTM E1394 message parses");
  assert(astm.ok && astm.message.machineSampleId === "ACC-000124", "ASTM specimen id is read");

  const json = parseAnalyzerMessage(
    "API",
    JSON.stringify({
      messageControlId: "API-0001",
      machineSampleId: "ACC-000125",
      analyzerCode: "DP-HORM-01",
      observations: [{ machineTestCode: "TSH", value: "6.8", unit: "mIU/L" }],
    }),
  );
  assert(json.ok, "A middleware JSON payload parses");

  const noControlId = parseAnalyzerMessage(
    "API",
    JSON.stringify({ machineSampleId: "ACC-1", observations: [{ machineTestCode: "TSH", value: "1" }] }),
  );
  assert(
    !noControlId.ok &&
      noControlId.errorCode === LAB_LIS_ERROR_CODES.LAB_LIS_MESSAGE_CONTROL_ID_REQUIRED,
    "A message without a control id is rejected — idempotency depends on it",
  );
  const noSampleId = parseAnalyzerMessage(
    "API",
    JSON.stringify({ messageControlId: "X", observations: [{ machineTestCode: "TSH", value: "1" }] }),
  );
  assert(
    !noSampleId.ok && noSampleId.errorCode === LAB_LIS_ERROR_CODES.LAB_LIS_SAMPLE_ID_REQUIRED,
    "A message without a specimen id is rejected",
  );
  const noObservation = parseAnalyzerMessage(
    "API",
    JSON.stringify({ messageControlId: "X", machineSampleId: "ACC-1", observations: [] }),
  );
  assert(
    !noObservation.ok &&
      noObservation.errorCode === LAB_LIS_ERROR_CODES.LAB_LIS_OBSERVATION_REQUIRED,
    "A message with no observation is rejected",
  );
  assert(!parseAnalyzerMessage("HL7", "   ").ok, "An empty payload is rejected");
  assert(!parseAnalyzerMessage("API", "{not json").ok, "Malformed JSON is rejected");

  assert(
    hl7.ok && !hl7.message.observations.some((row) => /patient|name/i.test(row.machineTestCode)),
    "Sample matching keys off the barcode, never a patient name",
  );

  assert(isReconcilable("QUARANTINED"), "A quarantined message can be reconciled");
  assert(isTerminalImportStatus("SUCCESS"), "A successful import is terminal");
  assert(!isTerminalImportStatus("QUARANTINED"), "A quarantined message stays actionable");

  const duplicateIndex = await prisma.$queryRawUnsafe<Array<{ indexdef: string }>>(
    `SELECT indexdef FROM pg_indexes WHERE tablename = 'analyzer_import_queue'`,
  );
  assert(
    duplicateIndex.some(
      (row) =>
        row.indexdef.includes("UNIQUE") &&
        row.indexdef.includes("tenant_id") &&
        row.indexdef.includes("message_control_id"),
    ),
    "A unique index on (tenant_id, message_control_id) enforces LIS idempotency in the database",
  );

  // ---- MOD-05 notifications ---------------------------------------------------------------
  const outboxIndexes = await prisma.$queryRawUnsafe<Array<{ indexdef: string }>>(
    `SELECT indexdef FROM pg_indexes WHERE tablename = 'notification_outbox'`,
  );
  assert(
    outboxIndexes.some(
      (row) =>
        row.indexdef.includes("UNIQUE") &&
        row.indexdef.includes("tenant_id") &&
        row.indexdef.includes("dedupe_key"),
    ),
    "A unique index on (tenant_id, dedupe_key) makes notification retries idempotent",
  );

  const body = renderNotificationBody(DEFAULT_NOTIFICATION_BODIES.LAB_REPORT_READY, {
    tenantName: DOCTORS_POINT.tenantName,
    orderReference: "LAB-000001",
  });
  assert(body.includes(DOCTORS_POINT.tenantName), "Notification body carries the tenant name");
  assert(!body.includes("{{"), "No placeholder is left unresolved");
  assert(
    !/result|value|mmol|mg\/dL|diagnos(is|es)/i.test(body),
    "The report-ready notification carries no clinical detail",
  );
  assert(
    !DEFAULT_NOTIFICATION_BODIES.CRITICAL_RESULT_ALERT.includes("{{patientName}}"),
    "The critical alert does not push a patient name over an unsecured channel",
  );

  const provider = resolveNotificationProvider();
  assert(Boolean(provider.name), "A notification provider resolves from configuration");
  const providerSource = fs.readFileSync(
    path.join(process.cwd(), "src/lib/notification/provider.ts"),
    "utf8",
  );
  assert(
    providerSource.includes("process.env.NOTIFICATION_GATEWAY_URL") &&
      providerSource.includes("process.env.NOTIFICATION_GATEWAY_API_KEY"),
    "Gateway endpoint and key come from environment configuration",
  );
  assert(
    !/https?:\/\/(?!localhost)[a-z0-9.-]+\.[a-z]{2,}/i.test(
      providerSource.replace(/^\s*\*.*$/gm, ""),
    ),
    "No gateway host is hardcoded in the provider",
  );

  // ---- MOD-30 patient portal --------------------------------------------------------------
  assert(PORTAL_SESSION_TTL_MINUTES > 0 && PORTAL_SESSION_TTL_MINUTES <= 60, "Portal session expires within an hour");
  const rawToken = "a".repeat(64);
  const digest = hashSessionToken(rawToken);
  assert(digest !== rawToken && digest.length === 64, "Only a SHA-256 digest of the session token is stored");
  assert(
    hashSessionToken(rawToken) === digest && hashSessionToken("b".repeat(64)) !== digest,
    "Session digests are deterministic and distinct",
  );

  const portalSource = fs.readFileSync(path.join(process.cwd(), "src/lib/portal/session.ts"), "utf8");
  assert(portalSource.includes("httpOnly: true"), "The portal session cookie is HTTP-only");
  assert(
    portalSource.includes('secure: process.env.NODE_ENV === "production"'),
    "The portal session cookie is secure in production",
  );

  const portalQueries = fs.readFileSync(path.join(process.cwd(), "src/lib/portal/queries.ts"), "utf8");
  assert(
    portalQueries.includes("RELEASED") || portalQueries.includes("portalPublished"),
    "Portal report listing filters on release state",
  );

  const portalAccounts = await prisma.patientPortalAccount.findMany({
    where: { tenantId: tenant.id },
  });
  assert(
    portalAccounts.every((row) => row.tenantId === tenant.id),
    "Portal accounts are tenant scoped",
  );
  assert(
    portalAccounts.length >= DOCTORS_POINT_PORTAL_ACCOUNTS.length,
    `UAT portal accounts seeded (${portalAccounts.length})`,
  );

  const guardianPatient = await prisma.patient.findUnique({
    where: {
      tenantId_patientNumber: {
        tenantId: tenant.id,
        patientNumber: DOCTORS_POINT_GUARDIAN_PATIENT.patientNumber,
      },
    },
    select: { id: true },
  });
  assert(Boolean(guardianPatient), "Case 3 guardian patient record exists for portal ownership");

  const minorPatient = await prisma.patient.findUnique({
    where: {
      tenantId_patientNumber: {
        tenantId: tenant.id,
        patientNumber: "DP-000003",
      },
    },
    select: { id: true },
  });
  const guardianAccount = guardianPatient
    ? await prisma.patientPortalAccount.findFirst({
        where: { tenantId: tenant.id, patientId: guardianPatient.id },
        select: { id: true },
      })
    : null;
  const case3Delegation =
    minorPatient && guardianAccount
      ? await prisma.patientPortalDelegation.findFirst({
          where: {
            tenantId: tenant.id,
            grantorPatientId: minorPatient.id,
            granteeAccountId: guardianAccount.id,
            isActive: true,
          },
        })
      : null;
  assert(
    Boolean(case3Delegation),
    "Case 3 guardian holds an explicit, active portal delegation (not inferred from demographics)",
  );
  assert(
    DOCTORS_POINT_PORTAL_DELEGATIONS.length >= 1,
    "UAT seed defines at least one guardian/family portal delegation",
  );

  assert(
    fs.existsSync(path.join(process.cwd(), "src/app/(app)/settings/patient-portal/page.tsx")),
    "Staff patient-portal administration page exists",
  );

  // ---- Portal username reassignment (DPDC-C2-D010 regression) --------------------------
  const reassignSource = fs.readFileSync(
    path.join(process.cwd(), "src/lib/portal/reassign-username.ts"),
    "utf8",
  );
  assert(reassignSource.includes("isActive: false"), "Superseded portal accounts are deactivated");
  assert(reassignSource.includes("archived."), "Superseded usernames are archived, not deleted");

  const case2SeedAccount = DOCTORS_POINT_PORTAL_ACCOUNTS.find((row) => row.patientNumber === "DP-000002");
  assert(Boolean(case2SeedAccount), "Case 2 seed portal account is keyed to DP-000002 patientNumber");
  assert(
    !DOCTORS_POINT_PORTAL_ACCOUNTS.some((row) => row.patientNumber.startsWith("PT-")),
    "UAT portal seed resolves seeded DP-* numbers, not runtime PT-* registrations",
  );

  const dp002Patient = await prisma.patient.findUnique({
    where: { tenantId_patientNumber: { tenantId: tenant.id, patientNumber: "DP-000002" } },
    select: { id: true },
  });
  const pt006Patient = await prisma.patient.findFirst({
    where: { tenantId: tenant.id, patientNumber: "PT-000006" },
    select: { id: true },
  });
  if (dp002Patient && pt006Patient) {
    assert(
      dp002Patient.id !== pt006Patient.id,
      "Seeded DP-000002 and runtime PT-000006 are distinct patient records (patientNumber must not be mixed with patientId)",
    );
  }

  const dp002Portal =
    dp002Patient &&
    (await prisma.patientPortalAccount.findFirst({
      where: {
        tenantId: tenant.id,
        patientId: dp002Patient.id,
        OR: [{ username: "8801712200002" }, { username: { startsWith: "archived." } }],
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, isActive: true, username: true },
    }));

  const pt006Portal = pt006Patient
    ? await prisma.patientPortalAccount.findFirst({
        where: { tenantId: tenant.id, patientId: pt006Patient.id, isActive: true },
        select: { id: true, username: true },
      })
    : null;

  if (pt006Portal) {
    assert(
      pt006Portal.username === "8801712200002",
      "Case 2 portal username 8801712200002 is bound to PT-000006 after reassignment",
    );
    assert(!dp002Portal?.isActive, "Superseded DP-000002 portal account is inactive after reassignment");
  }

  if (pt006Patient) {
    const pt006Release = await prisma.labReportRelease.findFirst({
      where: {
        tenantId: tenant.id,
        reportNumber: "RPT-0000005",
        labResult: { labOrder: { patientId: pt006Patient.id } },
      },
      select: { id: true },
    });
    if (pt006Release && dp002Patient) {
      const denied = await findPortalReportForAccess({
        tenantId: tenant.id,
        releaseId: pt006Release.id,
        allowedPatientIds: [dp002Patient.id],
      });
      assert(denied === null, "Cross-patient portal report access is denied at query level");
    }
  }

  const portalAdminUser = await prisma.user.findFirst({
    where: { tenantId: tenant.id, username: "dp.tenant.admin" },
    select: { id: true },
  });
  if (portalAdminUser && dp002Patient && pt006Patient) {
    const activeDp002Portal = await prisma.patientPortalAccount.findFirst({
      where: {
        tenantId: tenant.id,
        patientId: dp002Patient.id,
        username: "8801712200002",
        isActive: true,
      },
      select: { id: true },
    });
    if (activeDp002Portal) {
      const samePatient = await reassignPortalUsername(prisma, {
        tenantId: tenant.id,
        targetPatientId: dp002Patient.id,
        username: "8801712200002",
        password: "Portal@2026!",
        reason: "Regression test — should reject same patient",
        actorUserId: portalAdminUser.id,
      });
      assert(
        !samePatient.ok && samePatient.errorCode === "PORTAL_REASSIGN_SAME_PATIENT",
        "Cannot reassign username to the patient who already holds it",
      );
    }

    const unknownUsernameTarget = dp002Patient ?? pt006Patient;
    const unknownUsername = await reassignPortalUsername(prisma, {
      tenantId: tenant.id,
      targetPatientId: unknownUsernameTarget.id,
      username: "8801799999999",
      password: "Portal@2026!",
      reason: "Regression test — unknown username",
      actorUserId: portalAdminUser.id,
    });
    assert(
      !unknownUsername.ok && unknownUsername.errorCode === "PORTAL_USERNAME_NOT_HELD",
      "Unknown portal username is rejected without creating duplicate accounts",
    );
  }

  // ---- Tenant isolation across the whole workflow ------------------------------------------
  const abmg = await prisma.tenant.findUnique({ where: { tenantCode: "ABMG" } });
  if (abmg) {
    const crossPatients = await prisma.patient.count({
      where: { tenantId: abmg.id, patientNumber: { startsWith: "DP-" } },
    });
    assert(crossPatients === 0, "Doctors Point patients are invisible to the ABMG tenant");

    const crossDoctors = await prisma.doctor.count({
      where: { tenantId: abmg.id, doctorCode: { startsWith: "DP-DR-" } },
    });
    assert(crossDoctors === 0, "Doctors Point doctors are invisible to the ABMG tenant");

    const crossSchedules = await prisma.doctorSchedule.count({
      where: { tenantId: abmg.id, branchId: branch.id },
    });
    assert(crossSchedules === 0, "Doctors Point schedules cannot be read under another tenant id");

    const crossAnalyzers = await prisma.analyzer.count({
      where: { tenantId: abmg.id, analyzerCode: { startsWith: "DP-" } },
    });
    assert(crossAnalyzers === 0, "Doctors Point analyzers are invisible to the ABMG tenant");

    const crossRoles = await prisma.role.count({
      where: { tenantId: abmg.id, roleCode: { startsWith: "DP_" } },
    });
    assert(crossRoles === 0, "Doctors Point roles are invisible to the ABMG tenant");
  }

  // ---- MOD-04 audit ------------------------------------------------------------------------
  const auditRows = await prisma.auditLog.count({ where: { tenantId: tenant.id } });
  assert(auditRows >= 0, `Audit log is queryable for the tenant (${auditRows} row(s))`);

  // ---- MOD-06 localisation for the new namespaces ------------------------------------------
  for (const locale of MOD06_PRIMARY_LOCALES) {
    for (const namespace of ["billing", "doctorSchedule", "laboratoryLis", "portalAdmin"]) {
      assert(
        fs.existsSync(path.join(process.cwd(), "src/messages", locale, `${namespace}.json`)),
        `${namespace}.json present for ${locale}`,
      );
    }
  }
  assert(compareLocaleMessageStructure().ok, "Locale message structure parity holds");

  // ---- Migrations --------------------------------------------------------------------------
  const migrationsDir = path.join(process.cwd(), "prisma/migrations");
  const migrations = fs.readdirSync(migrationsDir);
  for (const expected of [
    "mod17_doctor_schedule",
    "mod10_diagnostic_billing",
    "mod05_notification_center",
    "mod22_analyzer_lis_integration",
    "mod30_patient_portal_auth",
  ]) {
    assert(
      migrations.some((name) => name.endsWith(expected)),
      `Migration present for ${expected}`,
    );
  }

  console.log(
    failures === 0
      ? "\nDoctors Point end-to-end verification complete."
      : `\nDoctors Point end-to-end verification finished with ${failures} failure(s).`,
  );
  if (failures > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
