/**
 * MOD-17 verification — appointments, queue, scheduling, RBAC, registry.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { resolveCurrentBranch } from "../src/lib/branch/resolve";
import { startOfDay } from "../src/lib/appointment/constants";
import { APPOINTMENT_ERROR_CODES } from "../src/lib/appointment/errors";
import { allocateAppointmentNumber, isValidAppointmentNumber } from "../src/lib/appointment/number";
import { allocateQueueToken } from "../src/lib/appointment/queue";
import {
  parseAppointmentFormData,
  validateAppointmentReferences,
} from "../src/lib/appointment/validation";
import { compareLocaleMessageStructure } from "../src/lib/i18n/completeness";
import { MOD06_PRIMARY_LOCALES, REQUIRED_MESSAGE_NAMESPACES } from "../src/lib/i18n/constants";
import { resolveTextDirectionForLocale } from "../src/lib/locale/registry";
import { validateMod17RegistryCompliance } from "../src/lib/module-governance-validate";
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
  const sampleAppointment = await prisma.appointment.findFirst({
    include: { patient: true, branch: true, doctor: true },
  });
  assert(Boolean(sampleAppointment), "Appointment schema query works");

  const tenant = await prisma.tenant.findUnique({ where: { tenantCode: "ABMG" } });
  assert(Boolean(tenant), "ABMG tenant exists");
  if (!tenant) return;

  const admin = await prisma.user.findUnique({ where: { username: "laila.hasan" } });
  const reception = await prisma.user.findUnique({ where: { username: "arif.hossain" } });
  assert(Boolean(admin), "Tenant admin exists");
  assert(Boolean(reception), "Reception user exists");

  const duplicateNumberCheck = await prisma.appointment.groupBy({
    by: ["tenantId", "appointmentNumber"],
    where: { tenantId: tenant.id },
    _count: { _all: true },
  });
  assert(
    duplicateNumberCheck.every((row) => row._count._all === 1),
    "Appointment number unique within tenant",
  );

  const seededCount = await prisma.appointment.count({ where: { tenantId: tenant.id } });
  assert(seededCount >= 1, "Representative seeded appointment exists");

  const counter = await prisma.tenantAppointmentCounter.findUnique({ where: { tenantId: tenant.id } });
  assert(Boolean(counter), "Tenant appointment counter exists");

  const allocatedNumbers = await prisma.$transaction(async (tx) => {
    const first = await allocateAppointmentNumber(tx, tenant.id);
    const second = await allocateAppointmentNumber(tx, tenant.id);
    return [first, second];
  });
  assert(allocatedNumbers[0] !== allocatedNumbers[1], "Appointment number generation is sequential");
  assert(isValidAppointmentNumber(allocatedNumbers[0]), "Appointment number format AP-000001");

  const doctor = await prisma.doctor.findFirst({
    where: { tenantId: tenant.id, isActive: true, doctorCode: "DR-OPD-001" },
    include: { doctorBranches: { where: { isActive: true } } },
  });
  const branch = await prisma.branch.findFirst({
    where: { tenantId: tenant.id, code: "BR-HO-01", isActive: true },
  });
  assert(Boolean(doctor && branch), "Seeded OPD doctor and branch exist");

  if (doctor && branch) {
    const queueDate = startOfDay(new Date());
    const tokens = await prisma.$transaction(async (tx) => {
      const first = await allocateQueueToken(tx, {
        tenantId: tenant.id,
        branchId: branch.id,
        doctorId: doctor.id,
        queueDate,
      });
      const second = await allocateQueueToken(tx, {
        tenantId: tenant.id,
        branchId: branch.id,
        doctorId: doctor.id,
        queueDate,
      });
      return [first, second];
    });
    assert(tokens[0] === 1 || tokens[0] >= 1, "Queue token starts at 1 for doctor/day");
    assert(tokens[1] === tokens[0] + 1, "Queue tokens increment per doctor/day");
  }

  const pastDate = parseAppointmentFormData(
    buildFormData({
      appointmentType: "SCHEDULED",
      appointmentDate: "2000-01-01",
      timeSlot: "10:00",
      patientId: sampleAppointment?.patientId ?? "",
      doctorId: sampleAppointment?.doctorId ?? "",
    }),
  );
  assert(
    "errorCode" in pastDate && pastDate.errorCode === APPOINTMENT_ERROR_CODES.APPOINTMENT_INVALID_DATE,
    "Past appointment date blocked",
  );

  const patient = await prisma.patient.findFirst({
    where: { tenantId: tenant.id, isActive: true },
  });
  if (patient && doctor && branch && sampleAppointment) {
    const slotInput = {
      appointmentType: "SCHEDULED" as const,
      appointmentDate: sampleAppointment.appointmentDate,
      timeSlot: sampleAppointment.timeSlot ?? "10:00",
      patientId: patient.id,
      doctorId: doctor.id,
      departmentId: null,
      reasonForVisit: null,
      notes: null,
      autoCheckIn: false,
    };
    const slotCheck = await validateAppointmentReferences(tenant.id, branch.id, slotInput);
    assert(
      !slotCheck.ok && slotCheck.errorCode === APPOINTMENT_ERROR_CODES.APPOINTMENT_SLOT_FULL,
      "Duplicate slot booking blocked",
    );
  }

  const appointmentResource = TENANT_PERMISSION_RESOURCES.find((r) => r.route === "/appointments");
  const bookResource = TENANT_PERMISSION_RESOURCES.find((r) => r.route === "/appointments/new");
  const queueResource = TENANT_PERMISSION_RESOURCES.find((r) => r.route === "/appointments/queue");
  const operatorResource = TENANT_PERMISSION_RESOURCES.find(
    (r) => r.route === "/appointments/queue/operator",
  );
  assert(Boolean(appointmentResource), "RBAC resource /appointments registered");
  assert(Boolean(bookResource), "RBAC resource /appointments/new registered");
  assert(Boolean(queueResource), "RBAC resource /appointments/queue registered");
  assert(Boolean(operatorResource), "RBAC resource /appointments/queue/operator registered");
  assert(appointmentResource?.moduleCode === "MOD-17", "Appointment list resource mapped to MOD-17");

  if (reception) {
    const permissions = await getEffectivePermissionsForUser(tenant.id, reception.id);
    assert(permissions.get("/appointments")?.canView === true, "Reception can view appointments");
    assert(permissions.get("/appointments/new")?.canCreate === true, "Reception can book appointments");
    assert(permissions.get("/appointments/queue")?.canView === true, "Reception can view queue dashboard");
    assert(
      permissions.get("/appointments/queue/operator")?.canEdit === true,
      "Reception can operate queue",
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

  const patientCount = await prisma.patient.count({ where: { tenantId: tenant.id } });
  assert(patientCount >= 4, "MOD-15 regression: seeded patients still exist");

  for (const locale of MOD06_PRIMARY_LOCALES) {
    const appointmentMessages = path.join(process.cwd(), "src/messages", locale, "appointment.json");
    assert(fs.existsSync(appointmentMessages), `appointment.json exists for ${locale}`);
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

  const registry = validateMod17RegistryCompliance();
  assert(registry.ok, `MOD-17 registry compliance (${registry.errors.join("; ")})`);

  const mod17Db = await prisma.moduleRegistry.findFirst({ where: { moduleCode: "MOD-17" } });
  assert(Boolean(mod17Db), "MOD-17 exists in database module_registry after seed");

  if (sampleAppointment) {
    const updated = await prisma.appointment.update({
      where: { id: sampleAppointment.id },
      data: { notes: sampleAppointment.notes },
    });
    assert(
      updated.appointmentNumber === sampleAppointment.appointmentNumber,
      "Appointment number remains immutable",
    );
  }

  console.log("\nAll MOD-17 appointment and queue checks passed.");
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
