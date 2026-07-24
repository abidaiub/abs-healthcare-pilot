import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { MedicationImportPanel } from "@/components/pharmacy/MedicationImportPanel";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function MedicationImportPage() {
  const session = await requireTenantPermission("/pharmacy/import");
  const { t } = await getServerI18n(session);
  const canCreate = await hasTenantPermission(
    session.tenantId,
    session.userId,
    "/pharmacy/import",
    "canCreate",
  );

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="medicationImport" description={t("pharmacy.import.description")} />
      <MedicationImportPanel canCreate={canCreate} />
    </div>
  );
}
