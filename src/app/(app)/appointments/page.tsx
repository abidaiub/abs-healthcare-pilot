import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { AppointmentBookingForm } from "@/components/appointments/AppointmentBookingForm";
import { requireSession } from "@/lib/auth";
import { APPOINTMENTS } from "@/lib/sample-data";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="appointmentBooking"
        description={`Book walk-in, scheduled, follow-up, or telemedicine visits at ${session.branchName}`}
      />
      <AppointmentBookingForm
        initialPatientId={params.patient}
        branchName={session.branchName}
        branchCode={session.branchCode}
        existingAppointments={APPOINTMENTS}
      />
    </div>
  );
}
