import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { MedicationForm } from "@/components/pharmacy/MedicationForm";
import {
  listBranchesForMedicationAction,
  listGenericsAction,
  listManufacturersAction,
  listReferenceDataAction,
} from "@/app/actions/tenant-medications";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission } from "@/lib/rbac/auth";

export default async function NewMedicationPage() {
  await requireTenantPermission("/pharmacy/medications/new", "canCreate");
  const session = await requireTenantPermission("/pharmacy/medications");
  const { t } = await getServerI18n(session);
  const [generics, manufacturers, referenceData, branches] = await Promise.all([
    listGenericsAction(),
    listManufacturersAction(),
    listReferenceDataAction(),
    listBranchesForMedicationAction(),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="medicationNew" description={t("pharmacy.new.description")} />
      <MedicationForm
        mode="create"
        generics={generics}
        manufacturers={manufacturers}
        referenceData={referenceData}
        branches={branches}
        canEdit
      />
    </div>
  );
}
