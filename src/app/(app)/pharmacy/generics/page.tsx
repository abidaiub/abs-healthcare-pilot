import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { GenericManagementPanel } from "@/components/pharmacy/GenericManagementPanel";
import { listGenericsAction, listReferenceDataAction } from "@/app/actions/tenant-medications";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function GenericsPage() {
  const session = await requireTenantPermission("/pharmacy/generics");
  const { t } = await getServerI18n(session);
  const [generics, referenceData, canCreate] = await Promise.all([
    listGenericsAction(),
    listReferenceDataAction(),
    hasTenantPermission(session.tenantId, session.userId, "/pharmacy/generics", "canCreate"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="genericManagement" description={t("pharmacy.generics.description")} />
      <GenericManagementPanel generics={generics} categories={referenceData.categories} canCreate={canCreate} />
    </div>
  );
}
