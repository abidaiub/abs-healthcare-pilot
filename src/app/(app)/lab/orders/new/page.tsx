import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { LabOrderForm } from "@/components/laboratory/LabOrderForm";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission } from "@/lib/rbac/auth";

export default async function NewLabOrderPage() {
  await requireTenantPermission("/lab/orders/manual", "canCreate");
  const session = await requireTenantPermission("/lab/orders");
  const { t } = await getServerI18n(session);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="labOrderNew" description={t("laboratory.new.description")} />
      <LabOrderForm mode="create" canEdit />
    </div>
  );
}
