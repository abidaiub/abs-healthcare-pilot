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
      <LabReceiptPanel
        samples={samples.map((sample) => ({
          id: sample.id,
          accessionNumber: sample.accessionNumber,
          sampleStatus: sample.sampleStatus,
          collectedAt: sample.collectedAt,
          sampleType: sample.sampleType ? { sampleType: sample.sampleType.sampleType } : null,
          labOrder: {
            orderNumber: sample.labOrder.orderNumber,
            patient: {
              patientNumber: sample.labOrder.patient.patientNumber,
              fullName: sample.labOrder.patient.fullName,
            },
          },
        }))}
        rejectionReasons={rejectionReasons.map((reason) => ({
          id: reason.id,
          reasonCode: reason.reasonCode,
          displayName: reason.displayName,
        }))}
        canEdit={canEdit}
      />
    </div>
  );
}
