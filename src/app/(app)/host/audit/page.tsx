import { AuditLogPanel } from "@/components/host/AuditLogPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireHostSession } from "@/lib/auth";

export default async function HostAuditPage() {
  await requireHostSession();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="hostAuditLog"
        description="Immutable audit trail — tenant, user, and platform administrative changes."
      />
      <AuditLogPanel />
    </div>
  );
}
