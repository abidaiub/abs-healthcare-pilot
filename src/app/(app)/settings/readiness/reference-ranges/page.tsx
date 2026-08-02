import { ReferenceRangeReadinessPanel } from "@/components/operational-readiness/ReferenceRangeReadinessPanel";
import { ReadinessPageShell } from "@/components/operational-readiness/ReadinessPageShell";
import { READINESS_RESOURCE } from "@/lib/operational-readiness/constants";
import { listReferenceRangeReadinessRows } from "@/lib/operational-readiness/queries";
import { requireTenantPermission } from "@/lib/rbac/auth";

export default async function ReferenceRangeReadinessPage() {
  const session = await requireTenantPermission(READINESS_RESOURCE);
  const rows = await listReferenceRangeReadinessRows(session.tenantId);

  return (
    <ReadinessPageShell
      screenKey="readinessReferenceRanges"
      description="Male, female, paediatric, unit, normal and critical range coverage."
    >
      <ReferenceRangeReadinessPanel rows={rows} />
    </ReadinessPageShell>
  );
}
