# ABSHealthcareLite Training Video Package — Production Plan

**Tenant demo context:** Doctors Point Diagnostic Center (`DPDC`)  
**Package status:** **HOLD — UAT EVIDENCE INCOMPLETE**  
**Date:** 26 July 2026  
**Authority rule:** Scripts and narration may only describe browser-tested UI. Untested steps must not be presented as production-ready features.

---

## 0. Case completion confirmation (mandatory gate)

| Source required by brief | Present in repo? | Status |
|--------------------------|------------------|--------|
| Final DPDC Phase 1 readiness report | Yes — `docs/Manual-QC/DPDC-Phase1-Readiness-Report.md` | **PASS for readiness only** (ranges + section routing). Explicit next action: *begin* Case 1. |
| Patient Case 1 UAT report | **No** | **NOT TESTED** |
| Patient Case 2 UAT report | **No** | **NOT TESTED** |
| Patient Case 3 UAT report | **No** | **NOT TESTED** |
| Final MOD-01–MOD-24 E2E Manual QC report (executed results) | **No** — guide exists; result sheet empty | **NOT TESTED** |
| Final UAT screenshots for Cases 1–3 | **No** — evidence folder placeholder only | **MISSING** |
| Product Book / Module docs / routes | Partial (module docs + routes exist) | Usable for *planned* outline only |

### Sign-off from Manual QC guide (`02-Manual-QC-UAT-Guide.md`)

| Gate | Documented status |
|------|-------------------|
| Case 1 Manual QC | **NOT TESTED** |
| Case 2 Manual QC | **NOT TESTED** |
| Case 3 Manual QC | **NOT TESTED** |
| Security-negative | **NOT TESTED** |
| Production approval | **NOT APPROVED** |

### Verdict

**All three patient cases are incomplete.** Automated seed/verify and Phase 1 readiness are not a substitute for browser Manual QC.

| Decision | Value |
|----------|--------|
| May write final BN/EN narration now? | **NO** |
| May claim “final browser-tested workflow” in videos? | **NO** |
| May publish production training videos? | **NO** until Cases 1–3 Manual QC PASS + evidence attached |
| What is allowed now? | Production plan, chapter outline, role-wise list, UAT evidence mapping (this document) |

Planned chapter/scene content below is a **recording blueprint** derived from the UAT *guide* and seeded routes — every scene remains **PENDING EVIDENCE** until a Case UAT report marks that step PASS.

---

## 1. Video production plan

### 1.1 Objectives

1. Train Doctors Point staff on the ABSHealthcareLite diagnostic-center path from registration through report and follow-up.
2. Deliver one long E2E tutorial plus short role-wise clips.
3. Use only fictional UAT data; never expose real credentials, phones, tokens, or PHI beyond what the demo UI must show (mask mobiles/passwords on camera).

### 1.2 Package inventory (target deliverables)

| # | File | Status now |
|---|------|------------|
| 00 | `00-Video-Production-Plan.md` | **THIS FILE — ACTIVE** |
| 01 | `01-Full-E2E-Tutorial-BN.md` | **BLOCKED** — no narration until evidence mapping closed |
| 02 | `02-Full-E2E-Tutorial-EN.md` | **BLOCKED** |
| 03–10 | Role tutorials | **BLOCKED** |
| 11 | `11-Recording-Shot-List.md` | **BLOCKED** (draft shot intent lives in §2–§3) |
| 12 | `12-Voiceover-and-Caption-Sheet.md` | **BLOCKED** |
| 13 | `13-Video-QC-Checklist.md` | Skeleton allowed after evidence plan; full QC after recording |

### 1.3 Production phases

| Phase | Work | Exit criteria |
|-------|------|---------------|
| P0 | Evidence mapping (this doc) | Mapping reviewed; missing reports listed |
| P1 | Execute browser Manual QC Cases 1–3 per `02-Manual-QC-UAT-Guide.md` | Case reports + screenshots under `docs/AI-QC/manual-qc/evidence/dpdc-e2e/` |
| P2 | Close evidence mapping (mark each scene PASS/FAIL/N/A) | Only PASS scenes eligible for narration |
| P3 | Write BN/EN narration + scene tables for eligible scenes | Scripts cite Case report IDs + screenshot filenames |
| P4 | Record / edit / captions | Follow recording quality guide (§1.6) |
| P5 | Video QC checklist | All QC items PASS; no untested claims |

