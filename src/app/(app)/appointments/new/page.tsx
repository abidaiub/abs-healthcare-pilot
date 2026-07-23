import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { resolveAppointmentBranch } from "@/lib/appointment/context";
import { getBookedSlots, listAppointmentDoctorOptions } from "@/lib/appointment/queries";
import { getPatientById } from "@/lib/patient/queries";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = {
  searchParams: Promise<{ patient?: string }>;
};

export default async function NewAppointmentPage({ searchParams }: PageProps) {
  await requireTenantPermission("/appointments/new", "canCreate");
  const session = await requireTenantPermission("/appointments");
  const { t } = await getServerI18n(session);
  const params = await searchParams;
  const branchResult = await resolveAppointmentBranch(session);
  if (!branchResult.ok) {
    return <p>{t("appointment.errors.APPOINTMENT_BRANCH_REQUIRED")}</p>;
  }

  const doctors = await listAppointmentDoctorOptions(session.tenantId, branchResult.branch.id);
  const today = new Date();
  const bookedSlots = doctors[0]
    ? await getBookedSlots(session.tenantId, branchResult.branch.id, doctors[0].id, today)
    : new Set<string>();

  const initialPatient = params.patient
    ? await getPatientById(session.tenantId, params.patient)
    : null;

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="appointmentBooking"
        description={t("appointment.new.description")}
      />
      <AppointmentForm
        mode="create"
        branchLabel={`${branchResult.branch.code} — ${branchResult.branch.name}`}
        doctors={doctors}
        bookedSlots={[...bookedSlots]}
        initialPatient={
          initialPatient
            ? {
                id: initialPatient.id,
                patientNumber: initialPatient.patientNumber,
                fullName: initialPatient.fullName,
                mobile: initialPatient.mobile,
              }
            : null
        }
      />
    </div>
  );
}
