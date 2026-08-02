import { notFound } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { LabOrderDetailPanel } from "@/components/laboratory/LabOrderDetailPanel";
import { getLabOrderByIdAction } from "@/app/actions/tenant-lab-orders";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ orderId: string }> };

export default async function LabOrderDetailPage({ params }: PageProps) {
  const session = await requireTenantPermission("/lab/orders");
  const { t } = await getServerI18n(session);
  const { orderId } = await params;
  const order = await getLabOrderByIdAction(orderId).catch(() => null);
  if (!order) notFound();

  const [canEdit, canConfirm, canCancel, canCollect] = await Promise.all([
    hasTenantPermission(session.tenantId, session.userId, "/lab/orders/edit", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/orders/confirm", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/orders/cancel", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/orders/collect", "canEdit"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="labOrderDetail" description={t("laboratory.detail.description")} />
      <LabOrderDetailPanel
        order={{
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          orderSource: order.orderSource,
          priority: order.priority,
          orderedAt: order.orderedAt,
          clinicalNote: order.clinicalNote,
          patient: {
            patientNumber: order.patient.patientNumber,
            fullName: order.patient.fullName,
          },
          doctor: order.doctor ? { doctorName: order.doctor.doctorName } : null,
          branch: { code: order.branch.code, name: order.branch.name },
          tests: order.tests.map((test) => ({
            id: test.id,
            testName: test.testName,
            status: test.status,
            specimenRequirementSnapshot: test.specimenRequirementSnapshot,
          })),
          samples: order.samples.map((sample) => ({
            id: sample.id,
            accessionNumber: sample.accessionNumber,
            sampleStatus: sample.sampleStatus,
            sampleType: sample.sampleType ? { sampleType: sample.sampleType.sampleType } : null,
            sampleContainer: sample.sampleContainer
              ? { containerType: sample.sampleContainer.containerType }
              : null,
          })),
        }}
        canEdit={canEdit}
        canConfirm={canConfirm}
        canCancel={canCancel}
        canCollect={canCollect}
      />
    </div>
  );
}
