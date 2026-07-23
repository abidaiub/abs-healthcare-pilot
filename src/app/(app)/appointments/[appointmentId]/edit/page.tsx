import { notFound } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { getAppointmentById, getBookedSlots, listAppointmentDoctorOptions } from "@/lib/appointment/queries";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ appointmentId: string }> };

export default async function AppointmentEditPage({ params }: PageProps) {
  await requireTenantPermission("/appointments/new", "canEdit");
  const session = await requireTenantPermission("/appointments");
  const { t } = await getServerI18n(session);
  const { appointmentId } = await params;
  const appointment = await getAppointmentById(session.tenantId, appointmentId);
  if (!appointment) notFound();

  const doctors = await listAppointmentDoctorOptions(session.tenantId, appointment.branchId);
  const bookedSlots = await getBookedSlots(
    session.tenantId,
    appointment.branchId,
    appointment.doctorId,
    appointment.appointmentDate,
  );

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="appointmentEdit" description={t("appointment.edit.description")} />
      <AppointmentForm
        mode="edit"
        appointmentId={appointment.id}
        appointmentNumber={appointment.appointmentNumber}
        branchLabel={`${appointment.branch.code} — ${appointment.branch.name}`}
        doctors={doctors}
        bookedSlots={[...bookedSlots].filter((slot) => slot !== appointment.timeSlot)}
        initialPatient={{
          id: appointment.patient.id,
          patientNumber: appointment.patient.patientNumber,
          fullName: appointment.patient.fullName,
          mobile: appointment.patient.mobile,
        }}
        initialValues={{
          appointmentType: appointment.appointmentType,
          appointmentDate: appointment.appointmentDate.toISOString().slice(0, 10),
          timeSlot: appointment.timeSlot ?? "",
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          reasonForVisit: appointment.reasonForVisit ?? "",
          notes: appointment.notes ?? "",
        }}
      />
    </div>
  );
}
