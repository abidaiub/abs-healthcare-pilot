import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { ReferenceDataPanel } from "@/components/pharmacy/ReferenceDataPanel";
import { listReferenceDataAction } from "@/app/actions/tenant-medications";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission } from "@/lib/rbac/auth";

export default async function ReferenceDataPage() {
  const session = await requireTenantPermission("/pharmacy/reference-data");
  const { t } = await getServerI18n(session);
  const referenceData = await listReferenceDataAction();

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="medicationReferenceData" description={t("pharmacy.referenceData.description")} />
      <ReferenceDataPanel referenceData={referenceData} />
    </div>
  );
}
