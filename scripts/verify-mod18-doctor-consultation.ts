/**
 * MOD-18 verification — clinical encounters, lifecycle, RBAC, registry.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { canTransitionStatus } from "../src/lib/appointment/constants";
import {
  canTransitionEncounterStatus,
  isEncounterEditable,
} from "../src/lib/consultation/constants";
import { ENCOUNTER_ERROR_CODES } from "../src/lib/consultation/errors";
import { allocateEncounterNumber, isValidEncounterNumber } from "../src/lib/consultation/number";
import {
  findActiveEncounterForAppointment,
  validateDoctorAtBranch,
} from "../src/lib/consultation/queries";
import {
  parseVitalsFormData,
  vitalsToDb,
} from "../src/lib/consultation/validation";
import { compareLocaleMessageStructure } from "../src/lib/i18n/completeness";
import { MOD06_PRIMARY_LOCALES, REQUIRED_MESSAGE_NAMESPACES } from "../src/lib/i18n/constants";
import { resolveTextDirectionForLocale } from "../src/lib/locale/registry";
import { validateMod18RegistryCompliance } from "../src/lib/module-governance-validate";
import { getEffectivePermissionsForUser } from "../src/lib/rbac/queries";
import { TENANT_PERMISSION_RESOURCES } from "../src/lib/rbac/permission-catalog";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

function buildFormData(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
}

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { tenantCode: "ABMG" } });
  assert(Boolean(tenant), "ABMG tenant exists");
  if (!tenant) return;

  const sampleEncounter = await prisma.clinicalEncounter.findFirst({
    where: { tenantId: tenant.id },
  });
  if (sampleEncounter) {
    assert(true, "ClinicalEncounter schema query works");
  } else {
    console.log("PASS: ClinicalEncounter schema query works (no rows yet)");
  }

  const doctor = await prisma.doctor.findFirst({
    where: { tenantId: tenant.id, doctorCode: "DR-OPD-001", isActive: true },
  });
  const branch = await prisma.branch.findFirst({
    where: { tenantId: tenant.id, code: "BR-HO-01", isActive: true },
  });
  const patient = await prisma.patient.findFirst({
    where: { tenantId: tenant.id, isActive: true },
  });
  assert(Boolean(doctor && branch && patient), "Seed doctor, branch, patient exist");

  const allocatedNumbers = await prisma.$transaction(async (tx) => {
    const first = await allocateEncounterNumber(tx, tenant.id);
    const second = await allocateEncounterNumber(tx, tenant.id);
    return [first, second];
  });
  assert(allocatedNumbers[0] !== allocatedNumbers[1], "Encounter numbers are sequential");
  assert(isValidEncounterNumber(allocatedNumbers[0]), "Encounter number format EN-000001");

  if (doctor && branch) {
    const doctorAtBranch = await validateDoctorAtBranch(tenant.id, doctor.id, branch.id);
    assert(Boolean(doctorAtBranch), "Doctor assigned to branch validates");
  }

  const invalidVitals = parseVitalsFormData(
    buildFormData({ systolicBp: "200", diastolicBp: "210" }),
  );
  assert(
    "errorCode" in invalidVitals && invalidVitals.errorCode === ENCOUNTER_ERROR_CODES.VITALS_INVALID,
    "Invalid blood pressure blocked",
  );

  const validVitals = parseVitalsFormData(
    buildFormData({ heightCm: "170", weightKg: "70", pulseBpm: "72" }),
  );
  assert(!("errorCode" in validVitals), "Valid vitals parse");
  if (!("errorCode" in validVitals)) {
    const dbVitals = vitalsToDb(validVitals);
    assert(dbVitals.bmi !== null && dbVitals.bmi > 20 && dbVitals.bmi < 30, "BMI calculated server-side");
  }

  assert(canTransitionEncounterStatus("IN_PROGRESS", "COMPLETED"), "IN_PROGRESS to COMPLETED allowed");
  assert(!canTransitionEncounterStatus("COMPLETED", "CANCELLED"), "COMPLETED to CANCELLED blocked");
  assert(
    canTransitionEncounterStatus("COMPLETED", "IN_PROGRESS", true),
    "Reopen transition allowed with flag",
  );
  assert(!isEncounterEditable("COMPLETED"), "Completed encounter not editable");

  assert(canTransitionStatus("CALLED", "IN_CONSULTATION"), "MOD-17 CALLED to IN_CONSULTATION exists");
  assert(canTransitionStatus("IN_CONSULTATION", "COMPLETED"), "MOD-17 IN_CONSULTATION to COMPLETED exists");

  const appointment = await prisma.appointment.findFirst({
    where: {
      tenantId: tenant.id,
      status: { in: ["WAITING", "CALLED", "IN_CONSULTATION", "SCHEDULED"] },
    },
  });
  if (appointment) {
    const active = await findActiveEncounterForAppointment(tenant.id, appointment.id);
    if (active) {
      assert(active.appointmentId === appointment.id, "Active encounter links to appointment");
    } else {
      console.log("PASS: Active encounter lookup (none for sample appointment)");
    }
  }

  const consultationResource = TENANT_PERMISSION_RESOURCES.find((r) => r.route === "/consultations");
  const startResource = TENANT_PERMISSION_RESOURCES.find((r) => r.route === "/consultations/start");
  const reopenResource = TENANT_PERMISSION_RESOURCES.find((r) => r.route === "/consultations/reopen");
  assert(Boolean(consultationResource), "RBAC /consultations registered");
  assert(Boolean(startResource), "RBAC /consultations/start registered");
  assert(Boolean(reopenResource), "RBAC /consultations/reopen registered");
  assert(consultationResource?.moduleCode === "MOD-18", "Consultation resource mapped to MOD-18");

  const doctorUser = await prisma.user.findUnique({ where: { username: "amina.rahman" } });
  const reception = await prisma.user.findUnique({ where: { username: "arif.hossain" } });
  if (doctorUser) {
    const permissions = await getEffectivePermissionsForUser(tenant.id, doctorUser.id);
    assert(permissions.get("/consultations/start")?.canCreate === true, "Doctor can start consultation");
    assert(permissions.get("/consultations/edit")?.canEdit === true, "Doctor can edit consultation");
    assert(permissions.get("/consultations/print")?.canPrint === true, "Doctor can print consultation");
  }
  if (reception) {
    const permissions = await getEffectivePermissionsForUser(tenant.id, reception.id);
    assert(permissions.get("/consultations")?.canView === true, "Reception can view consultations");
    assert(
      permissions.get("/consultations/edit")?.canEdit !== true,
      "Reception clinical edit denied",
    );
    assert(
      permissions.get("/consultations/reopen")?.canApprove !== true,
      "Reception reopen denied",
    );
  }

  const patientCount = await prisma.patient.count({ where: { tenantId: tenant.id } });
  assert(patientCount >= 4, "MOD-15 regression: patients still seeded");

  const appointmentCount = await prisma.appointment.count({ where: { tenantId: tenant.id } });
  assert(appointmentCount >= 1, "MOD-17 regression: appointments still seeded");

  for (const locale of MOD06_PRIMARY_LOCALES) {
    assert(
      fs.existsSync(path.join(process.cwd(), "src/messages", locale, "consultation.json")),
      `consultation.json exists for ${locale}`,
    );
  }

  const completeness = compareLocaleMessageStructure();
  assert(completeness.ok, "Translation key structure matches across locales");

  assert(resolveTextDirectionForLocale("ar-SA") === "rtl", "Arabic RTL supported");
  assert(resolveTextDirectionForLocale("ur-PK") === "rtl", "Urdu RTL supported");

  const registry = validateMod18RegistryCompliance();
  assert(registry.ok, `MOD-18 registry compliance (${registry.errors.join("; ")})`);

  const mod18Db = await prisma.moduleRegistry.findFirst({ where: { moduleCode: "MOD-18" } });
  assert(Boolean(mod18Db), "MOD-18 exists in database module_registry after seed");

  console.log("\nAll MOD-18 doctor consultation checks passed.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
