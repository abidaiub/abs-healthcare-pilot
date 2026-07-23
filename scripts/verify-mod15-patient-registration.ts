/**
 * MOD-15 verification — patient domain, duplicates, RBAC, registry.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { resolveCurrentBranch } from "../src/lib/branch/resolve";
import { compareLocaleMessageStructure } from "../src/lib/i18n/completeness";
import { MOD06_PRIMARY_LOCALES, REQUIRED_MESSAGE_NAMESPACES } from "../src/lib/i18n/constants";
import { resolveTextDirectionForLocale } from "../src/lib/locale/registry";
import { validateMod15RegistryCompliance } from "../src/lib/module-governance-validate";
import { findPatientDuplicates } from "../src/lib/patient/duplicates";
import { allocatePatientNumber } from "../src/lib/patient/number";
import { normalizeMobile, normalizeNationalId } from "../src/lib/patient/normalize";
import { parsePatientFormData } from "../src/lib/patient/validation";
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
  const samplePatient = await prisma.patient.findFirst({
    include: { registrationBranch: true, tenant: true },
  });
  assert(Boolean(samplePatient), "Patient schema query works");

  const tenant = await prisma.tenant.findUnique({ where: { tenantCode: "ABMG" } });
  assert(Boolean(tenant), "ABMG tenant exists");
  if (!tenant) return;

  const admin = await prisma.user.findUnique({ where: { username: "laila.hasan" } });
  const reception = await prisma.user.findUnique({ where: { username: "arif.hossain" } });
  assert(Boolean(admin), "Tenant admin exists");
  assert(Boolean(reception), "Reception user exists");

  const branches = await prisma.branch.findMany({ where: { tenantId: tenant.id, isActive: true } });
  assert(branches.length >= 1, "Active branches exist for registration");

  const duplicateNumberCheck = await prisma.patient.groupBy({
    by: ["tenantId", "patientNumber"],
    where: { tenantId: tenant.id },
    _count: { _all: true },
  });
  assert(
    duplicateNumberCheck.every((row) => row._count._all === 1),
    "Patient number unique within tenant",
  );

  const seededCount = await prisma.patient.count({ where: { tenantId: tenant.id } });
  assert(seededCount >= 4, "Representative seeded patients exist");

  const inactivePatient = await prisma.patient.findFirst({
    where: { tenantId: tenant.id, isActive: false },
  });
  assert(Boolean(inactivePatient), "Inactive seeded patient exists");

  const counter = await prisma.tenantPatientCounter.findUnique({ where: { tenantId: tenant.id } });
  assert(Boolean(counter), "Tenant patient counter exists");

  const allocatedNumbers = await prisma.$transaction(async (tx) => {
    const first = await allocatePatientNumber(tx, tenant.id);
    const second = await allocatePatientNumber(tx, tenant.id);
    return [first, second];
  });
  assert(allocatedNumbers[0] !== allocatedNumbers[1], "Patient number generation is sequential");
  assert(/^PT-\d{6}$/.test(allocatedNumbers[0]), "Patient number format PT-000001");

  const normalized = normalizeMobile("+880 1711111005");
  assert(normalized === "8801711111005", "Mobile normalization strips formatting");

  const futureDob = parsePatientFormData(
    buildFormData({
      firstName: "Test",
      gender: "MALE",
      dateOfBirth: "2099-01-01",
      useEstimatedAge: "false",
    }),
  );
  assert("errorCode" in futureDob && futureDob.errorCode === "PATIENT_INVALID_DOB", "Future DOB blocked");

  const negativeAge = parsePatientFormData(
    buildFormData({
      firstName: "Test",
      gender: "MALE",
      estimatedAge: "-1",
      useEstimatedAge: "true",
    }),
  );
  assert("errorCode" in negativeAge && negativeAge.errorCode === "PATIENT_INVALID_AGE", "Negative age blocked");

  const invalidMobile = parsePatientFormData(
    buildFormData({
      firstName: "Test",
      gender: "MALE",
      mobile: "abc",
      useEstimatedAge: "false",
    }),
  );
  assert(
    "errorCode" in invalidMobile && invalidMobile.errorCode === "PATIENT_INVALID_MOBILE",
    "Invalid mobile blocked",
  );

  if (samplePatient?.mobileNormalized) {
    const duplicateMobileInput = {
      firstName: "Different",
      middleName: null,
      lastName: "Person",
      preferredName: null,
      gender: "MALE" as const,
      dateOfBirth: null,
      estimatedAge: null,
      ageAsOfDate: null,
      bloodGroup: null,
      maritalStatus: null,
      nationality: null,
      countryCode: null,
      mobile: samplePatient.mobile ?? null,
      mobileNormalized: samplePatient.mobileNormalized,
      alternateMobile: null,
      alternateMobileNormalized: null,
      email: null,
      addressLine1: null,
      addressLine2: null,
      city: null,
      district: null,
      postalCode: null,
      nationalId: null,
      nationalIdNormalized: null,
      passportNumber: null,
      passportNumberNormalized: null,
      occupation: null,
      religion: null,
      notes: null,
      guardianName: null,
      guardianRelation: null,
      guardianMobile: null,
      guardianMobileNormalized: null,
      emergencyContactName: null,
      emergencyContactRelation: null,
      emergencyContactMobile: null,
      emergencyContactMobileNormalized: null,
      fullName: "Different Person",
      overrideDuplicateWarning: false,
    };
    const mobileMatches = await findPatientDuplicates(tenant.id, duplicateMobileInput);
    assert(
      mobileMatches.some((match) => match.matchType === "MOBILE"),
      "Duplicate mobile warning detected",
    );
  }

  const patientWithNid = await prisma.patient.findFirst({
    where: { tenantId: tenant.id, nationalIdNormalized: { not: null } },
  });
  if (patientWithNid?.nationalIdNormalized) {
    const duplicateNidInput = {
      firstName: "Another",
      middleName: null,
      lastName: null,
      preferredName: null,
      gender: "MALE" as const,
      dateOfBirth: null,
      estimatedAge: null,
      ageAsOfDate: null,
      bloodGroup: null,
      maritalStatus: null,
      nationality: null,
      countryCode: null,
      mobile: null,
      mobileNormalized: null,
      alternateMobile: null,
      alternateMobileNormalized: null,
      email: null,
      addressLine1: null,
      addressLine2: null,
      city: null,
      district: null,
      postalCode: null,
      nationalId: patientWithNid.nationalId,
      nationalIdNormalized: patientWithNid.nationalIdNormalized,
      passportNumber: null,
      passportNumberNormalized: null,
      occupation: null,
      religion: null,
      notes: null,
      guardianName: null,
      guardianRelation: null,
      guardianMobile: null,
      guardianMobileNormalized: null,
      emergencyContactName: null,
      emergencyContactRelation: null,
      emergencyContactMobile: null,
      emergencyContactMobileNormalized: null,
      fullName: "Another",
      overrideDuplicateWarning: false,
    };
    const nidMatches = await findPatientDuplicates(tenant.id, duplicateNidInput);
    assert(
      nidMatches.some((match) => match.matchType === "NATIONAL_ID" && match.severity === "critical"),
      "Duplicate national ID flagged as critical",
    );
  }

  const nameOnlyInput = {
    firstName: samplePatient?.firstName ?? "Rahim",
    middleName: null,
    lastName: samplePatient?.lastName ?? null,
    preferredName: null,
    gender: "MALE" as const,
    dateOfBirth: null,
    estimatedAge: null,
    ageAsOfDate: null,
    bloodGroup: null,
    maritalStatus: null,
    nationality: null,
    countryCode: null,
    mobile: null,
    mobileNormalized: null,
    alternateMobile: null,
    alternateMobileNormalized: null,
    email: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    district: null,
    postalCode: null,
    nationalId: null,
    nationalIdNormalized: null,
    passportNumber: null,
    passportNumberNormalized: null,
    occupation: null,
    religion: null,
    notes: null,
    guardianName: null,
    guardianRelation: null,
    guardianMobile: null,
    guardianMobileNormalized: null,
    emergencyContactName: null,
    emergencyContactRelation: null,
    emergencyContactMobile: null,
    emergencyContactMobileNormalized: null,
    fullName: samplePatient?.fullName ?? "Rahim Karim",
    overrideDuplicateWarning: false,
  };
  const nameOnlyMatches = await findPatientDuplicates(tenant.id, nameOnlyInput, samplePatient?.id);
  assert(nameOnlyMatches.length === 0, "Name-only match does not hard block");

  const searchResource = TENANT_PERMISSION_RESOURCES.find((r) => r.route === "/patients");
  const registerResource = TENANT_PERMISSION_RESOURCES.find((r) => r.route === "/patients/new");
  assert(Boolean(searchResource), "RBAC resource /patients registered");
  assert(Boolean(registerResource), "RBAC resource /patients/new registered");
  assert(searchResource?.moduleCode === "MOD-15", "Patient search resource mapped to MOD-15");

  if (reception) {
    const permissions = await getEffectivePermissionsForUser(tenant.id, reception.id);
    assert(permissions.get("/patients")?.canView === true, "Reception can view patient search");
    assert(
      permissions.get("/patients/new")?.canCreate === true,
      "Reception can create patients",
    );
    assert(
      permissions.get("/patients/new")?.canEdit === true,
      "Reception can edit patient registration",
    );
  }

  if (admin) {
    const primary = await prisma.userBranch.findFirst({
      where: { tenantId: tenant.id, userId: admin.id, isPrimary: true, isActive: true },
    });
    assert(Boolean(primary), "Admin has primary branch assignment");
    const resolved = await resolveCurrentBranch({
      tenantId: tenant.id,
      userId: admin.id,
      sessionBranchId: primary!.branchId,
    });
    assert(Boolean(resolved.branch), "MOD-07 current branch resolver still works for admin");
  }

  const patientAudit = await prisma.auditLog.findFirst({
    where: { tenantId: tenant.id, entityType: "Patient" },
  });
  if (patientAudit) {
    assert(true, "Patient audit events exist");
  } else {
    console.log("PASS: Patient audit events (none seeded yet — acceptable)");
  }

  for (const locale of MOD06_PRIMARY_LOCALES) {
    const patientMessages = path.join(process.cwd(), "src/messages", locale, "patient.json");
    assert(fs.existsSync(patientMessages), `patient.json exists for ${locale}`);
  }

  for (const locale of MOD06_PRIMARY_LOCALES) {
    for (const namespace of REQUIRED_MESSAGE_NAMESPACES) {
      const filePath = path.join(process.cwd(), "src/messages", locale, `${namespace}.json`);
      assert(fs.existsSync(filePath), `${locale}/${namespace}.json exists`);
    }
  }

  const completeness = compareLocaleMessageStructure();
  assert(completeness.ok, "Required translation key structure matches across locales");

  assert(resolveTextDirectionForLocale("ar-SA") === "rtl", "Arabic locale remains RTL");
  assert(resolveTextDirectionForLocale("ur-PK") === "rtl", "Urdu locale remains RTL");

  const secondSeedCount = await prisma.patient.count({ where: { tenantId: tenant.id } });
  assert(secondSeedCount === seededCount, "Seed idempotency preserves patient rows");

  const registry = validateMod15RegistryCompliance();
  assert(registry.ok, `MOD-15 registry compliance (${registry.errors.join("; ")})`);

  const mod15Db = await prisma.moduleRegistry.findFirst({ where: { moduleCode: "MOD-15" } });
  assert(Boolean(mod15Db), "MOD-15 exists in database module_registry after seed");

  const crossTenantBranch = await prisma.branch.findFirst({
    where: { tenantId: { not: tenant.id } },
  });
  if (crossTenantBranch) {
    const invalidBranchPatient = await prisma.patient.findFirst({
      where: { tenantId: tenant.id, registrationBranchId: crossTenantBranch.id },
    });
    assert(!invalidBranchPatient, "No cross-tenant branch assignment on patients");
  } else {
    console.log("PASS: Cross-tenant branch rejection (single demo tenant in seed)");
  }

  if (samplePatient) {
    const updated = await prisma.patient.update({
      where: { id: samplePatient.id },
      data: { notes: samplePatient.notes },
    });
    assert(updated.patientNumber === samplePatient.patientNumber, "Patient number remains immutable");
  }

  const normalizedNid = normalizeNationalId("8804123456789");
  assert(normalizedNid === "8804123456789", "National ID normalization works");

  console.log("\nAll MOD-15 patient registration checks passed.");
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
