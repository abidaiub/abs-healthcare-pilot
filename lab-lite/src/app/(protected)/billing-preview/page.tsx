import { requirePrincipal } from "../../../lib/session";
import { calculateQuote } from "../../../domain/billing/quote";
import { stableOperationId } from "../../../lib/tokens";
export default async function BillingPreviewPage() {
  const p = await requirePrincipal("billing", "read");
  const quote = calculateQuote({ operationId: stableOperationId("preview"), tenantId:p.tenantId,branchId:p.branchId,currencyCode:"BDT",discountType:"PERCENTAGE",discountValue:"10",lines:[{testId:"preview-only",testCode:"DEMO",testName:"Non-persistent example",unitPrice:"100.00"}] });
  return <main><h1>Billing calculation preview</h1><section className="card warning"><strong>No invoice or payment is created.</strong><p>Phase 1 contains calculation and immutable snapshot contracts only. Billing writes remain excluded until validation and payment are atomic and replay-safe.</p></section><section className="card"><pre>{JSON.stringify(quote,null,2)}</pre></section></main>;
}
