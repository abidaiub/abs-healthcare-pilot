import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { BranchAvailabilityPanel } from "@/components/pharmacy/BranchAvailabilityPanel";
import { listBranchesForMedicationAction, listMedicationsAction } from "@/app/actions/tenant-medications";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function BranchAvailabilityPage() {
  const session = await requireTenantPermission("/pharmacy/branch-availability");
  const { t } = await getServerI18n(session);
  const [medications, branches, canEdit] = await Promise.all([
    listMedicationsAction({ status: "ACTIVE" }),
    listBranchesForMedicationAction(),
    hasTenantPermission(session.tenantId, session.userId, "/pharmacy/branch-availability", "canEdit"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="branchMedicationAvailability"
        description={t("pharmacy.branchAvailability.description")}
      />
      <BranchAvailabilityPanel
        medications={medications.map((row: { id: string; internalCode: string; brandName: string; displayStrength: string | null }) => ({
          id: row.id,
          internalCode: row.internalCode,
          brandName: row.brandName,
          displayStrength: row.displayStrength,
        }))}
        branches={branches}
        canEdit={canEdit}
      />
    </div>
  );
}
