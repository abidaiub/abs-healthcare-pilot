import type { AppointmentStatus, AppointmentType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  APPOINTMENT_ERROR_CODES,
  DEFAULT_MAX_PATIENTS_PER_SLOT,
} from "@/lib/appointment/errors";
import { TIME_SLOTS, startOfDay } from "@/lib/appointment/constants";

export type AppointmentFormInput = {
  appointmentType: AppointmentType;
  appointmentDate: Date;
  timeSlot: string | null;
  patientId: string;
  doctorId: string;
  departmentId: string | null;
  reasonForVisit: string | null;
  notes: string | null;
  autoCheckIn: boolean;
};

const TYPES: AppointmentType[] = ["WALK_IN", "SCHEDULED"];

function parseDate(value: string): Date | null {
  if (!value.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return startOfDay(parsed);
}

export function parseAppointmentFormData(
  formData: FormData,
): AppointmentFormInput | { errorCode: string } {
  const appointmentTypeRaw = String(formData.get("appointmentType") ?? "SCHEDULED").toUpperCase();
  const appointmentType = TYPES.includes(appointmentTypeRaw as AppointmentType)
    ? (appointmentTypeRaw as AppointmentType)
    : "SCHEDULED";

  const dateRaw = String(formData.get("appointmentDate") ?? "").trim();
  const appointmentDate = parseDate(dateRaw);
  if (!appointmentDate) {
    return { errorCode: APPOINTMENT_ERROR_CODES.APPOINTMENT_INVALID_DATE };
  }

  const today = startOfDay(new Date());
  if (appointmentDate < today) {
    return { errorCode: APPOINTMENT_ERROR_CODES.APPOINTMENT_INVALID_DATE };
  }

  const timeSlotRaw = String(formData.get("timeSlot") ?? "").trim();
  const timeSlot = timeSlotRaw || null;

  if (appointmentType === "SCHEDULED") {
    if (!timeSlot || !TIME_SLOTS.includes(timeSlot as (typeof TIME_SLOTS)[number])) {
      return { errorCode: APPOINTMENT_ERROR_CODES.APPOINTMENT_INVALID_SLOT };
    }
  }

  const patientId = String(formData.get("patientId") ?? "").trim();
  const doctorId = String(formData.get("doctorId") ?? "").trim();
  if (!patientId || !doctorId) {
    return { errorCode: APPOINTMENT_ERROR_CODES.APPOINTMENT_VALIDATION };
  }

  const departmentId = String(formData.get("departmentId") ?? "").trim() || null;
  const reasonForVisit = String(formData.get("reasonForVisit") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const autoCheckIn =
    appointmentType === "WALK_IN" ||
    String(formData.get("autoCheckIn") ?? "") === "true";

  return {
    appointmentType,
    appointmentDate,
    timeSlot: appointmentType === "WALK_IN" ? null : timeSlot,
    patientId,
    doctorId,
    departmentId,
    reasonForVisit,
    notes,
    autoCheckIn,
  };
}

export async function validateAppointmentReferences(
  tenantId: string,
  branchId: string,
  input: AppointmentFormInput,
  excludeAppointmentId?: string,
) {
  const patient = await prisma.patient.findFirst({
    where: { id: input.patientId, tenantId, isActive: true },
    select: { id: true },
  });
  if (!patient) {
    return { ok: false as const, errorCode: APPOINTMENT_ERROR_CODES.APPOINTMENT_PATIENT_INACTIVE };
  }

  const doctor = await prisma.doctor.findFirst({
    where: {
      id: input.doctorId,
      tenantId,
      isActive: true,
      doctorBranches: { some: { branchId, isActive: true } },
    },
    select: { id: true, departmentId: true },
  });
  if (!doctor) {
    return { ok: false as const, errorCode: APPOINTMENT_ERROR_CODES.APPOINTMENT_DOCTOR_INACTIVE };
  }

  if (input.appointmentType === "SCHEDULED" && input.timeSlot) {
    const booked = await prisma.appointment.count({
      where: {
        tenantId,
        branchId,
        doctorId: input.doctorId,
        appointmentDate: input.appointmentDate,
        timeSlot: input.timeSlot,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        ...(excludeAppointmentId ? { NOT: { id: excludeAppointmentId } } : {}),
      },
    });
    if (booked >= DEFAULT_MAX_PATIENTS_PER_SLOT) {
      return { ok: false as const, errorCode: APPOINTMENT_ERROR_CODES.APPOINTMENT_SLOT_FULL };
    }
  }

  return {
    ok: true as const,
    departmentId: input.departmentId ?? doctor.departmentId,
  };
}

export function appointmentDataFromInput(
  input: AppointmentFormInput,
  branchId: string,
  departmentId: string | null,
  status: AppointmentStatus,
  queueToken?: number | null,
  queueTokenDate?: Date | null,
) {
  return {
    appointmentType: input.appointmentType,
    appointmentDate: input.appointmentDate,
    timeSlot: input.timeSlot,
    patientId: input.patientId,
    branchId,
    doctorId: input.doctorId,
    departmentId,
    reasonForVisit: input.reasonForVisit,
    notes: input.notes,
    status,
    queueToken: queueToken ?? null,
    queueTokenDate: queueTokenDate ?? null,
    checkedInAt:
      status === "CHECKED_IN" || status === "WAITING" ? new Date() : null,
  };
}
