import { CatalogReadinessPanel } from "@/components/operational-readiness/CatalogReadinessPanel";
import { ReadinessPageShell } from "@/components/operational-readiness/ReadinessPageShell";
import { READINESS_RESOURCE } from "@/lib/operational-readiness/constants";
import { listCatalogReadinessRows } from "@/lib/operational-readiness/queries";
import { requireTenantPermission } from "@/lib/rbac/auth";

export default async function CatalogReadinessPage() {
  const session = await requireTenantPermission(READINESS_RESOURCE);
  const rows = await listCatalogReadinessRows(session.tenantId);

  return (
    <ReadinessPageShell
      screenKey="readinessCatalog"
      description="Verify department, price, sample type, tube, analyzer mapping, and ranges."
    >
      <CatalogReadinessPanel rows={rows} />
    </ReadinessPageShell>
  );
}
