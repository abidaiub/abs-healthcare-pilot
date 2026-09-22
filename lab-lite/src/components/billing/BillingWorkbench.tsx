"use client";

import { useEffect, useMemo, useState } from "react";

type Row = { id:string; [key:string]:unknown };
type Context = { patients:Row[]; tests:Row[]; doctors:Row[]; partners:Row[]; drafts:Row[] };
type CartLine = { testId:string; lineKey:string; code:string; name:string; groupName:string; price:string; quantity:number; repeatReason?:string };
type PrintFormat = "A4" | "A5" | "POS80" | "POS58";
type PaymentMethod = "CASH" | "BKASH" | "NAGAD" | "CARD" | "BANK";

const paymentMethods: PaymentMethod[] = ["CASH", "BKASH", "NAGAD", "CARD", "BANK"];
const operation = () => `web_${crypto.randomUUID()}`;
const moneyToMinor = (value:string) => {
  const raw = value.trim();
  if (!raw) return 0;
  if (!/^\d+(\.\d+)?$/.test(raw)) return Number.NaN;
  const [whole, fraction = ""] = raw.split(".");
  const padded = `${fraction}000`;
  return Number(whole) * 100 + Number(padded.slice(0, 2)) + (Number(padded[2]) >= 5 ? 1 : 0);
};
const formatMinor = (value:number) => Number.isFinite(value) ? `${Math.floor(value / 100)}.${String(Math.abs(value % 100)).padStart(2, "0")}` : "—";

