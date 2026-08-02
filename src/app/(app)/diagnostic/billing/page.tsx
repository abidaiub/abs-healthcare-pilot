import { listBillableLabOrdersAction } from "@/app/actions/tenant-billing";
import { BillingWorklistPanel } from "@/components/billing/BillingWorklistPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function DiagnosticBillingPage() {
  const session = await requireTenantPermission("/diagnostic/billing", "canView");
  const canCreateInvoice = await hasTenantPermission(
    session.tenantId,
    session.userId,
    "/diagnostic/billing/invoice",
    "canCreate",
  );
  const orders = await listBillableLabOrdersAction();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="diagnosticBilling"
        description={`Bill confirmed investigation orders at ${session.branchName}.`}
      />
      <BillingWorklistPanel orders={orders} canCreateInvoice={canCreateInvoice} />
    </div>
  );
}
