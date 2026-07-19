import { AuditLogPanel } from "@/components/host/AuditLogPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireHostSession } from "@/lib/auth";
import { listAuditLogsForHost, listTenantsForHost } from "@/lib/saas/queries";

export default async function HostAuditPage() {
  await requireHostSession();
  const [logs, tenants] = await Promise.all([
    listAuditLogsForHost(),
    listTenantsForHost(),
  ]);

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="hostAuditLog"
        description="Immutable audit trail — tenant, user, and platform administrative changes."
      />
      <AuditLogPanel logs={logs} tenantCodes={tenants.map((t) => t.code)} />
    </div>
  );
}
