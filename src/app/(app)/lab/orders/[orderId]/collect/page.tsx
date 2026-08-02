import { notFound } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { LabCollectionPanel } from "@/components/laboratory/LabCollectionPanel";
import { getLabOrderByIdAction } from "@/app/actions/tenant-lab-orders";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ orderId: string }> };

export default async function LabOrderCollectPage({ params }: PageProps) {
  const session = await requireTenantPermission("/lab/orders/collect");
  const { t } = await getServerI18n(session);
  const { orderId } = await params;
  const order = await getLabOrderByIdAction(orderId).catch(() => null);
  if (!order) notFound();

  const [canCollect, canConfirm] = await Promise.all([
    hasTenantPermission(session.tenantId, session.userId, "/lab/orders/collect", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/orders/confirm", "canEdit"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="labOrderCollect" description={t("laboratory.collect.description")} />
      <LabCollectionPanel
        orders={[
          {
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
          },
        ]}
        canCollect={canCollect}
        canConfirm={canConfirm}
      />
    </div>
  );
}