### 1.4 Demo environment (for recording — after UAT)

| Item | Value |
|------|--------|
| App URL | `http://localhost:3000` (or approved UAT URL) |
| Tenant code (on-screen) | `DPDC` |
| Branch (on-screen) | Doctors Point Diagnostic Center – Bhola Main Branch |
| Locale | Prefer `bn-BD` for Bangla video; `en-BD` for English cut |
| Seed | `npm run seed:uat:doctors-point` before reset takes |
| Staff username (visible) | e.g. `dp.reception` |
| Staff password (on camera) | Always `********` — never type visible password |
| Portal username (visible) | Masked mobile pattern only if UI requires it; prefer “demo portal user” caption |
| Host admin | Do **not** use for clinical transactions in training |

### 1.5 Case usage in the package (only after each Case report PASS)

| Case | Planned training purpose | Include only if UAT proves |
|------|--------------------------|----------------------------|
| Case 1 — Md. Rahim Uddin | Partial payment, abnormal flag, release, portal, follow-up | Steps 1–20 for Case 1 PASS |
| Case 2 — Jannatul Ferdous | Full payment, insufficient sample, reject/recollect, abnormal, final report | Rejection path PASS; Ferritin **omitted** (catalog gap) |
| Case 3 — Master Samiul | Guardian portal, billing hold, LIS quarantine, critical ack, release after clear | Delegation + hold + LIS + critical PASS |

### 1.6 Recording quality guide (binding for later shoots)

| Item | Recommendation |
|------|----------------|
| Resolution | 1920×1080 |
| Browser zoom | 100% (125% only if UI text illegible; keep consistent) |
| Frame rate | 30 fps (24 fps acceptable if editing standard) |
| Cursor | System cursor visible; slow deliberate clicks |
| Audio | Quiet room; 48 kHz; no music under clinical narration |
| Notifications | Mute OS/browser popups; use in-app notification demo only if UAT-proven |
| Dead time | Cut load waits >2s; keep one short “system processing” beat where status changes |
| Sensitive data | Mask passwords; blur/mask phone fields if full number appears; no `.env`, Network tab, or DB IDs |
| Captions | Lower-third safe zone; BN primary for BN video; EN for EN video |
| Intro/outro | ABSHealthcareLite logo 3–5s; tenant name as demo site; “Training / UAT data” slate |
| Chapter cards | Dark slate with chapter title; 2–3s |
| Test data reset | Re-seed or use clean invoice/order numbers between takes; do not show failed half-states as success |

### 1.7 Safety / compliance rules for scripts

- Do not invent screens, buttons, fields, or statuses.
- Exact UI labels must be captured from screenshots after UAT (locale-specific).
- Permission boundaries: call out SoD (entry ≠ verify ≠ release; cash ≠ discount approve).
- Never show an unverified result as a released report.
- Never show a rejected sample as valid for release.
- Portal must not show another patient’s report.
- Financial on-screen: always reconcile `Gross − Discount = Net` and `Net − Paid = Due`.

---

## 2. Full E2E tutorial — chapter outline

**Working title:** ABSHealthcareLite: Patient Registration to Diagnostic Report and Doctor Follow-up  
**Target duration:** 25–40 minutes (after evidence; may shorten if chapters cut for NOT TESTED)  
**Primary spine:** Case 1 (longest continuous happy path)  
**Inserts:** Case 2 rejection/recollect; Case 3 guardian / hold / LIS / critical  

