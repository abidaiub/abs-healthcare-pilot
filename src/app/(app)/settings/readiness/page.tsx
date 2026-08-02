import { ReadinessDashboardPanel } from "@/components/operational-readiness/ReadinessDashboardPanel";
import { ReadinessPageShell } from "@/components/operational-readiness/ReadinessPageShell";
import { READINESS_RESOURCE } from "@/lib/operational-readiness/constants";
import { loadOperationalReadiness } from "@/lib/operational-readiness/queries";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function OperationalReadinessPage() {
  const session = await requireTenantPermission(READINESS_RESOURCE);
  const report = await loadOperationalReadiness(session.tenantId);
  const canApprove = await hasTenantPermission(
    session.tenantId,
    session.userId,
    READINESS_RESOURCE,
    "canApprove",
  );

  return (
    <ReadinessPageShell
      screenKey="operationalReadiness"
      description="Tenant go-live checklist, readiness score, and READY FOR FIRST PATIENT gate."
    >
      <ReadinessDashboardPanel report={report} canApprove={canApprove} />
    </ReadinessPageShell>
  );
}
