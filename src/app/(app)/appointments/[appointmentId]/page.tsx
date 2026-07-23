import { notFound } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { AppointmentDetailPanel } from "@/components/appointments/AppointmentDetailPanel";
import { getAppointmentById } from "@/lib/appointment/queries";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ appointmentId: string }> };

export default async function AppointmentDetailPage({ params }: PageProps) {
  const session = await requireTenantPermission("/appointments");
  const { t } = await getServerI18n(session);
  const { appointmentId } = await params;
  const appointment = await getAppointmentById(session.tenantId, appointmentId);
  if (!appointment) notFound();

  const canEdit = await hasTenantPermission(
    session.tenantId,
    session.userId,
    "/appointments/new",
    "canEdit",
  );

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="appointmentDetail" description={t("appointment.detail.description")} />
      <AppointmentDetailPanel appointment={appointment} canEdit={canEdit} />
    </div>
  );
}