| Ch | Title (EN) | Planned content | Primary roles | Candidate routes (from app/nav + UAT guide) | Evidence status |
|----|------------|-----------------|---------------|---------------------------------------------|-----------------|
| 00 | Intro & demo disclaimer | Product purpose; UAT/fictional data; DPDC + Bhola branch | — | `/login` | Phase 1 only |
| 01 | Tenant & branch | Tenant code login; branch context | Reception / Tenant Admin | `/login` → `/dashboard` | PENDING Case UAT |
| 02 | Staff roles overview | Separation of duties (reception, doctor, billing, lab, verify, release) | Admin (optional) | `/settings/users`, `/settings/roles` | PENDING |
| 03 | Patient registration | Find or confirm Case 1 patient | Reception | `/patients`, `/patients/new` | PENDING |
| 04 | Appointment & queue | Book with published schedule; token; check-in | Reception | `/appointments/new`, `/appointments`, `/appointments/queue` | PENDING |
| 05 | Doctor consultation | Open worklist; start consult; clinical notes | Doctor | `/doctor/worklist`, `/consultations/*` | PENDING |
| 06 | Prescription & investigations | Advise Case 1 tests (FBS, HbA1c, Creatinine, Urine R/E) | Doctor | `/prescriptions/*`, investigation advice UI | PENDING |
| 07 | Lab order | Create/confirm order from advice | Lab / Reception path per UAT | `/lab/orders`, `/lab/orders/new` | PENDING |
| 08 | Billing & discount | Invoice from order; 10% discount authorized user | Billing | `/diagnostic/billing`, `/diagnostic/billing/[invoiceId]` | PENDING |
| 09 | Partial payment & cash memo | ৳1,000 partial; due remains; print memo | Cash | invoice payment + `/diagnostic/billing/[invoiceId]/receipt` | PENDING |
| 10 | Labels & sample collection | Barcode + QR labels; collect | Collection | `/lab/collection`, `/lab/samples/[sampleId]/label`, `/lab/label-print` | PENDING |
| 11 | Sample routing / receipt | Section departments (Biochem / ClinPath) | Collection / Lab | `/lab/receipt`, `/lab/processing` | PENDING |
| 12 | Result entry / LIS import | Enter or import; show abnormal where proven | Lab tech / LIS | `/lab/lis-worklist`, `/lab/result-entry` | PENDING |
| 13 | *(Insert)* Rejection & recollection | Case 2 insufficient sample | Collection / Lab | `/lab/receipt` | PENDING Case 2 |
| 14 | Abnormal / critical handling | Case 1 abnormal; Case 3 critical ack | Lab / Verifier | result entry + critical acknowledge | PENDING |
| 15 | Verification | Pathologist/verifier only | Verify doctor | `/lab/verification` | PENDING |
| 16 | Release eligibility | Billing/sample blockers if proven | Delivery / Hold officer | `/lab/report-release` | PENDING |
| 17 | Release + QR report | Authorize release; print/PDF + verify QR | Delivery | `/lab/report-release/[releaseId]/print`, `/verify/report/[token]` | PENDING |
| 18 | Portal & notification | Patient sees released report; report-ready notify if proven | Portal / system | `/portal/login`, `/portal/reports` | PENDING |
| 19 | *(Insert)* Guardian portal | Case 3 delegation only | Guardian portal | `/portal/login` | PENDING Case 3 |
| 20 | Follow-up & Rx history | Follow-up consult; prescription version history | Doctor | consultation + `/prescriptions/[id]/history` | PENDING |
| 21 | Close | Recap roles; do not skip verification/release rules | — | — | — |

**Hard exclusions until proven**

- Serum Ferritin (catalog gap — never invent).
- Live SMS gateway (console/test provider only unless UAT proves configured HTTP).
- Branch-/method-specific reference ranges (not in schema).
- Any status label not captured in a Case screenshot.

---

## 3. Role-wise video list

