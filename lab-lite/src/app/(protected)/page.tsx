import { requirePrincipal } from "../../lib/session";
export default async function Home() {
  const p = await requirePrincipal();
  return <main><section className="card"><h1>Laboratory and patient-billing foundation</h1><p>Tenant <code>{p.tenantId}</code> · Branch <code>{p.branchId}</code></p><p className="muted">Phase 2 adds transactional patient billing, collections, controlled cancellations/refunds, daily reconciliation, and HTML receipt printing. Clinical result entry and offline billing remain out of scope.</p></section>
  <section className="card warning"><strong>Clinical safety boundary</strong><p>Bundled demonstration catalog entries are synthetic and unreviewed. No patient result defaults or clinical reference ranges are supplied.</p></section></main>;
}
