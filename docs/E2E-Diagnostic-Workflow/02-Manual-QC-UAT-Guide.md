# Doctors Point Diagnostic Center — Manual QC / UAT Guide

**Document:** `02-Manual-QC-UAT-Guide.md`  
**Status:** NOT TESTED — guide ready for independent QC engineer  
**Workflow status:** AI COMPLETE — MANUAL QC PENDING  
**Date:** 26 July 2026

---

## 1. Environment

| Item | Value |
|------|-------|
| Application | ABSHealthcareLite Pilot |
| Tenant code | `DPDC` |
| Tenant name | Doctors Point Diagnostic Center |
| Branch | Doctors Point Diagnostic Center – Bhola Main Branch |
| Country / currency / TZ | Bangladesh / BDT / Asia/Dhaka |
| Languages | Bangla + English |
| Seed command | `npm run seed:uat:doctors-point` |
| Verify command | `npm run verify:dpdc` |
| Staff password (UAT only) | `DoctorsPoint@2026!` |
| Portal password (UAT only) | `Portal@2026!` |

**Preconditions**

1. Apply Prisma migrations through `20260726070000_mod30_patient_portal_auth`.
2. Run the UAT seed (idempotent).
3. Run `npm run verify:dpdc` — all automated checks must PASS before Manual QC starts.
4. Do **not** use Host Admin for tenant clinical transactions.

---

## 2. User accounts / roles

Use the DP_* role users created by the seed (usernames from `prisma/seed/uat/doctors-point-data.ts`). Typical mapping:

| Role | Purpose |
|------|---------|
| Tenant / Branch Admin | Setup, portal enrollment, module enablement |
| Reception | Patient registration, appointment, queue |
| Doctor (Farhana / Kamrul) | Consultation, investigation advice, follow-up |
| Billing / Cash | Invoice, discount, payment, cash memo |
| Sample Collection | Collection, labels, receipt |
| Lab technicians by section | Result entry / LIS |
| Report Entry | Review imported values |
| Pathologist / Report Verification | Verify results |
| Report Delivery | Authorize release, portal publish, print |

---

## 3. Documented gaps (do not invent)

| Gap | Action during UAT |
|-----|-------------------|
| Serum Ferritin | **Omit** from Case 2 — not in approved catalog |
| Guardian/minor portal policy | Use **explicit** portal delegation only (seeded for Case 3) |
| Notification SMS gateway | Console / configured HTTP provider only — no hardcoded credentials |
| Reference ranges without approved clinical source | ESR, RBS, Creatinine, TSH, FT4, Electrolytes, paediatric HGB — seeded as **CONFIGURATION_GAP_UAT_ONLY** (see `04-DPDC-Reference-Ranges-and-Section-Routing.md`). Do not treat as production clinical authority. |
| Branch / method / effective-dated ranges | Not in schema — out of scope for this pilot |

**Pre-Case-1 gates (Option A):** reference ranges verified for adult M/F + paediatric profiles; priced services remapped to DP-HAEM / DP-BIOCHEM / DP-HORMONE / DP-ELECTRO / DP-CLINPATH (not host “Laboratory”).

---

## 4. Three patient cases

### Case 1 — Md. Rahim Uddin (Diabetes / kidney)

| Field | Expected |
|-------|----------|
| Patient | DP-000001 / Md. Rahim Uddin, 52M |
| Doctor | Dr. Farhana Rahman (09:00–13:00) |
| Tests | FBS, HbA1c, Serum Creatinine, Urine R/E |
| Discount | 10% — reason “Doctor-referred patient” |
| Payment | ৳1,000 partial; remainder due |
| Portal login | `8801712200001` / `Portal@2026!` |

### Case 2 — Jannatul Ferdous (Thyroid)

| Field | Expected |
|-------|----------|
| Patient | DP-000002 / Jannatul Ferdous, 34F |
| Doctor | Dr. Kamrul Hasan (16:00–21:00) |
| Tests | CBC, TSH, Free T4 (**no Ferritin**) |
| Discount | 5% |
| Payment | Full net; due = 0 |
| Controlled issue | Mark serum insufficient → reject → recollect → block release until done |
| Portal login | `8801712200002` / `Portal@2026!` |

### Case 3 — Master Samiul Islam (Paediatric)

