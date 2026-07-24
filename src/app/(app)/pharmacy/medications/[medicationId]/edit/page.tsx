import { notFound } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { MedicationForm, medicationRecordToFormValues } from "@/components/pharmacy/MedicationForm";
import {
  getMedicationByIdAction,
  listBranchesForMedicationAction,
  listGenericsAction,
  listManufacturersAction,
  listReferenceDataAction,
} from "@/app/actions/tenant-medications";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ medicationId: string }> };

export default async function MedicationEditPage({ params }: PageProps) {
  const session = await requireTenantPermission("/pharmacy/medications");
  const { t } = await getServerI18n(session);
  const { medicationId } = await params;

  let medication;
  try {
    medication = await getMedicationByIdAction(medicationId);
  } catch {
    notFound();
  }

  const canEdit = await hasTenantPermission(
    session.tenantId,
    session.userId,
    "/pharmacy/medications/edit",
    "canEdit",
  );

  const [generics, manufacturers, referenceData, branches] = await Promise.all([
    listGenericsAction(),
    listManufacturersAction(),
    listReferenceDataAction(),
    listBranchesForMedicationAction(),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="medicationEdit" description={t("pharmacy.edit.description")} />
      <MedicationForm
        mode="edit"
        medicationId={medication.id}
        internalCode={medication.internalCode}
        status={medication.status}
        initialValues={medicationRecordToFormValues(medication)}
        generics={generics}
        manufacturers={manufacturers}
        referenceData={referenceData}
        branches={branches}
        canEdit={canEdit}
      />
    </div>
  );
}
