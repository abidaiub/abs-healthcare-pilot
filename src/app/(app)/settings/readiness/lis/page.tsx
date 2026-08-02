import { LisReadinessPanel } from "@/components/operational-readiness/LisReadinessPanel";
import { ReadinessPageShell } from "@/components/operational-readiness/ReadinessPageShell";
import { READINESS_RESOURCE } from "@/lib/operational-readiness/constants";
import { listLisAnalyzers } from "@/lib/operational-readiness/queries";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function LisReadinessPage() {
  const session = await requireTenantPermission(READINESS_RESOURCE);
  const [analyzers, canEdit] = await Promise.all([
    listLisAnalyzers(session.tenantId, session.branchId),
    hasTenantPermission(
      session.tenantId,
      session.userId,
      READINESS_RESOURCE,
      "canEdit",
    ),
  ]);

  return (
    <ReadinessPageShell
      screenKey="readinessLis"
      description="LIS connection status, last communication, mapped tests, and simulated import test."
    >
      <LisReadinessPanel
        canEdit={canEdit}
        analyzers={analyzers.map((a) => ({
          id: a.id,
          analyzerCode: a.analyzerCode,
          machineName: a.machineName,
          lisEndpoint: a.lisEndpoint,
          lisConnectionStatus: a.lisConnectionStatus,
          lisLastCommunicationAt: a.lisLastCommunicationAt?.toISOString() ?? null,
          mappedTests: a.mappings.map((m) => m.tenantService.localName),
        }))}
      />
    </ReadinessPageShell>
  );
}
