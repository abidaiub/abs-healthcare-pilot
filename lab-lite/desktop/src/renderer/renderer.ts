export {};

declare global {
  interface Window {
    labLite: Record<string, (value?: unknown) => Promise<{ ok: boolean; data?: any; error?: string }>>;
  }
}

type SelectedTest = { quantity: number; repeatReason?: string };
type DraftPayload = Record<string, unknown> & { testIds?: Array<[string, SelectedTest]> };

const root = document.querySelector<HTMLDivElement>("#app")!;
let appState: any = null;
let ctx: any = null;
let message = "";
let activeOperationId = "";
let selectedTests = new Map<string, SelectedTest>();

async function call(name: string, value?: unknown) {
  const result = await window.labLite[name](value);
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

function esc(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function formObject(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}

function newOperationId() {
  return `${appState.deviceId}_${crypto.randomUUID()}`;
}

function setMessage(value: string) {
  message = value;
  render();
}

async function load() {
  try {
    const result = await window.labLite.state();
    if (!result.ok && result.error?.includes("not activated")) appState = { activated: false };
    else if (!result.ok) throw new Error(result.error);
    else appState = result.data;
    if (appState.activated && appState.loggedIn) ctx = await call("context");
    render();
  } catch (error) {
    root.innerHTML = `<main class="login card"><h1>ABS Lab Lite</h1><p class="bad">${esc(error instanceof Error ? error.message : error)}</p></main>`;
  }
}

function render() {
  if (!appState?.activated) return renderActivation();
  if (!appState.loggedIn) return renderLogin();
  renderDashboard();
}

function renderActivation() {
  root.innerHTML = `<main class="login card"><h1>Activate ABS Lab Lite</h1><p>This one-time online step binds the encrypted local database to one tenant branch and this Windows installation.</p>${message ? `<p class="message">${esc(message)}</p>` : ""}<form id="activate" class="grid"><label>Cloud URL<input name="cloudUrl" value="http://127.0.0.1:3100" required></label><label>Activation code<input name="activationCode" required></label><label>Device name<input name="deviceName" value="Front Counter" required></label><label>Username<input name="username" required></label><label>Password<input name="password" type="password" required></label><button>Activate and provision offline login</button></form><p class="muted">No cloud password hash or cloud session-signing secret is copied to this device.</p></main>`;
  document.querySelector<HTMLFormElement>("#activate")!.onsubmit = async (event) => {
    event.preventDefault();
    try {
      message = "Activating…";
      render();
      await call("activate", formObject(event.currentTarget as HTMLFormElement));
      message = "Activation complete. You can disconnect and sign in.";
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Activation failed");
    }
  };
}

function renderLogin() {
  root.innerHTML = `<main class="login card"><h1>ABS Lab Lite</h1><h2>${esc(appState.tenantName)} · ${esc(appState.branchName)}</h2><p>Offline sign-in</p>${message ? `<p class="message">${esc(message)}</p>` : ""}<form id="login" class="grid"><label>Username<input name="username" required autofocus></label><label>Password<input name="password" type="password" required></label><button>Sign in</button></form><p class="muted">A valid, device-bound authorization lease is required. Five failed attempts temporarily lock offline login.</p></main>`;
  document.querySelector<HTMLFormElement>("#login")!.onsubmit = async (event) => {
    event.preventDefault();
    try {
      await call("login", formObject(event.currentTarget as HTMLFormElement));
      message = "Offline login successful.";
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed");
    }
  };
}

function renderDashboard() {
  if (!activeOperationId) activeOperationId = newOperationId();
  const tests = ctx?.tests ?? [];
  const patients = ctx?.patients ?? [];
  const bills = ctx?.bills ?? [];
  root.innerHTML = `<header><h1>ABS Lab Lite · Installed Client</h1><span>${esc(appState.user)}</span><button id="logout" class="secondary">Sign out</button></header><main>${message ? `<p class="message">${esc(message)}</p>` : ""}
  <section class="status-grid"><div class="status"><b>Network</b><br><span id="network">${navigator.onLine ? "Available" : "Unavailable"}</span></div><div class="status"><b>Cloud API</b><br>${esc(appState.lastSuccessfulSync ? "Last reached" : "Not confirmed")}</div><div class="status"><b>Device</b><br>Activated locally</div><div class="status ${appState.pending ? "warn" : "ok"}"><b>Pending sync</b><br>${appState.pending}</div><div class="status ${appState.conflicted ? "bad" : "ok"}"><b>Conflicted</b><br>${appState.conflicted}</div></section>
  <section class="card"><div class="actions"><button id="sync">Synchronize now</button><button id="backup" class="secondary">Encrypted backup</button><button id="restore" class="secondary">Restore verified backup</button><button id="report" class="secondary">Local report</button></div><p>Last successful sync: ${esc(appState.lastSuccessfulSync ?? "Never")}</p><p class="muted">Restore validates device scope and encryption, creates a safety backup, signs out, and requires reconciliation after reopening. Network availability, cloud reachability, device authorization, and synchronization health are separate states.</p></section>
  <section class="card"><h2>Offline new bill</h2><form id="bill"><div class="grid"><label>Existing patient<select name="patientId"><option value="">Quick-create with this bill</option>${patients.map((patient: any) => `<option value="${esc(patient.id)}">${esc(patient.patient_number)} — ${esc(patient.full_name)}</option>`).join("")}</select></label><label>New patient number<input name="newPatientNumber"></label><label>New patient name<input name="newPatientName"></label><label>Mobile<input name="newPatientMobile"></label><label>Expected delivery<input type="datetime-local" name="expectedDeliveryAt"></label><label>Discount type<select name="discountType"><option>NONE</option><option>PERCENTAGE</option><option>FIXED_AMOUNT</option></select></label><label>Discount value<input name="discountValue" value="0"></label><label>Initial payment<input name="payment" inputmode="decimal"></label><label>Method<select name="method"><option>CASH</option><option>BKASH</option><option>NAGAD</option><option>CARD</option><option>BANK</option></select></label></div><h3>Authorized tests and prices</h3><div class="test-list">${tests.map((test: any) => `<label class="test-item"><input type="checkbox" data-test="${esc(test.id)}"> <span>${esc(test.code)} — ${esc(test.name)} · ${(Number(test.price_minor) / 100).toFixed(2)}</span><input type="number" min="1" max="99" value="1" data-qty="${esc(test.id)}" aria-label="Quantity ${esc(test.name)}"></label>`).join("")}</div><p>Operation identity: <code id="operation">${esc(activeOperationId)}</code></p><div class="actions"><button>Post locally</button><button type="button" id="hold" class="secondary">Hold draft</button></div></form></section>
  <section class="card"><h2>Held drafts</h2>${(ctx?.drafts ?? []).map((draft: any) => `<p><button class="resume" data-id="${esc(draft.id)}">Resume ${esc(draft.operation_id)}</button> <button class="delete-draft danger" data-id="${esc(draft.id)}">Cancel draft</button></p>`).join("") || "<p>None</p>"}</section>
  <section class="card"><h2>Local bills</h2><table><thead><tr><th>Receipt</th><th>Patient</th><th>Net</th><th>Cloud</th><th>Balance</th><th>Actions</th></tr></thead><tbody>${bills.map((bill: any) => `<tr><td>${esc(bill.local_receipt_number)}</td><td>${esc(bill.patient_name_snapshot)}</td><td>${(Number(bill.net_minor) / 100).toFixed(2)}</td><td>${esc(bill.cloud_bill_number ?? bill.sync_status)}</td><td>${bill.cloud_balance_minor == null ? `Local ${(Number(bill.net_minor) / 100).toFixed(2)}` : (Number(bill.cloud_balance_minor) / 100).toFixed(2)}</td><td><button class="receipt" data-id="${esc(bill.id)}">Receipt</button> <button class="refund-request" data-id="${esc(bill.id)}">Refund request</button> <button class="cancel-request" data-id="${esc(bill.id)}">Cancellation request</button>${bill.cloud_bill_id ? ` <button class="due" data-operation="${esc(bill.operation_id)}">Online due</button>` : ""}</td></tr>`).join("")}</tbody></table></section></main>`;
  wireDashboard();
  applySelectedTests();
}

function applySelectedTests() {
  document.querySelectorAll<HTMLInputElement>("[data-test]").forEach((box) => {
    const selected = selectedTests.get(box.dataset.test!);
    box.checked = Boolean(selected);
    if (selected) document.querySelector<HTMLInputElement>(`[data-qty='${box.dataset.test}']`)!.value = String(selected.quantity);
  });
}

function restoreDraft(draft: any) {
  let payload: DraftPayload;
  try {
    payload = JSON.parse(String(draft.payload_json)) as DraftPayload;
  } catch {
    setMessage("The held draft payload is unreadable.");
    return;
  }
  activeOperationId = String(draft.operation_id);
  selectedTests = new Map(Array.isArray(payload.testIds) ? payload.testIds : []);
  message = `Draft ${activeOperationId} resumed. Review it before posting.`;
  renderDashboard();
  const form = document.querySelector<HTMLFormElement>("#bill")!;
  for (const [name, value] of Object.entries(payload)) {
    if (name === "testIds" || value == null) continue;
    const field = form.elements.namedItem(name);
    if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) field.value = String(value);
  }
  applySelectedTests();
}

async function captureAdjustmentRequest(billId: string, type: "REQUEST_REFUND" | "REQUEST_CANCELLATION") {
  const reason = prompt(type === "REQUEST_REFUND" ? "Refund reason" : "Cancellation reason");
  if (!reason?.trim()) return;
  const amount = type === "REQUEST_REFUND" ? prompt("Requested refund amount") : undefined;
  if (type === "REQUEST_REFUND" && !amount) return;
  try {
    await call("captureRequest", { operationId: newOperationId(), billId, type, amount, reason });
    message = `${type === "REQUEST_REFUND" ? "Refund" : "Cancellation"} request captured for online review; no approval or financial reversal occurred.`;
    await load();
  } catch (error) {
    setMessage(error instanceof Error ? error.message : "Request failed");
  }
}

function wireDashboard() {
  document.querySelector("#logout")!.addEventListener("click", async () => { await call("logout"); message = ""; activeOperationId = ""; selectedTests.clear(); await load(); });
  document.querySelector("#sync")!.addEventListener("click", async () => {
    try { setMessage("Synchronizing…"); await call("sync"); message = "Synchronization completed."; await load(); }
    catch (error) { setMessage(`Cloud not reachable or sync rejected: ${error instanceof Error ? error.message : error}`); }
  });
  document.querySelector("#backup")!.addEventListener("click", async () => {
    try { const result = await call("backup"); setMessage(result ? `Encrypted backup created. SHA-256 ${result.sha256}` : "Backup cancelled."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Backup failed"); }
  });
  document.querySelector("#restore")!.addEventListener("click", async () => {
    try { const result = await call("restoreBackup"); message = result ? `Restore completed. Safety backup SHA-256 ${result.safetySha256}. Sign in, reconnect, and reconcile before posting.` : "Restore cancelled."; await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Restore failed"); }
  });
  document.querySelector("#report")!.addEventListener("click", async () => {
    const date = new Date().toISOString().slice(0, 10);
    try { const report = await call("report", { date }); setMessage(`${report.coverage}; business date ${report.businessDate} (${report.timezone}); bills ${(report.billValueMinor / 100).toFixed(2)}; initial collections ${(report.initialCollectionsMinor / 100).toFixed(2)}; pending ${report.pending}; cloud-only collections/refunds are NOT included.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Report failed"); }
  });
  const billForm = document.querySelector<HTMLFormElement>("#bill")!;
  document.querySelectorAll<HTMLInputElement>("[data-test]").forEach((box) => {
    box.onchange = () => {
      const id = box.dataset.test!;
      if (box.checked) selectedTests.set(id, { quantity: Number(document.querySelector<HTMLInputElement>(`[data-qty='${id}']`)!.value) });
      else selectedTests.delete(id);
    };
  });
  document.querySelectorAll<HTMLInputElement>("[data-qty]").forEach((quantity) => {
    quantity.onchange = () => {
      const id = quantity.dataset.qty!;
      if (selectedTests.has(id)) selectedTests.set(id, { ...selectedTests.get(id), quantity: Number(quantity.value) } as SelectedTest);
    };
  });
  billForm.onsubmit = async (event) => {
    event.preventDefault();
    const values = formObject(billForm);
    const newName = String(values.newPatientName ?? "").trim();
    try {
      const result = await call("postBill", { operationId: activeOperationId, patientId: values.patientId || undefined, newPatient: newName ? { id: crypto.randomUUID(), patientNumber: values.newPatientNumber, fullName: newName, mobile: values.newPatientMobile } : undefined, expectedDeliveryAt: values.expectedDeliveryAt || undefined, lines: [...selectedTests].map(([testId, item]) => ({ testId, lineKey: crypto.randomUUID(), quantity: item.quantity })), discountType: values.discountType, discountValue: values.discountValue, payments: values.payment ? [{ amount: values.payment, method: values.method }] : [] });
      selectedTests.clear();
      activeOperationId = "";
      message = `Saved locally as ${result.localReceiptNumber}; due ${(result.dueMinor / 100).toFixed(2)}. Printing can be retried without reposting.`;
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Bill failed"); }
  };
  document.querySelector("#hold")!.addEventListener("click", async () => {
    try { await call("saveDraft", { operationId: activeOperationId, payload: { ...formObject(billForm), testIds: [...selectedTests] } }); message = "Draft held in encrypted local storage."; activeOperationId = ""; selectedTests.clear(); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Draft failed"); }
  });
  document.querySelectorAll<HTMLButtonElement>(".delete-draft").forEach((button) => { button.onclick = async () => { await call("deleteDraft", { id: button.dataset.id }); await load(); }; });
  document.querySelectorAll<HTMLButtonElement>(".resume").forEach((button) => { button.onclick = () => { const draft = (ctx.drafts as any[]).find((row) => row.id === button.dataset.id); if (draft) restoreDraft(draft); }; });
  document.querySelectorAll<HTMLButtonElement>(".receipt").forEach((button) => { button.onclick = async () => { try { await call("receipt", { billId: button.dataset.id, format: "A5", copy: "PATIENT" }); } catch (error) { setMessage(error instanceof Error ? error.message : "Receipt failed"); } }; });
  document.querySelectorAll<HTMLButtonElement>(".refund-request").forEach((button) => { button.onclick = () => void captureAdjustmentRequest(button.dataset.id!, "REQUEST_REFUND"); });
  document.querySelectorAll<HTMLButtonElement>(".cancel-request").forEach((button) => { button.onclick = () => void captureAdjustmentRequest(button.dataset.id!, "REQUEST_CANCELLATION"); });
  document.querySelectorAll<HTMLButtonElement>(".due").forEach((button) => {
    button.onclick = async () => {
      const amount = prompt("Online due collection amount");
      if (!amount) return;
      try { await call("collectDue", { billOperationId: button.dataset.operation, operationId: newOperationId(), amount, method: "CASH" }); message = "Cloud confirmed the due collection."; await load(); }
      catch (error) { setMessage(`Unknown or failed online outcome: ${error instanceof Error ? error.message : error}. Retry with the same operation identity through support reconciliation.`); }
    };
  });
}

void load();
