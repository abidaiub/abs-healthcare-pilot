import Link from "next/link";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { QueueOperatorPanel } from "@/components/appointments/QueueOperatorPanel";
import { Button } from "@/components/ui";
import { resolveAppointmentBranch } from "@/lib/appointment/context";
import {
  getQueueSummary,
  listAppointmentDoctorOptions,
  listQueueAppointments,
} from "@/lib/appointment/queries";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = {
  searchParams: Promise<{ doctorId?: string }>;
};

export default async function QueueDashboardPage({ searchParams }: PageProps) {
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

  const [summary, queueRows, canOperate] = doctorId
    ? await Promise.all([
        getQueueSummary(session.tenantId, branchResult.branch.id, doctorId, today),
        listQueueAppointments(session.tenantId, branchResult.branch.id, doctorId, today),
        hasTenantPermission(session.tenantId, session.userId, "/appointments/queue/operator", "canEdit"),
      ])
    : [{ waitingCount: 0, calledCount: 0, inConsultationCount: 0, nextToken: null, currentToken: null }, [], false];

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="queueDashboard"
        description={t("appointment.queue.description")}
        action={
          <Link href={`/appointments/queue/operator${doctorId ? `?doctorId=${doctorId}` : ""}`}>
            <Button type="button">{t("appointment.actions.openOperator")}</Button>
          </Link>
        }
      />
      {doctorId && (
        <QueueOperatorPanel
          queueRows={queueRows}
          summary={summary}
          canOperate={canOperate}
        />
      )}
    </div>
  );
}
