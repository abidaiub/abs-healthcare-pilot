import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { QueueOperatorPanel } from "@/components/appointments/QueueOperatorPanel";
import { resolveAppointmentBranch } from "@/lib/appointment/context";
import {
  getQueueSummary,
  listAppointmentDoctorOptions,
  listQueueAppointments,
} from "@/lib/appointment/queries";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = {
  searchParams: Promise<{ doctorId?: string }>;
};

export default async function QueueOperatorPage({ searchParams }: PageProps) {
  await requireTenantPermission("/appointments/queue/operator", "canEdit");
  const session = await requireTenantPermission("/appointments/queue");
  const { t } = await getServerI18n(session);
  const params = await searchParams;
  const branchResult = await resolveAppointmentBranch(session);
  if (!branchResult.ok) {
    return <p>{t("appointment.errors.APPOINTMENT_BRANCH_REQUIRED")}</p>;
  }

  const doctors = await listAppointmentDoctorOptions(session.tenantId, branchResult.branch.id);
  const doctorId = params.doctorId ?? doctors[0]?.id;
  const today = new Date();

  if (!doctorId) {
    return <p>{t("appointment.errors.APPOINTMENT_DOCTOR_INACTIVE")}</p>;
  }

  const [summary, queueRows] = await Promise.all([
    getQueueSummary(session.tenantId, branchResult.branch.id, doctorId, today),
    listQueueAppointments(session.tenantId, branchResult.branch.id, doctorId, today),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="queueOperator" description={t("appointment.operator.description")} />
      <QueueOperatorPanel queueRows={queueRows} summary={summary} canOperate />
    </div>
  );
}
