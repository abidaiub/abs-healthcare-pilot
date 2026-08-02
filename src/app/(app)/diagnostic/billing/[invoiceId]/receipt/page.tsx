import { notFound } from "next/navigation";
import { getInvoiceForReceiptAction } from "@/app/actions/tenant-billing";
import { CashMemoView } from "@/components/billing/CashMemoView";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { toInvoiceView } from "@/lib/billing/view";
import { prisma } from "@/lib/db";
import { requireTenantPermission } from "@/lib/rbac/auth";

export default async function CashMemoPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const session = await requireTenantPermission("/diagnostic/billing/receipt", "canPrint");
  const invoice = await getInvoiceForReceiptAction(invoiceId);
  if (!invoice) notFound();

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { tenantName: true, address: true, contactMobile: true, reportFooterText: true },
  });

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="diagnosticCashMemo"
        description={invoice.invoiceNumber}
      />
      <CashMemoView
        invoice={toInvoiceView(invoice)}
        branding={{
          tenantName: tenant.tenantName,
          branchName: invoice.branch.name,
          address: tenant.address,
          contactMobile: tenant.contactMobile,
          footerText: tenant.reportFooterText,
        }}
      />
    </div>
  );
}
