import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { LabCollectionPanel } from "@/components/laboratory/LabCollectionPanel";
import { listCollectionWorklistAction } from "@/app/actions/tenant-lab-orders";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function LabCollectionPage() {
  const session = await requireTenantPermission("/lab/collection");
  const { t } = await getServerI18n(session);
  const [orders, canCollect, canConfirm] = await Promise.all([
    listCollectionWorklistAction(),
    hasTenantPermission(session.tenantId, session.userId, "/lab/orders/collect", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/orders/confirm", "canEdit"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="labCollectionWorklist" description={t("laboratory.collection.description")} />
      <LabCollectionPanel
        orders={orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          orderedAt: order.orderedAt,
          patient: {
            patientNumber: order.patient.patientNumber,
            fullName: order.patient.fullName,
          },
          samples: order.samples.map((sample) => ({
            id: sample.id,
            accessionNumber: sample.accessionNumber,
            sampleStatus: sample.sampleStatus,
            sampleType: sample.sampleType ? { sampleType: sample.sampleType.sampleType } : null,
            sampleContainer: sample.sampleContainer
              ? { containerType: sample.sampleContainer.containerType }
              : null,
          })),
        }))}
        canCollect={canCollect}
        canConfirm={canConfirm}
      />
    </div>
  );
}