async function api(body:unknown) {
  const response = await fetch("/api/billing", { method:"POST", headers:{ "content-type":"application/json" }, body:JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Request failed");
  return data as Record<string, unknown>;
}

export function BillingWorkbench() {
  const [ctx, setCtx] = useState<Context>({ patients:[], tests:[], doctors:[], partners:[], drafts:[] });
  const [cart, setCart] = useState<CartLine[]>([]);
  const [patientId, setPatientId] = useState("");
  const [patientSnapshot, setPatientSnapshot] = useState<Row|null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [testSearch, setTestSearch] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [expected, setExpected] = useState("");
  const [discountType, setDiscountType] = useState<"NONE"|"PERCENTAGE"|"FIXED_AMOUNT">("NONE");
  const [discountValue, setDiscountValue] = useState("0");
  const [pay1, setPay1] = useState("");
  const [method1, setMethod1] = useState<PaymentMethod>("CASH");
  const [pay2, setPay2] = useState("");
  const [method2, setMethod2] = useState<PaymentMethod>("BKASH");
  const [printFormat, setPrintFormat] = useState<PrintFormat>("POS80");
  const [op, setOp] = useState(operation);
  const [result, setResult] = useState<Record<string,unknown>|null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [bills, setBills] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Record<string,unknown>|null>(null);

  const refresh = async (query = "") => {
    const [context, billRows] = await Promise.all([
      fetch(`/api/billing?view=context&q=${encodeURIComponent(query)}`).then(response => response.json()),
      fetch("/api/billing?view=bills").then(response => response.json()),
    ]);
    setCtx(context); setBills(billRows);
  };

  useEffect(() => { let active = true; void Promise.all([
    fetch("/api/billing?view=context").then(response => response.json()),
    fetch("/api/billing?view=bills").then(response => response.json()),
  ]).then(([context,billRows]) => { if (active) { setCtx(context); setBills(billRows); } }); return () => { active = false; }; }, []);

  useEffect(() => {
    const query = testSearch.trim() || patientSearch.trim();
    const timer = window.setTimeout(() => { void fetch(`/api/billing?view=context&q=${encodeURIComponent(query)}`).then(response => response.json()).then(setCtx); }, 180);
    return () => window.clearTimeout(timer);
  }, [patientSearch, testSearch]);

  const selectedPatient = ctx.patients.find(patient => patient.id === patientId) ?? patientSnapshot;
  const totals = useMemo(() => {
    const gross = cart.reduce((sum, line) => sum + moneyToMinor(line.price) * line.quantity, 0);
    let discount = 0;
    if (discountType === "PERCENTAGE") discount = Math.round(gross * moneyToMinor(discountValue) / 10000);
    if (discountType === "FIXED_AMOUNT") discount = moneyToMinor(discountValue);
    const net = Math.max(0, gross - (Number.isFinite(discount) ? discount : 0));
    const paid = [pay1,pay2].reduce((sum, value) => sum + (Number.isFinite(moneyToMinor(value)) ? moneyToMinor(value) : 0), 0);
    return { gross, discount, net, paid, due:net-paid };
  }, [cart, discountType, discountValue, pay1, pay2]);

  const add = (test:Row) => {
    const duplicate = cart.some(line => line.testId === test.id);
    let repeatReason:string|undefined;
    if (duplicate) {
      repeatReason = window.prompt("This test is already in the cart. Enter the clinical/operational reason for an intentional repeat:")?.trim();
      if (!repeatReason) { setMessage("Duplicate test was not added because a repeat reason is required."); return; }
    }
    setCart(lines => [...lines, { testId:test.id, lineKey:crypto.randomUUID(), code:String(test.code), name:String(test.name), groupName:String(test.group_name), price:String(test.price), quantity:1, repeatReason }]);
    setTestSearch(""); setResult(null);
  };

  const receiptUrl = (billId:string) => `/receipts/bill/${billId}?copy=PATIENT&format=${printFormat}`;
  const post = async (printAfter = false) => {
    let preview:Window|null = null;
    if (printAfter) preview = window.open("about:blank", "_blank");
    try {
      if (!patientId) throw new Error("Select or create a patient before saving.");
      if (!cart.length) throw new Error("Add at least one test before saving.");
      setBusy(true); setMessage("Validating and saving the bill…");
      const payments = [pay1 && { amount:pay1, method:method1 }, pay2 && { amount:pay2, method:method2 }].filter(Boolean);
      const saved = await api({ action:"postBill", input:{ operationId:op, patientId, doctorId:doctorId||undefined, referralPartnerId:partnerId||undefined, expectedDeliveryAt:expected||undefined, lines:cart.map(({testId,lineKey,quantity,repeatReason}) => ({testId,lineKey,quantity,repeatReason})), discountType, discountValue, payments } });
      setResult(saved);
      setMessage(saved.idempotent ? "The previously saved bill was recovered safely." : `Bill ${String(saved.billNumber)} saved atomically.`);
      await refresh();
      if (preview && saved.billId) preview.location.href = receiptUrl(String(saved.billId));
    } catch (error) {
      preview?.close(); setMessage(error instanceof Error ? error.message : "Save failed");
    } finally { setBusy(false); }
  };

  const clear = () => {
    setCart([]); setPatientId(""); setPatientSnapshot(null); setPatientSearch(""); setDoctorId(""); setPartnerId(""); setExpected("");
    setDiscountType("NONE"); setDiscountValue("0"); setPay1(""); setPay2(""); setResult(null); setOp(operation());
    setMessage("Billing form cleared. No posted bill was changed.");
  };

  const hold = async () => {
    try {
      setBusy(true);
      await api({ action:"saveDraft", input:{ operationId:op, patientId:patientId||undefined, payload:{ cart,patientId,doctorId,partnerId,expected,discountType,discountValue,pay1,method1,pay2,method2,printFormat } } });
      setMessage("Bill held safely for later resume."); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Hold failed"); }
    finally { setBusy(false); }
  };

  const resume = (draft:Row) => {
    const payload = draft.payload as Record<string,unknown>;
    setCart((payload.cart as CartLine[]) ?? []); setPatientId(String(payload.patientId??"")); setDoctorId(String(payload.doctorId??""));
    setPartnerId(String(payload.partnerId??"")); setExpected(String(payload.expected??"")); setDiscountType((payload.discountType??"NONE") as typeof discountType);
    setDiscountValue(String(payload.discountValue??"0")); setPay1(String(payload.pay1??"")); setMethod1((payload.method1??"CASH") as PaymentMethod);
    setPay2(String(payload.pay2??"")); setMethod2((payload.method2??"BKASH") as PaymentMethod); setPrintFormat((payload.printFormat??"POS80") as PrintFormat);
    setOp(String(draft.operation_id)); setResult(null); setMessage("Held bill resumed. Review current server prices before saving.");
  };

  const quickPatient = async (form:FormData) => {
    try {
      setBusy(true);
      const created = await api({ action:"quickPatient", patientNumber:String(form.get("patientNumber")), fullName:String(form.get("fullName")), mobile:String(form.get("mobile")??""), sex:String(form.get("sex")??"UNKNOWN") });
      await refresh(); setPatientId(String(created.id)); setPatientSnapshot({id:String(created.id),patient_number:String(form.get("patientNumber")),full_name:String(form.get("fullName")),mobile:String(form.get("mobile")??"")}); setMessage("Patient created and selected without clearing the cart.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Patient creation failed"); }
    finally { setBusy(false); }
  };

  const detail = async (id:string) => { const response = await fetch(`/api/billing?view=receipt&type=bill&id=${id}`); setSelected(await response.json()); };
  const operate = async (action:string,input:Record<string,unknown>) => { try { const output=await api({action,input});setMessage(`${action}: ${JSON.stringify(output)}`);const selectedBillId=selected?String((selected.bill as Row).id):undefined;await refresh();const billId=input.billId?String(input.billId):selectedBillId;if(billId)await detail(billId); } catch(error) { setMessage(error instanceof Error?error.message:"Operation failed"); } };

  return <main className="billing-page">
    <section className="billing-hero"><div><p className="eyebrow">Laboratory information system</p><h1>Lab Billing — Cart</h1><p>Fast patient billing with hold/resume and auditable HTML cash memo.</p></div><strong>{new Date().toLocaleDateString("en-GB")}</strong></section>
    <p role="status" className={`billing-status ${message ? "has-message" : ""}`}>{message || "Server validation remains authoritative for prices, discounts, payments, tenant ownership, and balances."}</p>

    <div className="billing-workspace">
      <section className="billing-panel patient-panel"><header><h2>Patient</h2></header><div className="panel-body">
        <label>Find patient<input value={patientSearch} onChange={event=>setPatientSearch(event.target.value)} placeholder="Name, patient no. or phone" /></label>
        <div className="patient-results">{ctx.patients.slice(0,8).map(patient=><button className={patient.id===patientId?"selected":""} type="button" key={patient.id} onClick={()=>{setPatientId(patient.id);setPatientSnapshot(patient);setPatientSearch("");}}><strong>{String(patient.full_name)}</strong><small>{String(patient.patient_number)} · {String(patient.mobile??"No phone")}</small></button>)}</div>
        {selectedPatient&&<div className="selected-patient"><span>Selected patient</span><strong>{String(selectedPatient.full_name)}</strong><small>{String(selectedPatient.patient_number)} · {String(selectedPatient.mobile??"No phone")}</small></div>}
        <label>Referring doctor<select value={doctorId} onChange={event=>setDoctorId(event.target.value)}><option value="">None</option>{ctx.doctors.map(doctor=><option key={doctor.id} value={doctor.id}>{String(doctor.name)}</option>)}</select></label>
        <label>Referral partner / collection point<select value={partnerId} onChange={event=>setPartnerId(event.target.value)}><option value="">None</option>{ctx.partners.map(partner=><option key={partner.id} value={partner.id}>{String(partner.name)}</option>)}</select></label>
        <label>Expected delivery<input type="datetime-local" value={expected} onChange={event=>setExpected(event.target.value)}/></label>
        <details className="quick-create"><summary>+ New patient</summary><form action={quickPatient} className="stack"><label>Patient number<input name="patientNumber" required/></label><label>Full name<input name="fullName" required/></label><label>Mobile<input name="mobile" inputMode="tel"/></label><label>Sex<select name="sex" defaultValue="UNKNOWN"><option value="UNKNOWN">Not recorded</option><option value="M">Male</option><option value="F">Female</option><option value="OTHER">Other</option></select></label><button disabled={busy}>Create and select</button></form></details>
      </div></section>

      <section className="billing-panel cart-panel"><header><h2>Tests</h2><span>{cart.length} line{cart.length===1?"":"s"}</span></header><div className="panel-body">
        <div className="test-search"><input value={testSearch} onChange={event=>setTestSearch(event.target.value)} onKeyDown={event=>{if(event.key==="Enter"&&ctx.tests[0]){event.preventDefault();add(ctx.tests[0]);}}} placeholder="Search CBC, USG, X-Ray, code or group…" autoComplete="off"/><button type="button" disabled={!ctx.tests[0]} onClick={()=>ctx.tests[0]&&add(ctx.tests[0])}>Add test</button>{testSearch&&<div className="test-results">{ctx.tests.slice(0,18).map(test=><button type="button" key={test.id} onClick={()=>add(test)}><span><strong>{String(test.code)} — {String(test.name)}</strong><small>{String(test.group_name)}</small></span><b>{String(test.price)}</b></button>)}{!ctx.tests.length&&<p>No active priced test found.</p>}</div>}</div>
        <p className="keyboard-hint"><kbd>Enter</kbd> adds the first match. Duplicate tests require a repeat reason.</p>
        <div className="cart-table-wrap"><table className="cart-table"><thead><tr><th>Test</th><th>Group</th><th>Qty</th><th>Price</th><th></th></tr></thead><tbody>{cart.length===0?<tr><td colSpan={5} className="empty-cart">No tests in cart yet.</td></tr>:cart.map(line=><tr key={line.lineKey}><td><strong>{line.code}</strong><span>{line.name}</span>{line.repeatReason&&<small>Repeat: {line.repeatReason}</small>}</td><td>{line.groupName}</td><td><input aria-label={`Quantity ${line.name}`} type="number" min="1" max="99" value={line.quantity} onChange={event=>setCart(rows=>rows.map(row=>row.lineKey===line.lineKey?{...row,quantity:Math.max(1,Math.min(99,Number(event.target.value)||1))}:row))}/></td><td>{line.price}</td><td><button className="icon-button danger" type="button" aria-label={`Remove ${line.name}`} onClick={()=>setCart(rows=>rows.filter(row=>row.lineKey!==line.lineKey))}>×</button></td></tr>)}</tbody></table></div>
        <details className="held-bills"><summary>Held bills ({ctx.drafts.length})</summary>{ctx.drafts.length===0?<p className="muted">No held bills.</p>:ctx.drafts.map(draft=><div key={draft.id}><button type="button" onClick={()=>resume(draft)}>Resume {String(draft.operation_id).slice(-10)}</button><small>{new Date(String(draft.updated_at)).toLocaleString("en-BD")}</small><button className="link-danger" type="button" onClick={()=>void api({action:"cancelDraft",draftId:draft.id}).then(()=>refresh())}>Cancel</button></div>)}</details>
      </div></section>

      <section className="billing-panel payment-panel"><header><h2>Payment</h2></header><div className="panel-body">
        <div className="amount-row total"><span>Gross</span><strong>{formatMinor(totals.gross)}</strong></div>
        <label>Discount type<select value={discountType} onChange={event=>setDiscountType(event.target.value as typeof discountType)}><option value="NONE">No discount</option><option value="PERCENTAGE">Percentage</option><option value="FIXED_AMOUNT">Fixed amount</option></select></label>
        <label>{discountType==="PERCENTAGE"?"Discount %":"Discount amount"}<input value={discountValue} onChange={event=>setDiscountValue(event.target.value)} inputMode="decimal" disabled={discountType==="NONE"}/></label>
        <div className="amount-row"><span>Discount</span><strong>{formatMinor(totals.discount)}</strong></div><div className="amount-row net"><span>Net</span><strong>{formatMinor(totals.net)}</strong></div>
        <label>Paid now<input value={pay1} onChange={event=>setPay1(event.target.value)} inputMode="decimal" placeholder="0.00"/></label>
        <label>Payment mode<select value={method1} onChange={event=>setMethod1(event.target.value as PaymentMethod)}>{paymentMethods.map(method=><option key={method}>{method}</option>)}</select></label>
        <details className="split-payment"><summary>Split payment</summary><label>Second amount<input value={pay2} onChange={event=>setPay2(event.target.value)} inputMode="decimal" placeholder="0.00"/></label><label>Second mode<select value={method2} onChange={event=>setMethod2(event.target.value as PaymentMethod)}>{paymentMethods.map(method=><option key={method}>{method}</option>)}</select></label></details>
        <div className={`amount-row due ${totals.due<0?"invalid":""}`}><span>{totals.due<0?"Overpayment":"Due"}</span><strong>{formatMinor(Math.abs(totals.due))}</strong></div>
        <fieldset className="print-options"><legend>Cash memo format</legend>{(["A4","A5","POS80","POS58"] as PrintFormat[]).map(format=><label key={format}><input type="radio" name="printFormat" value={format} checked={printFormat===format} onChange={()=>setPrintFormat(format)}/>{format==="POS80"?"POS 80mm":format==="POS58"?"POS 58mm":format}</label>)}</fieldset>
        <button className="action hold" type="button" disabled={busy} onClick={hold}>Hold bill</button><button className="action clear" type="button" disabled={busy} onClick={clear}>Clear</button><button className="action save" type="button" disabled={busy} onClick={()=>void post(false)}>Save bill</button><button className="action save-print" type="button" disabled={busy} onClick={()=>void post(true)}>Save &amp; open print</button>
        {Boolean(result?.billId)&&<a className="receipt-link" target="_blank" href={receiptUrl(String(result?.billId))}>Open {printFormat} cash memo for {String(result?.billNumber)}</a>}
        <small className="operation-id">Operation: {op.slice(-12)}</small>
      </div></section>
    </div>

    <section className="card posted-bills"><h2>Posted bills and collections</h2><table><thead><tr><th>Bill</th><th>Patient</th><th>Net</th><th>Collected</th><th>Adjusted</th><th>Refunded</th><th></th></tr></thead><tbody>{bills.map(bill=><tr key={bill.id}><td>{String(bill.bill_number)}</td><td>{String(bill.patient_name_snapshot)}</td><td>{formatMinor(Number(bill.net_minor))}</td><td>{formatMinor(Number(bill.collected_minor))}</td><td>{formatMinor(Number(bill.adjusted_minor))}</td><td>{formatMinor(Number(bill.refunded_minor))}</td><td><button onClick={()=>detail(bill.id)}>Manage</button></td></tr>)}</tbody></table></section>
    {selected&&<BillManager data={selected} operate={operate}/>} 
  </main>;
}

function BillManager({data,operate}:{data:Record<string,unknown>;operate:(action:string,input:Record<string,unknown>)=>Promise<void>}) {
  const bill=data.bill as Row;const lines=data.lines as Row[];const collections=data.collections as Row[];const refunds=data.refunds as Row[];const[billOp,setBillOp]=useState(operation);
  return <section className="card"><h2>Manage {String(bill.bill_number)}</h2><p>Status {String(bill.status)} · original net {formatMinor(Number(bill.net_minor))}</p><div className="receipt-format-links"><a target="_blank" href={`/receipts/bill/${bill.id}?copy=DUPLICATE&format=A4`}>A4</a><a target="_blank" href={`/receipts/bill/${bill.id}?copy=DUPLICATE&format=A5`}>A5</a><a target="_blank" href={`/receipts/bill/${bill.id}?copy=DUPLICATE&format=POS80`}>POS 80mm</a><a target="_blank" href={`/receipts/bill/${bill.id}?copy=DUPLICATE&format=POS58`}>POS 58mm</a></div><h3>Lines</h3>{lines.map(line=><p key={line.id}>{String(line.test_name_snapshot)} net {formatMinor(Number(line.net_minor))} cancelled {formatMinor(Number(line.cancelled_minor))} <button onClick={()=>operate("cancelBill",{operationId:operation(),billId:bill.id,lineIds:[line.id],reason:"Counter-authorized line cancellation"})}>Cancel remaining line</button></p>)}<button onClick={()=>operate("cancelBill",{operationId:operation(),billId:bill.id,reason:"Counter-authorized whole bill cancellation"})}>Cancel whole remaining bill</button>
    <h3>Due collection</h3><form action={form=>operate("collectDue",{operationId:operation(),billId:bill.id,amount:String(form.get("amount")),method:String(form.get("method")),reference:String(form.get("reference")??"")})} className="grid"><label>Amount<input name="amount" required/></label><label>Method<select name="method">{paymentMethods.map(method=><option key={method}>{method}</option>)}</select></label><label>Reference<input name="reference"/></label><button>Collect due</button></form><ul>{collections.map(collection=><li key={collection.id}>{String(collection.collection_number)} {formatMinor(Number(collection.amount_minor))} {String(collection.payment_method)} <a target="_blank" href={`/receipts/collection/${collection.id}?copy=PATIENT&format=POS80`}>receipt</a></li>)}</ul>
    <h3>Refund</h3><form action={form=>operate("refundRequest",{operationId:billOp,billId:bill.id,amount:String(form.get("amount")),reason:String(form.get("reason"))}).then(()=>setBillOp(operation()))} className="grid"><label>Amount<input name="amount" required/></label><label>Reason<input name="reason" required/></label><button>Request refund</button></form>{refunds.map(refund=><div key={refund.id}><p>{String(refund.status)} {formatMinor(Number(refund.amount_minor))} — {String(refund.reason)}</p>{refund.status==="REQUESTED"&&<button onClick={()=>operate("refundDecision",{operationId:operation(),refundId:refund.id,approve:true,reason:"Checked"})}>Approve</button>}{refund.status==="APPROVED"&&<button onClick={()=>operate("refundPayout",{operationId:operation(),refundId:refund.id,method:"CASH",reference:`PAYOUT-${Date.now()}`})}>Record cash payout</button>}{refund.status==="PAID"&&<a target="_blank" href={`/receipts/refund/${refund.id}?copy=PATIENT&format=POS80`}>refund receipt</a>}</div>)}</section>;
}