| Field | Expected |
|-------|----------|
| Patient | DP-000003 / Master Samiul Islam, 12M |
| Guardian | Md. Nurul Islam (Father) — portal account on DP-000004 |
| Doctor | Dr. Farhana Rahman |
| Tests | CBC, ESR, Serum Electrolytes, Random Blood Sugar |
| Discount | 15% — “Management-approved patient support” |
| Payment | 50% of net; remainder due → billing hold until cleared/waived per policy |
| LIS faults | Unknown code / duplicate message / wrong barcode → quarantine → reconcile |
| Critical | One critical value → acknowledge before release |
| Portal login | Guardian `8801712200003` / `Portal@2026!` — sees Samiul via delegation only |

---

## 5. Execution checklist (all cases)

For each case, record **Actual result**, **PASS/FAIL**, and screenshot evidence.

| # | Step | Navigation | Expected | Actual | P/F | Evidence |
|---|------|------------|----------|--------|-----|----------|
| 1 | Tenant/branch visible | Host / Tenant Admin | DPDC + Bhola Main | | | |
| 2 | Doctor schedule published | `/settings/doctor-schedules` | Published shifts for both doctors | | | |
| 3 | Patient present | `/patients` | Correct demographics / guardian | | | |
| 4 | Appointment + token | `/appointments` → queue | Booked, token, checked in | | | |
| 5 | Consultation + advice | `/doctor/worklist` | Notes + investigation list | | | |
| 6 | Lab order from advice | `/lab/orders` | Unique order number | | | |
| 7 | Invoice from order | `/diagnostic/billing` | Gross from catalog snapshot | | | |
| 8 | Discount | Invoice detail | Authorized user + reason + audit | | | |
| 9 | Payment / cash memo | Invoice + receipt | Gross−Discount=Net; Net−Paid=Due | | | |
| 10 | Sample collection | `/lab/collection` | Containers consolidated; labels with barcode+QR | | | |
| 11 | Lab receipt / reject | `/lab/receipt` | Case 2 rejection/recollection recorded | | | |
| 12 | LIS / result entry | `/lab/lis-worklist` or result entry | Case 3 quarantine + reconcile | | | |
| 13 | Abnormal / critical | Result + critical ack | Flags + ack audit | | | |
| 14 | Verification | `/lab/verification` | Authorized verifier only | | | |
| 15 | Release blockers | `/lab/report-release` | Hold until blockers cleared | | | |
| 16 | Release + QR | Release detail / print | PDF/HTML + verification QR | | | |
| 17 | Portal publish | Release action | Notification outbox row; no release corruption on notify fail | | | |
| 18 | Portal download | `/portal/login` → reports | Own/delegated released reports only | | | |
| 19 | Follow-up Rx | Consultation / prescription history | Version history preserved | | | |
| 20 | Audit | `/settings/audit` | Discount, payment, LIS, verify, release, portal events | | | |

---

## 6. Security-negative tests

| # | Test | Expected | P/F |
|---|------|----------|-----|
| N1 | Portal user A tries to open user B report id | Denied / not listed | |
| N2 | Unreleased report visible in portal | Must not appear | |
| N3 | Host Admin performs tenant clinical bill | Blocked / not used | |
| N4 | Billing user authorizes pathologist verification | Denied | |
| N5 | Public QR page exposes full PHI beyond policy | Privacy-safe only | |
| N6 | Case 3 guardian without delegation | Cannot see minor reports | |

---

## 7. Print / mobile checks

- Cash memo branding (tenant/branch)
- Sample label machine-readable barcode + QR
- Final report print/PDF with verification QR
- Reception / collection screens usable on tablet width

---

## 8. Billing reconciliation formula

For every invoice:

`Gross − Discount = Net`  
`Net − Paid = Due`

Use integer minor units (no floating-point money).

---

## 9. Final sign-off

| Gate | Status |
|------|--------|
| Automated `verify:dpdc` | |
| Case 1 Manual QC | NOT TESTED |
| Case 2 Manual QC | NOT TESTED |
| Case 3 Manual QC | NOT TESTED |
| Security-negative | NOT TESTED |
| Production approval | **NOT APPROVED** until Manual QC PASS |

QC Engineer: _________________ Date: _________  
Evidence folder: `docs/AI-QC/manual-qc/evidence/dpdc-e2e/`
