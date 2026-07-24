import { notFound, redirect } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { LabOrderDetailPanel } from "@/components/laboratory/LabOrderDetailPanel";
import { getLabOrderByIdAction } from "@/app/actions/tenant-lab-orders";
import { isLabOrderEditable } from "@/lib/laboratory/constants";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ orderId: string }> };

export default async function LabOrderDetailPage({ params }: PageProps) {
  const session = await requireTenantPermission("/lab/orders");
  const { t } = await getServerI18n(session);
  const { orderId } = await params;
  const order = await getLabOrderByIdAction(orderId).catch(() => null);
  if (!order) notFound();

  if (isLabOrderEditable(order.status)) {
    redirect(`/lab/orders/${orderId}/edit`);
  }

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
        order={order}
        canEdit={canEdit}
        canConfirm={canConfirm}
        canCancel={canCancel}
        canCollect={canCollect}
      />
    </div>
  );
}
