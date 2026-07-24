import { notFound, redirect } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { LabOrderForm } from "@/components/laboratory/LabOrderForm";
import { getLabOrderByIdAction } from "@/app/actions/tenant-lab-orders";
import { isLabOrderEditable } from "@/lib/laboratory/constants";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ orderId: string }> };

export default async function LabOrderEditPage({ params }: PageProps) {
  const session = await requireTenantPermission("/lab/orders");
  const { t } = await getServerI18n(session);
  const { orderId } = await params;
  const order = await getLabOrderByIdAction(orderId).catch(() => null);
  if (!order) notFound();
  if (!isLabOrderEditable(order.status)) redirect(`/lab/orders/${orderId}`);

  const canEdit = await hasTenantPermission(session.tenantId, session.userId, "/lab/orders/edit", "canEdit");

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="labOrderEdit" description={t("laboratory.edit.description")} />
      <LabOrderForm
        mode="edit"
        canEdit={canEdit}
        order={{
          id: order.id,
          orderNumber: order.orderNumber,
          priority: order.priority,
          clinicalNote: order.clinicalNote,
          tests: order.tests.map((test) => ({
            id: test.id,
            testName: test.testName,
            tenantServiceId: test.tenantServiceId,
          })),
        }}
      />
    </div>
  );
}
