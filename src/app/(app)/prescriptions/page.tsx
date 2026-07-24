import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { PrescriptionListPanel } from "@/components/prescriptions/PrescriptionListPanel";
import { listPrescriptionsAction } from "@/app/actions/tenant-prescriptions";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission } from "@/lib/rbac/auth";

export default async function PrescriptionsPage() {
  const session = await requireTenantPermission("/prescriptions");
  const { t } = await getServerI18n(session);
  const prescriptions = await listPrescriptionsAction();

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="prescriptionList"
        description={t("prescription.list.description")}
      />
      <PrescriptionListPanel rows={prescriptions} />
    </div>
  );
}
