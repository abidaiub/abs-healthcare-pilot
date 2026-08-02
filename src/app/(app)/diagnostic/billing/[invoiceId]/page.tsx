import { notFound } from "next/navigation";
import { getInvoiceAction } from "@/app/actions/tenant-billing";
import { InvoiceDetailPanel } from "@/components/billing/InvoiceDetailPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { toInvoiceView } from "@/lib/billing/view";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function DiagnosticInvoicePage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const session = await requireTenantPermission("/diagnostic/billing", "canView");
  const invoice = await getInvoiceAction(invoiceId);
  if (!invoice) notFound();

  const [canIssue, canDiscount, canPay, canReverse, canCancel, canPrint] = await Promise.all([
    hasTenantPermission(session.tenantId, session.userId, "/diagnostic/billing/invoice", "canEdit"),
    hasTenantPermission(
      session.tenantId,
      session.userId,
      "/diagnostic/billing/discount",
      "canApprove",
    ),
    hasTenantPermission(
      session.tenantId,
      session.userId,
      "/diagnostic/billing/payment",
      "canCreate",
    ),
    hasTenantPermission(
      session.tenantId,
      session.userId,
      "/diagnostic/billing/payment-reversal",
      "canApprove",
    ),
    hasTenantPermission(
      session.tenantId,
      session.userId,
      "/diagnostic/billing/invoice",
      "canDelete",
    ),
    hasTenantPermission(
      session.tenantId,
      session.userId,
      "/diagnostic/billing/receipt",
      "canPrint",
    ),
  ]);

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="diagnosticInvoice"
        description={`${invoice.invoiceNumber} · ${invoice.patient.fullName}`}
      />
      <InvoiceDetailPanel
        invoice={toInvoiceView(invoice)}
        permissions={{ canIssue, canDiscount, canPay, canReverse, canCancel, canPrint }}
      />
    </div>
  );
}