| # | Target file | Role | Target duration | Primary routes | Cases used | Status |
|---|-------------|------|-----------------|----------------|------------|--------|
| 03 | `03-Reception-Tutorial.md` | Reception (`dp.reception`) | 3–8 min | `/patients*`, `/appointments*`, queue | Case 1 (+ mention Case 2/3 registration) | BLOCKED |
| 04 | `04-Doctor-Tutorial.md` | Doctor (Farhana / Kamrul linked users) | 3–8 min | `/doctor/worklist`, `/consultations*`, `/prescriptions*` | Case 1 consult + follow-up; Case 2 thyroid path | BLOCKED |
| 05 | `05-Billing-Cash-Tutorial.md` | Billing + Cash (`dp.billing`, `dp.cash`) | 3–8 min | `/diagnostic/billing*` | Case 1 partial; Case 2 full; Case 3 partial/hold if proven | BLOCKED |
| 06 | `06-Sample-Collection-Tutorial.md` | Sample Collection (`dp.collection`) | 3–8 min | `/lab/collection`, labels, `/lab/receipt` | Case 1 collect; Case 2 reject/recollect | BLOCKED |
| 07 | `07-Laboratory-LIS-Tutorial.md` | Lab tech + LIS reconcile | 3–8 min | `/lab/lis-worklist`, `/lab/result-entry`, sections | Case 1 results; Case 3 LIS faults | BLOCKED |
| 08 | `08-Verification-Release-Tutorial.md` | Verify doctor + Report delivery | 3–8 min | `/lab/verification`, `/lab/report-release*` | All cases release rules | BLOCKED |
| 09 | `09-Patient-Portal-Tutorial.md` | Patient + Guardian portal | 3–8 min | `/portal/login`, `/portal/reports` | Case 1 patient; Case 3 guardian delegation | BLOCKED |
| 10 | `10-Administration-Tutorial.md` | Tenant/Branch Admin | 3–8 min | `/settings/users`, roles, schedules, patient-portal, services | Seeded schedules/portal admin | BLOCKED |

**Combined short-tutorial map into full E2E:** Reception→Doctor→Billing→Collection→Lab/LIS→Verify/Release→Portal; Admin as optional preface.

---

## 4. Required UAT evidence mapping

Legend: **MISSING** = no Case UAT report/screenshot yet · **READY(seed)** = automated/seed only · **N/A** = out of scope/gap

### 4.1 Evidence artifacts required before narration

| Artifact | Expected path / name | Status |
|----------|----------------------|--------|
| Case 1 Manual QC result report | e.g. `docs/Manual-QC/DPDC-Case1-UAT-Report.md` | **MISSING** |
| Case 2 Manual QC result report | e.g. `docs/Manual-QC/DPDC-Case2-UAT-Report.md` | **MISSING** |
| Case 3 Manual QC result report | e.g. `docs/Manual-QC/DPDC-Case3-UAT-Report.md` | **MISSING** |
| Final E2E Manual QC rollup MOD-01–24 | e.g. `docs/Manual-QC/DPDC-MOD01-24-E2E-Manual-QC-Report.md` | **MISSING** |
| Screenshot set Case 1 | `docs/AI-QC/manual-qc/evidence/dpdc-e2e/case-1/` | **MISSING** |
| Screenshot set Case 2 | `docs/AI-QC/manual-qc/evidence/dpdc-e2e/case-2/` | **MISSING** |
| Screenshot set Case 3 | `docs/AI-QC/manual-qc/evidence/dpdc-e2e/case-3/` | **MISSING** |
| Security-negative pack | same evidence tree `security/` | **MISSING** |
| Phase 1 readiness | `docs/Manual-QC/DPDC-Phase1-Readiness-Report.md` | Available (pre-Case only) |
| UAT guide (planned steps) | `docs/E2E-Diagnostic-Workflow/02-Manual-QC-UAT-Guide.md` | Available (NOT TESTED) |
| Range / section Option A | `docs/E2E-Diagnostic-Workflow/04-DPDC-Reference-Ranges-and-Section-Routing.md` | Available (seed/verify) |

### 4.2 Scene ↔ evidence matrix (Full E2E)

