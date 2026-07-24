import Link from "next/link";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { MedicationListPanel } from "@/components/pharmacy/MedicationListPanel";
import { Button } from "@/components/ui";
import { listMedicationsAction } from "@/app/actions/tenant-medications";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function MedicationsPage() {
  const session = await requireTenantPermission("/pharmacy/medications");
  const { t } = await getServerI18n(session);
  const [medications, canCreate] = await Promise.all([
    listMedicationsAction(),
    hasTenantPermission(session.tenantId, session.userId, "/pharmacy/medications/new", "canCreate"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="medicationList"
        description={t("pharmacy.list.description")}
        action={
          canCreate ? (
            <Link href="/pharmacy/medications/new">
              <Button>{t("pharmacy.actions.create")}</Button>
            </Link>
          ) : undefined
        }
      />
      <MedicationListPanel rows={medications} canCreate={canCreate} />
    </div>
  );
}
