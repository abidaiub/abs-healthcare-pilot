import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { LabReceiptPanel } from "@/components/laboratory/LabReceiptPanel";
import { listReceiptWorklistAction, listRejectionReasonsAction } from "@/app/actions/tenant-lab-orders";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function LabReceiptPage() {
  const session = await requireTenantPermission("/lab/receipt");
  const { t } = await getServerI18n(session);
  const [samples, rejectionReasons, canEdit] = await Promise.all([
    listReceiptWorklistAction(),
    listRejectionReasonsAction(),
    hasTenantPermission(session.tenantId, session.userId, "/lab/receipt", "canEdit"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="labReceiptWorklist" description={t("laboratory.receipt.description")} />
      <LabReceiptPanel samples={samples} rejectionReasons={rejectionReasons} canEdit={canEdit} />
    </div>
  );
}
