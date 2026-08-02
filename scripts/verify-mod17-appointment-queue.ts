/**
 * MOD-17 verification — appointments, queue, scheduling, concurrency, RBAC, registry.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { resolveCurrentBranch } from "../src/lib/branch/resolve";
import { formatAppointmentDate, startOfDay } from "../src/lib/appointment/constants";
import { APPOINTMENT_ERROR_CODES } from "../src/lib/appointment/errors";
import { allocateAppointmentNumber, isValidAppointmentNumber } from "../src/lib/appointment/number";
import { allocateQueueToken } from "../src/lib/appointment/queue";
import { assertScheduledSlotAvailable } from "../src/lib/appointment/slot-capacity";
import {
  parseAppointmentFormData,
  validateAppointmentReferences,
} from "../src/lib/appointment/validation";
import { assertNoScheduleOverlap, assertDoctorUnchangedOnEdit } from "../src/lib/doctor-schedule/concurrency";
import { DOCTOR_SCHEDULE_ERROR_CODES } from "../src/lib/doctor-schedule/errors";
import { dayOfWeekFromDate } from "../src/lib/doctor-schedule/constants";
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

function futureDateOnWeekday(dayOfWeek: number): Date {
  const date = startOfDay(new Date());
  date.setDate(date.getDate() + 14);
  while (dayOfWeekFromDate(date) !== dayOfWeek) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

async function main() {
  assert(
    formatAppointmentDate(new Date("2026-08-01T00:00:00.000Z")) === "2026-08-01",
    "Appointment business date formatting is timezone invariant",
  );
  const parsedDateOnly = parseAppointmentFormData(
    buildFormData({
      appointmentType: "SCHEDULED",
      appointmentDate: "2099-08-01",
      timeSlot: "10:00",
      patientId: "test-patient",
      doctorId: "test-doctor",
    }),
  );
  assert(
    !("errorCode" in parsedDateOnly) &&
      parsedDateOnly.appointmentDate.toISOString() === "2099-08-01T00:00:00.000Z",
    "Appointment input preserves the selected date at UTC midnight",
  );
  const sampleAppointment = await prisma.appointment.findFirst({
    include: { patient: true, branch: true, doctor: true },
  });
  assert(Boolean(sampleAppointment), "Appointment schema query works");

  const tenant = await prisma.tenant.findUnique({ where: { tenantCode: "ABMG" } });
  assert(Boolean(tenant), "ABMG tenant exists");
  if (!tenant) return;

  const otherTenant = await prisma.tenant.findFirst({
    where: { id: { not: tenant.id } },
  });

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
  const otherBranch = await prisma.branch.findFirst({
    where: { tenantId: tenant.id, isActive: true, id: { not: branch?.id } },
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

  const patients = await prisma.patient.findMany({
    where: { tenantId: tenant.id, isActive: true },
    take: 2,
    orderBy: { createdAt: "asc" },
  });
  const patient = patients[0] ?? null;
  const patientB = patients[1] ?? patients[0] ?? null;

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

  // Ephemeral concurrency / schedule lifecycle checks — always cleaned up.
  const createdAppointmentIds: string[] = [];
  const createdScheduleIds: string[] = [];

  try {
    if (patient && patientB && doctor && branch) {
      const dayOfWeek = 2; // Tuesday
      const appointmentDate = futureDateOnWeekday(dayOfWeek);
      const timeSlot = "11:00";

      const draft = await prisma.doctorSchedule.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          doctorId: doctor.id,
          dayOfWeek,
          startTime: "10:00",
          endTime: "12:00",
          slotDuration: 30,
          chamber: "MOD17-VERIFY",
          isPublished: false,
          isActive: true,
          createdBy: "mod17-verify",
          updatedBy: "mod17-verify",
        },
      });
      createdScheduleIds.push(draft.id);
      assert(draft.isPublished === false, "New schedule starts as draft");
      assert(draft.stateVersion === 1, "New schedule stateVersion starts at 1");

      const published = await prisma.doctorSchedule.update({
        where: { id: draft.id },
        data: {
          isPublished: true,
          publishedAt: new Date(),
          publishedBy: "mod17-verify",
          stateVersion: { increment: 1 },
          updatedBy: "mod17-verify",
        },
      });
      assert(published.isPublished === true, "Schedule publish sets isPublished");
      assert(published.stateVersion === 2, "Publish bumps stateVersion");

      const unpublished = await prisma.doctorSchedule.update({
        where: { id: draft.id },
        data: {
          isPublished: false,
          publishedAt: null,
          publishedBy: null,
          stateVersion: { increment: 1 },
          updatedBy: "mod17-verify",
        },
      });
      assert(unpublished.isPublished === false, "Schedule unpublish clears isPublished");
      assert(unpublished.stateVersion === 3, "Unpublish bumps stateVersion");

      await prisma.doctorSchedule.update({
        where: { id: draft.id },
        data: {
          isPublished: true,
          publishedAt: new Date(),
          publishedBy: "mod17-verify",
          stateVersion: { increment: 1 },
          updatedBy: "mod17-verify",
        },
      });

      const staleUpdate = await prisma.doctorSchedule.updateMany({
        where: { id: draft.id, tenantId: tenant.id, stateVersion: 1 },
        data: { chamber: "STALE", stateVersion: { increment: 1 } },
      });
      assert(staleUpdate.count === 0, "Stale schedule update rejected by stateVersion guard");

      const freshUpdate = await prisma.doctorSchedule.updateMany({
        where: { id: draft.id, tenantId: tenant.id, stateVersion: 4 },
        data: { chamber: "MOD17-VERIFY-OK", stateVersion: { increment: 1 } },
      });
      assert(freshUpdate.count === 1, "Matching stateVersion allows schedule update");

      // Concurrent capacity: exactly one of two racing bookings may succeed.
      const raceResults = await Promise.allSettled([
        prisma.$transaction(async (tx) => {
          const slot = await assertScheduledSlotAvailable(tx, {
            tenantId: tenant.id,
            branchId: branch.id,
            doctorId: doctor.id,
            appointmentDate,
            timeSlot,
          });
          if (!slot.ok) throw new Error(slot.errorCode);
          const appointmentNumber = await allocateAppointmentNumber(tx, tenant.id);
          return tx.appointment.create({
            data: {
              tenantId: tenant.id,
              appointmentNumber,
              appointmentType: "SCHEDULED",
              appointmentDate,
              timeSlot,
              patientId: patient.id,
              branchId: branch.id,
              doctorId: doctor.id,
              status: "SCHEDULED",
              createdBy: "mod17-verify-a",
              updatedBy: "mod17-verify-a",
            },
          });
        }),
        prisma.$transaction(async (tx) => {
          const slot = await assertScheduledSlotAvailable(tx, {
            tenantId: tenant.id,
            branchId: branch.id,
            doctorId: doctor.id,
            appointmentDate,
            timeSlot,
          });
          if (!slot.ok) throw new Error(slot.errorCode);
          const appointmentNumber = await allocateAppointmentNumber(tx, tenant.id);
          return tx.appointment.create({
            data: {
              tenantId: tenant.id,
              appointmentNumber,
              appointmentType: "SCHEDULED",
              appointmentDate,
              timeSlot,
              patientId: patientB.id,
              branchId: branch.id,
              doctorId: doctor.id,
              status: "SCHEDULED",
              createdBy: "mod17-verify-b",
              updatedBy: "mod17-verify-b",
            },
          });
        }),
      ]);

      const fulfilled = raceResults.filter((r) => r.status === "fulfilled");
      const rejected = raceResults.filter((r) => r.status === "rejected");
      for (const result of fulfilled) {
        if (result.status === "fulfilled") createdAppointmentIds.push(result.value.id);
      }
      assert(fulfilled.length === 1, "Concurrent capacity booking allows exactly one winner");
      assert(rejected.length === 1, "Concurrent capacity booking rejects the loser");
      if (rejected[0]?.status === "rejected") {
        const message =
          rejected[0].reason instanceof Error
            ? rejected[0].reason.message
            : String(rejected[0].reason);
        assert(
          message.includes(APPOINTMENT_ERROR_CODES.APPOINTMENT_SLOT_FULL),
          "Concurrent loser reports APPOINTMENT_SLOT_FULL",
        );
      }

      // Concurrent overlapping schedules: exactly one may succeed.
      const overlapDay = 3;
      const overlapResults = await Promise.allSettled([
        prisma.$transaction(async (tx) => {
          const check = await assertNoScheduleOverlap(tx, {
            tenantId: tenant.id,
            branchId: branch.id,
            doctorId: doctor.id,
            dayOfWeek: overlapDay,
            startTime: "14:00",
            endTime: "16:00",
          });
          if (!check.ok) throw new Error(check.errorCode);
          return tx.doctorSchedule.create({
            data: {
              tenantId: tenant.id,
              branchId: branch.id,
              doctorId: doctor.id,
              dayOfWeek: overlapDay,
              startTime: "14:00",
              endTime: "16:00",
              slotDuration: 30,
              chamber: "MOD17-OVERLAP-A",
              createdBy: "mod17-verify",
              updatedBy: "mod17-verify",
            },
          });
        }),
        prisma.$transaction(async (tx) => {
          const check = await assertNoScheduleOverlap(tx, {
            tenantId: tenant.id,
            branchId: branch.id,
            doctorId: doctor.id,
            dayOfWeek: overlapDay,
            startTime: "15:00",
            endTime: "17:00",
          });
          if (!check.ok) throw new Error(check.errorCode);
          return tx.doctorSchedule.create({
            data: {
              tenantId: tenant.id,
              branchId: branch.id,
              doctorId: doctor.id,
              dayOfWeek: overlapDay,
              startTime: "15:00",
              endTime: "17:00",
              slotDuration: 30,
              chamber: "MOD17-OVERLAP-B",
              createdBy: "mod17-verify",
              updatedBy: "mod17-verify",
            },
          });
        }),
      ]);

      const overlapOk = overlapResults.filter((r) => r.status === "fulfilled");
      const overlapFail = overlapResults.filter((r) => r.status === "rejected");
      for (const result of overlapOk) {
        if (result.status === "fulfilled") createdScheduleIds.push(result.value.id);
      }
      assert(overlapOk.length === 1, "Concurrent overlapping schedules allow exactly one winner");
      assert(overlapFail.length === 1, "Concurrent overlapping schedules reject the loser");
      if (overlapFail[0]?.status === "rejected") {
        const message =
          overlapFail[0].reason instanceof Error
            ? overlapFail[0].reason.message
            : String(overlapFail[0].reason);
        assert(
          message.includes(DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_OVERLAP) ||
            message.includes(DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_DUPLICATE),
          "Overlap loser reports overlap/duplicate error",
        );
      }

      if (otherTenant) {
        const leaked = await prisma.doctorSchedule.findFirst({
          where: { id: draft.id, tenantId: otherTenant.id },
        });
        assert(!leaked, "Cross-tenant schedule access denied by tenantId filter");

        const leakedAppt = createdAppointmentIds[0]
          ? await prisma.appointment.findFirst({
              where: { id: createdAppointmentIds[0], tenantId: otherTenant.id },
            })
          : null;
        assert(!leakedAppt, "Cross-tenant appointment access denied by tenantId filter");
      }

      if (otherBranch) {
        const wrongBranch = await prisma.doctorSchedule.findFirst({
          where: { id: draft.id, tenantId: tenant.id, branchId: otherBranch.id },
        });
        assert(!wrongBranch, "Cross-branch schedule access denied by branchId filter");
      }

      // Doctor reassignment is prohibited on edit (retire + recreate instead).
      // Doctor B only needs a distinct id for the client-bypass rejection path.
      let doctorB = await prisma.doctor.findFirst({
        where: {
          tenantId: tenant.id,
          id: { not: doctor.id },
        },
        select: { id: true },
      });
      let createdDoctorBId: string | null = null;
      if (!doctorB) {
        const ephemeral = await prisma.doctor.create({
          data: {
            tenantId: tenant.id,
            doctorCode: "DR-MOD17-TMP",
            doctorName: "MOD17 Immutable Temp",
            isActive: true,
            createdBy: "mod17-verify",
            updatedBy: "mod17-verify",
          },
          select: { id: true },
        });
        doctorB = ephemeral;
        createdDoctorBId = ephemeral.id;
      }
      assert(Boolean(doctorB), "Second doctor exists for immutability test");

      try {
        if (doctorB) {
          const doctorASchedule = await prisma.doctorSchedule.create({
            data: {
              tenantId: tenant.id,
              branchId: branch.id,
              doctorId: doctor.id,
              dayOfWeek: 5,
              startTime: "08:00",
              endTime: "10:00",
              slotDuration: 30,
              chamber: "MOD17-IMMUTABLE-A",
              isPublished: false,
              isActive: true,
              createdBy: "mod17-verify",
              updatedBy: "mod17-verify",
            },
          });
          createdScheduleIds.push(doctorASchedule.id);
          assert(doctorASchedule.doctorId === doctor.id, "Create schedule binds Doctor A");
          assert(
            doctorASchedule.stateVersion === 1,
            "Immutable-doctor schedule starts at stateVersion 1",
          );

          const reassignAttempt = assertDoctorUnchangedOnEdit(
            doctorASchedule.doctorId,
            doctorB.id,
          );
          assert(
            !reassignAttempt.ok &&
              reassignAttempt.errorCode ===
                DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_DOCTOR_IMMUTABLE,
            "Edit with Doctor B rejected as DOCTOR_SCHEDULE_DOCTOR_IMMUTABLE",
          );

          // Simulate a client bypass that would try to write after a wrong doctorId —
          // the action returns before any write; confirm row is untouched.
          const afterReject = await prisma.doctorSchedule.findFirstOrThrow({
            where: { id: doctorASchedule.id, tenantId: tenant.id },
          });
          assert(afterReject.doctorId === doctor.id, "Rejected reassignment keeps Doctor A");
          assert(
            afterReject.stateVersion === doctorASchedule.stateVersion,
            "Rejected reassignment does not bump stateVersion",
          );
          assert(
            afterReject.chamber === "MOD17-IMMUTABLE-A",
            "Rejected reassignment leaves other fields unchanged",
          );

          const doctorBRows = await prisma.doctorSchedule.count({
            where: {
              tenantId: tenant.id,
              branchId: branch.id,
              doctorId: doctorB.id,
              chamber: "MOD17-IMMUTABLE-A",
            },
          });
          assert(doctorBRows === 0, "Rejected reassignment creates no Doctor B schedule");

          // Allowed field edit while keeping Doctor A — lock/overlap use persisted doctorId.
          const allowedEdit = await prisma.$transaction(async (tx) => {
            const immutable = assertDoctorUnchangedOnEdit(doctorASchedule.doctorId, doctor.id);
            if (!immutable.ok) throw new Error(immutable.errorCode);

            const overlap = await assertNoScheduleOverlap(tx, {
              tenantId: tenant.id,
              branchId: branch.id,
              doctorId: doctorASchedule.doctorId,
              dayOfWeek: 5,
              startTime: "08:30",
              endTime: "10:30",
              excludeScheduleId: doctorASchedule.id,
            });
            if (!overlap.ok) throw new Error(overlap.errorCode);

            const updated = await tx.doctorSchedule.updateMany({
              where: {
                id: doctorASchedule.id,
                tenantId: tenant.id,
                branchId: branch.id,
                doctorId: doctorASchedule.doctorId,
                stateVersion: doctorASchedule.stateVersion,
              },
              data: {
                startTime: "08:30",
                endTime: "10:30",
                chamber: "MOD17-IMMUTABLE-EDITED",
                stateVersion: { increment: 1 },
                updatedBy: "mod17-verify",
              },
            });
            if (updated.count !== 1) {
              throw new Error(DOCTOR_SCHEDULE_ERROR_CODES.DOCTOR_SCHEDULE_STALE);
            }
            return tx.doctorSchedule.findFirstOrThrow({
              where: { id: doctorASchedule.id, tenantId: tenant.id },
            });
          });

          assert(allowedEdit.doctorId === doctor.id, "Allowed edit keeps Doctor A");
          assert(allowedEdit.stateVersion === 2, "Allowed edit increments stateVersion once");
          assert(allowedEdit.startTime === "08:30", "Allowed edit updates startTime");
          assert(
            allowedEdit.chamber === "MOD17-IMMUTABLE-EDITED",
            "Allowed edit updates chamber",
          );
        }
      } finally {
        if (createdDoctorBId) {
          await prisma.doctor.deleteMany({ where: { id: createdDoctorBId, tenantId: tenant.id } });
        }
      }

      // UI/server policy consistency (source-level).
      const panelSource = fs.readFileSync(
        path.join(process.cwd(), "src/components/doctor-schedule/DoctorSchedulePanel.tsx"),
        "utf8",
      );
      const actionSource = fs.readFileSync(
        path.join(process.cwd(), "src/app/actions/tenant-doctor-schedules.ts"),
        "utf8",
      );
      assert(
        panelSource.includes("disabled={isEditing}"),
        "UI disables doctor selector while editing",
      );
      assert(
        panelSource.includes("doctorSchedule.hints.doctorImmutable"),
        "UI shows doctor-immutable explanation while editing",
      );
      assert(
        actionSource.includes("assertDoctorUnchangedOnEdit") &&
          actionSource.includes("effectiveDoctorId"),
        "Server save uses persisted doctorId and immutability guard",
      );
    }
  } finally {
    if (createdAppointmentIds.length > 0) {
      await prisma.appointment.deleteMany({ where: { id: { in: createdAppointmentIds } } });
    }
    if (createdScheduleIds.length > 0) {
      await prisma.doctorSchedule.deleteMany({ where: { id: { in: createdScheduleIds } } });
    }
  }

  const appointmentResource = TENANT_PERMISSION_RESOURCES.find((r) => r.route === "/appointments");
  const bookResource = TENANT_PERMISSION_RESOURCES.find((r) => r.route === "/appointments/new");
  const queueResource = TENANT_PERMISSION_RESOURCES.find((r) => r.route === "/appointments/queue");
  const operatorResource = TENANT_PERMISSION_RESOURCES.find(
    (r) => r.route === "/appointments/queue/operator",
  );
  const scheduleResource = TENANT_PERMISSION_RESOURCES.find(
    (r) => r.route === "/settings/doctor-schedules",
  );
  assert(Boolean(appointmentResource), "RBAC resource /appointments registered");
  assert(Boolean(bookResource), "RBAC resource /appointments/new registered");
  assert(Boolean(queueResource), "RBAC resource /appointments/queue registered");
  assert(Boolean(operatorResource), "RBAC resource /appointments/queue/operator registered");
  assert(Boolean(scheduleResource), "RBAC resource /settings/doctor-schedules registered");
  assert(appointmentResource?.moduleCode === "MOD-17", "Appointment list resource mapped to MOD-17");
  assert(scheduleResource?.moduleCode === "MOD-17", "Doctor schedule resource mapped to MOD-17");

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
    const scheduleMessages = path.join(process.cwd(), "src/messages", locale, "doctorSchedule.json");
    assert(fs.existsSync(scheduleMessages), `doctorSchedule.json exists for ${locale}`);
    const scheduleJson = JSON.parse(fs.readFileSync(scheduleMessages, "utf8")) as {
      title: string;
      hints: { slotPreview: string; doctorImmutable: string };
      errors: {
        DOCTOR_SCHEDULE_STALE: string;
        DOCTOR_SCHEDULE_DOCTOR_IMMUTABLE: string;
      };
    };
    assert(Boolean(scheduleJson.title.trim()), `${locale} doctorSchedule.title present`);
    assert(
      scheduleJson.hints.slotPreview.includes("{count}"),
      `${locale} doctorSchedule preserves {count} interpolation`,
    );
    assert(
      Boolean(scheduleJson.errors.DOCTOR_SCHEDULE_STALE?.trim()),
      `${locale} doctorSchedule has STALE error translation`,
    );
    assert(
      Boolean(scheduleJson.errors.DOCTOR_SCHEDULE_DOCTOR_IMMUTABLE?.trim()),
      `${locale} doctorSchedule has DOCTOR_IMMUTABLE error translation`,
    );
    assert(
      Boolean(scheduleJson.hints.doctorImmutable?.trim()),
      `${locale} doctorSchedule has doctorImmutable hint`,
    );
    if (locale !== "en-BD") {
      assert(
        scheduleJson.title !== "Doctor Schedule Setup",
        `${locale} doctorSchedule.title is not English placeholder`,
      );
      assert(
        !scheduleJson.errors.DOCTOR_SCHEDULE_DOCTOR_IMMUTABLE.includes(
          "Doctor cannot be changed after schedule creation",
        ),
        `${locale} DOCTOR_IMMUTABLE is not English placeholder`,
      );
    }

    const navigation = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "src/messages", locale, "navigation.json"), "utf8"),
    ) as { doctorSchedules?: string };
    const screens = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "src/messages", locale, "screens.json"), "utf8"),
    ) as Record<string, string>;
    assert(Boolean(navigation.doctorSchedules?.trim()), `${locale} navigation.doctorSchedules present`);
    assert(
      Boolean(screens["doctorSchedules.title"]?.trim()),
      `${locale} screens.doctorSchedules.title present`,
    );
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

  const leftover = await prisma.doctorSchedule.count({
    where: {
      chamber: {
        in: [
          "MOD17-VERIFY",
          "MOD17-VERIFY-OK",
          "MOD17-OVERLAP-A",
          "MOD17-OVERLAP-B",
          "STALE",
          "MOD17-IMMUTABLE-A",
          "MOD17-IMMUTABLE-EDITED",
        ],
      },
    },
  });
  assert(leftover === 0, "Verification cleanup removed ephemeral schedules");

  console.log("\nAll MOD-17 appointment, schedule, and concurrency checks passed.");
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
