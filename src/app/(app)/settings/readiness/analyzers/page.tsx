import { AnalyzerReadinessPanel } from "@/components/operational-readiness/AnalyzerReadinessPanel";
import { ReadinessPageShell } from "@/components/operational-readiness/ReadinessPageShell";
import { prisma } from "@/lib/db";
import { READINESS_RESOURCE } from "@/lib/operational-readiness/constants";
import { listLisAnalyzers } from "@/lib/operational-readiness/queries";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function AnalyzerReadinessPage() {
  const session = await requireTenantPermission(READINESS_RESOURCE);
  const [analyzers, departments, canCreate] = await Promise.all([
    listLisAnalyzers(session.tenantId, session.branchId),
    prisma.department.findMany({
      where: {
        isActive: true,
        OR: [{ tenantId: session.tenantId }, { tenantId: null }],
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    hasTenantPermission(
      session.tenantId,
      session.userId,
      READINESS_RESOURCE,
      "canCreate",
    ),
  ]);

  return (
    <ReadinessPageShell
      screenKey="readinessAnalyzers"
      description="Analyzer browser CRUD, department, status, and supported test mappings."
    >
      <AnalyzerReadinessPanel
        canCreate={canCreate}
        departments={departments}
        analyzers={analyzers.map((a) => ({
          id: a.id,
          analyzerCode: a.analyzerCode,
          machineName: a.machineName,
          isActive: a.isActive,
          departmentName: a.department.name,
          mappingCount: a.mappings.length,
          lisConnectionStatus: a.lisConnectionStatus,
          interfaceType: a.interfaceType,
        }))}
      />
    </ReadinessPageShell>
  );
}