| Scene / topic | Case | Guide step | Required evidence | Video eligibility |
|---------------|------|------------|-------------------|-------------------|
| Tenant/branch intro | — | 1 | Screenshot dashboard with tenant/branch | PENDING |
| Role overview / SoD | — | users/roles | Screenshot role permissions or denied action | PENDING |
| Patient registration | 1 | 3 | Patient detail `DP-000001` | PENDING |
| Appointment + queue token | 1 | 4 | Appointment booked + queue check-in | PENDING |
| Consultation | 1 | 5 | Encounter notes | PENDING |
| Investigations advised | 1 | 5–6 | FBS, HbA1c, Creatinine, Urine R/E only | PENDING |
| Lab order | 1 | 6 | Order number | PENDING |
| Billing + 10% discount | 1 | 7–8 | Invoice math + discount reason | PENDING |
| Partial payment ৳1,000 + cash memo | 1 | 9 | Due > 0; memo print | PENDING |
| Barcode/QR label | 1 | 10 | Label screen | PENDING |
| Sample collection | 1 | 10 | Collected status | PENDING |
| Sample routing / receipt | 1 | 11 | Section / received | PENDING |
| Result + abnormal | 1 | 12–13 | Flag visible (e.g. FBS HIGH if entered) | PENDING |
| Verification | 1 | 14 | Verified by authorized role | PENDING |
| Release + QR | 1 | 15–16 | Released + QR | PENDING |
| Portal + notification | 1 | 17–18 | Portal list + outbox/console notify proof | PENDING |
| Follow-up + Rx history | 1 | 19 | Version history | PENDING |
| Full payment | 2 | 9 | Due = 0 | PENDING |
| Insufficient sample reject | 2 | 11 | Reject reason | PENDING |
| Recollection | 2 | 11 | New collection / block until done | PENDING |
| Case 2 abnormal + final report | 2 | 13–16 | Flags + released report | PENDING |
| No Ferritin | 2 | gap | Confirm Ferritin absent — do not demo | N/A (gap) |
| Guardian registration / portal | 3 | 3, 18 | Guardian + delegation | PENDING |
| Partial pay + billing hold | 3 | 9, 15 | Hold blocks release | PENDING |
| LIS unknown/duplicate/wrong barcode | 3 | 12 | Quarantine + reconcile | PENDING |
| Critical acknowledgement | 3 | 13 | Ack before release | PENDING |
| Release after blockers clear | 3 | 15–16 | Hold cleared then release | PENDING |
| Portal isolation (other patient) | all | N1–N2 | Denied / not listed | PENDING |
| Audit trail | all | 20 | Discount/payment/verify/release events | PENDING |

### 4.3 Role video ↔ evidence dependency

| Role video | Must have PASS evidence for |
|------------|-----------------------------|
| Reception | Case 1 steps 3–4 (and schedule visibility) |
| Doctor | Case 1 steps 5–6, 19 |
| Billing/Cash | Case 1 steps 7–9; Case 2 full pay; Case 3 hold if claimed |
| Sample Collection | Case 1 step 10; Case 2 step 11 |
| Laboratory/LIS | Case 1 steps 12–13; Case 3 LIS faults |
| Verification/Release | Cases 1–3 steps 14–17 as claimed |
| Portal | Case 1 step 18; Case 3 guardian; N1/N2 |
| Administration | Schedules published; portal admin; users/roles without clinical overreach |

### 4.4 Closure checklist for evidence mapping

Mark **CLOSED** only when:

- [ ] Case 1 UAT report filed with PASS/FAIL per step + screenshots  
- [ ] Case 2 UAT report filed (incl. reject/recollect; Ferritin omitted)  
- [ ] Case 3 UAT report filed (guardian, hold, LIS, critical)  
- [ ] Security-negative N1–N6 recorded  
- [ ] Final MOD-01–24 E2E Manual QC rollup filed  
- [ ] This matrix updated: each scene → PASS / FAIL / CUT  
- [ ] Failed/blocked scenes removed from narration scope  

**Current closure state:** **OPEN — BLOCKED**

---

## 5. Next actions (ordered)

1. Run browser Manual QC for Case 1 using `02-Manual-QC-UAT-Guide.md`; file Case 1 UAT report + screenshots.  
2. Repeat for Case 2 and Case 3.  
3. File security-negative and E2E rollup.  
4. Return here: update §4 matrix to PASS/FAIL/CUT.  
5. Only then authorize writing `01`/`02` narration and role scripts `03`–`10`, shot list, voiceover sheet, and video QC checklist.

---

## 6. Document control

| Version | Date | Authoring note |
|---------|------|----------------|
| 0.1 | 2026-07-26 | Plan + outline + role list + evidence mapping only. Final narration withheld by evidence gate. |
