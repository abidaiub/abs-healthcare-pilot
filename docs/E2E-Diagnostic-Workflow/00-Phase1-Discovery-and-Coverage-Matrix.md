# Doctors Point Diagnostic Center — End-to-End Workflow

## Phase 1 Discovery Report & MOD-01–MOD-24 Coverage Matrix

**Document:** `00-Phase1-Discovery-and-Coverage-Matrix.md`
**Status:** Phase 1 complete; Phase 2–4 implementation landed in working tree — see `01-Phase2-Gap-Analysis.md` and `02-Manual-QC-UAT-Guide.md`
**Scope:** One connected, tenant-isolated, branch-isolated, role-controlled, auditable diagnostic-center workflow spanning MOD-01 → MOD-24
**Date:** 26 July 2026

---

## 1. Authority and source-of-truth order

Resolved per `docs/AI-QC/AI-QC-v1.0.md` §3:

| Priority | Source |
|----------|--------|
| 1 | `docs/ProductBook/ABSHealthcareLite_Product_Master_Book_v4_UIUXBlueprint.md` |
| 2 | Module documentation `docs/<NN>-<ModuleName>/`, `docs/modules/MOD-XX-*` |
| 3 | UI/UX Blueprint (Product Book V4 + module `Mockups/`) |
| 4 | Sample Data Dictionary |
| 5 | `prisma/schema.prisma` + migrations |
| 6 | `src/app/api/` |
| 7 | Module Book workflow sections |
| 8 | Application source code (lowest) |

Official MOD-01–24 naming is taken from
`docs/ProductBook/ABSHealthcareLite_Product_Master_Book_v2_ModuleCatalog.md` (Volume 2 — Functional Module Catalog).

---

## 2. Program-level state at discovery

- **No module has completed Manual QC or Production Approval.** Per `docs/AI-QC/README.md`
  and `docs/AI-QC/manual-qc/README.md`, even MOD-01 stands at: AI QC **PASS**,
  QC Docker deployment **BLOCKED**, Manual QC execution **PENDING**, UAT **PENDING**,
  Production Approval **NOT APPROVED**.
- The clinical/laboratory pipeline (MOD-15, 17–24) is genuinely implemented with real
  Prisma models, tenant/branch-scoped server actions, RBAC enforcement, report
  versioning/amendment, critical-value acknowledgement, billing/quality holds and real
  QR generation.
- The **financial spine required by this workflow does not exist in the database**.
- **MOD-05 Notification Center does not exist** in any form beyond a Module Book.
- **LIS/analyser integration, patient portal, and doctor scheduling are not real**.

---

## 3. MOD-01–MOD-24 coverage matrix

Status values are restricted to the approved set:
`NOT STARTED` · `IN PROGRESS` · `AI COMPLETE — MANUAL QC PENDING` · `MANUAL QC FAILED` · `APPROVED` · `BLOCKED`.
`Not directly exercised` is used only where the module is genuinely out of scope for a
diagnostic centre, with the reason recorded.

| Module | Approved module name | Applicable workflow step | Existing implementation | Gap | Required change | Test evidence | Status |
|---|---|---|---|---|---|---|---|
| MOD-01 | Company/Tenant Management | Tenant created; subscription active | `/host/tenants*`; `Tenant`, `TenantSubscription`, `ModuleRegistry`, `TenantModule` | QC Docker deployment BLOCKED; Manual QC PENDING | None in code; unblock QC environment | `reports/001-Foundation-ReQC-01.md`, `verify:mod01` | AI COMPLETE — MANUAL QC PENDING |
| MOD-02 | User Management | Users and roles assigned | `User`, `UserRole`, `UserBranch`; `/settings/users*` | Manual QC not executed (shared pack with MOD-03) | None in code | `reports/002-UserRBAC.md`, `verify:mod02` | AI COMPLETE — MANUAL QC PENDING |
| MOD-03 | Role & Permission | RBAC-controlled workflow (cross-cutting) | `Role`, `Permission`; `/settings/roles*`; `permission-catalog.ts`; `requireTenantPermission` | Absent from `MODULE_REGISTRY`; no standalone AI-QC report; no `verify:mod03` | Register MOD-03; add dedicated verification script | `reports/002-UserRBAC.md` (shared) | IN PROGRESS |
| MOD-04 | Audit Center | Audit trail confirmed | `AuditLog`, `StatusHistory`; `/settings/audit`, `/host/audit` | Manual QC not executed; AI-QC file numbered `003-*` | None in code; record naming quirk | `reports/003-AuditCenter.md`, `verify:mod04` | AI COMPLETE — MANUAL QC PENDING |
| MOD-05 | Notification Center | Report-ready notification dispatch | `NotificationTemplate`, `NotificationOutbox`; `enqueueNotification` / console-or-HTTP provider; wired from portal publish | No full inbox UI; Manual QC pending | Optional template seed / gateway env for live SMS | `verify:dpdc` notification checks | AI COMPLETE — MANUAL QC PENDING |
| MOD-06 | Localization | Bangla/English tenant operation | i18n engine, MOD-01A locale profile, `User.preferredLocale` | Manual QC not executed | None in code | `reports/006-Localization-AI-QC-v1.0.md`, `verify:mod06` | AI COMPLETE — MANUAL QC PENDING |
| MOD-07 | Branch / Location | Branch configured | `Branch`; `/settings/branches*`; branch resolve/switch + `UserBranch` | Manual QC not executed | None in code | `reports/007-Branch-Location-AI-QC-v1.0.md`, `verify:mod07` | AI COMPLETE — MANUAL QC PENDING |
| MOD-08 | Department Management | Operating departments configured | `Department` model (host + tenant scoped) | No registry entry, RBAC resource, tenant settings route, AI-QC or verification script | Tenant department configuration path required for the 11 named departments | None | NOT STARTED |
| MOD-09 | Category Management | Service/test categorisation supporting MOD-10 | `Category` model | No registry/RBAC/route/AI-QC | Indirect only; no dedicated screen required for this workflow | None | NOT STARTED (supporting) |
| MOD-10 | Master Service Catalog | Diagnostic catalog and rates; price snapshot | Catalog masters + real `Invoice`/`InvoiceItem` price snapshot from lab order; `/diagnostic/billing` | Dedicated MOD-10 AI-QC report still absent; Manual QC pending | File MOD-10 AI-QC when convenient | `verify:dpdc`, billing actions | AI COMPLETE — MANUAL QC PENDING |
| MOD-11 | Doctor Management | Doctors configured; schedules published | Doctors + `DoctorSchedule` publish; `/settings/doctors`, `/settings/doctor-schedules` | Registry tagging drift may remain; Manual QC pending | Align SCREENS module tags when convenient | `verify:dpdc` schedule checks | AI COMPLETE — MANUAL QC PENDING |
| MOD-12 | Referral Doctor | — | Not implemented | — | None | — | Not directly exercised — no referral doctor appears in the three approved patient cases |
| MOD-13 | Ward / Cabin / Bed Setup | — | Not implemented | — | None | — | Not directly exercised — diagnostic centre has no inpatient infrastructure |
| MOD-14 | Diagnostic Inventory | — | Not implemented | — | None | — | Not directly exercised — the workflow consumes container *types* (MOD-21 `SampleContainer`), not reagent stock |
| MOD-15 | Patient Registration & MPI | Patient registered (all three cases) | `Patient` incl. guardian fields, `TenantPatientCounter`; `/patients*` | Manual QC not executed; guardian data is free-text with no minor flag and **no documented guardian/minor portal or notification policy** | Record guardian/minor policy gap; do not invent access rules | `reports/015-Patient-Registration-AI-QC-v1.0.md`, `verify:mod15` | AI COMPLETE — MANUAL QC PENDING |
| MOD-16 | Patient Profile & Ledger | Consolidated patient financial view | Module Book only | No profile/ledger model, registry, RBAC, route or AI-QC | Depends on billing model landing first | None | NOT STARTED |
| MOD-17 | Appointment & Queue | Appointment booked; token; check-in | `Appointment`, `BranchDoctorQueueCounter`; full routes/actions | Manual QC not executed | None in code | `reports/017-…-AI-QC-v1.0.md`, `verify:mod17` | AI COMPLETE — MANUAL QC PENDING |
| MOD-18 | Doctor Worklist & Encounter | Consultation; investigation advice | `ClinicalEncounter`, `EncounterVital`, `EncounterDiagnosis`, `EncounterInvestigationAdvice` | Manual QC not executed | None in code | `reports/018-…-AI-QC-v1.0.md`, `verify:mod18` | AI COMPLETE — MANUAL QC PENDING |
| MOD-19 | Prescription Management | Investigation order source; prescription versioning | `Prescription` (versioned), `PrescriptionInvestigation`, print/history routes | Manual QC not executed | None in code | `reports/019-…-AI-QC-v1.0.md`, `verify:mod19` | AI COMPLETE — MANUAL QC PENDING |
| MOD-20 | Pharmacy Catalog | Demo medication lines on prescriptions | Medication catalog cluster + routes | Manual QC not executed; demo tenant assignment currently **Disabled** | Enable module for the new tenant during seeding | `reports/020-…-AI-QC-v1.0.md`, `verify:mod20` | AI COMPLETE — MANUAL QC PENDING |
| MOD-21 | Sample Collection | Containers determined; labels; collection; rejection/recollection; routing | Lab sample lifecycle + Code 128/QR label images via `bwip-js` | Manual QC not executed | None | `reports/021-…-AI-QC-v1.0.md`, `verify:mod21` | AI COMPLETE — MANUAL QC PENDING |
| MOD-22 | Result Entry & Analyzer | LIS import; abnormal/critical handling | Manual entry + `AnalyzerMapping` / `AnalyzerImportQueue` / error quarantine + reconcile UI | Manual QC not executed | Walk Case 3 LIS fault scenarios in Manual QC | `reports/022-…-AI-QC-v1.0.md`, `verify:mod22`, `verify:dpdc` | AI COMPLETE — MANUAL QC PENDING |
| MOD-23 | Result Verification | Results reviewed and verified; correction loop | `LabResultVerification`, `LabResultCorrectionRequest`; verification routes/actions | Manual QC not executed | None in code | `reports/023-…-AI-QC-v1.0.md`, `verify:mod23` | AI COMPLETE — MANUAL QC PENDING |
| MOD-24 | Report Release & Delivery | Release eligibility; authorisation; PDF/QR; portal publish; notification | `LabReportRelease` (billing/quality holds), `LabReportVersion`, `LabReportDelivery`, `LabReportVerificationToken`, real QR + public verify page | Manual QC not executed (v1.1); notification step is a no-op pending MOD-05 | None beyond the MOD-05 dependency | `reports/024-Report-Release-Delivery-AI-QC-v1.1.md`, `verify:mod24` | AI COMPLETE — MANUAL QC PENDING |

### Supporting module outside the 01–24 range

| Module | Name | Relevance | State |
|---|---|---|---|
| MOD-30 | Patient Portal & Self Service | Workflow steps “patient accesses portal” and “released report downloaded” | Real portal auth/session, ownership queries, staff admin at `/settings/patient-portal`, UAT portal accounts + Case 3 guardian delegation. Status: AI COMPLETE — MANUAL QC PENDING |

---

## 4. Documented contradictions (flagged, not silently resolved)

1. **Two module-ID schemes in code:** `MOD-nn` (`MODULE_REGISTRY` in
   `src/lib/saas-foundation-data.ts`, RBAC `permission-catalog.ts`) versus bare `"nn"`
   (`MODULES` in `src/lib/module-registry.ts`).
2. **`/settings/doctors` module conflict:** RBAC assigns `MOD-11`; `SCREENS` assigns
   `resultVerification` (MOD-23). Consulting-doctor management and reporting/verifying-doctor
   management are not clearly separated in the documentation.
3. **`/dashboard` module conflict:** RBAC assigns `MOD-15`; `SCREENS` assigns MOD-21.
4. **AI-QC report numbering** diverges from MOD numbers for early gates
   (`002` covers MOD-02 **and** MOD-03; `003-AuditCenter.md` is MOD-04).
5. **`docs/AI-QC/reports/README.md` is stale** — states “No reports filed yet” and documents a
   naming scheme that does not match the 18 files present.
6. **MOD-28** is registered `Active` in `MODULE_REGISTRY` with zero route implementation.
7. **Serum Ferritin is absent from the approved catalog** (`prisma/seed/data/host-diagnostic-catalog-data.ts`).
   Recorded as a catalog gap for Patient Case 2; the test is **not** invented.
8. **Sample Data Dictionary already assigns “Dr. Farhana Rahman” to Gynecology**, whereas this
   workflow requires Medicine. The dictionary is demo reference data (priority 4) and the new
   tenant holds its own doctor records, so this is a naming collision to avoid in shared
   fixtures rather than a blocker.

---

## 5. Phase 2 — Gap classification per workflow step

Classification vocabulary: `Already working` · `Partially working` · `UI only` ·
`Mock-only` · `Missing backend` · `Missing DB support` · `Missing authorization` ·
`Missing audit` · `Missing test` · `Missing documentation` · `Unsafe for production`.

| # | Workflow step | Module | Classification | Notes |
|---|---|---|---|---|
| 1 | Tenant created | MOD-01 | Already working | Manual QC pending |
| 2 | Branch configured | MOD-07 | Already working | Manual QC pending |
| 3 | Subscription active | MOD-01 | Already working | — |
| 4 | Users and roles assigned | MOD-02/03 | Already working | MOD-03 missing from registry |
| 5 | Doctors configured | MOD-11 | Partially working | No registry entry; module mis-tagging |
| 6 | Doctor schedules published | MOD-11 | Missing DB support | No schedule/slot model; free-text `timeSlot` only |
| 7 | Patient registered | MOD-15 | Already working | Guardian/minor policy undocumented |
| 8 | Appointment booked | MOD-17 | Already working | — |
| 9 | Queue token generated | MOD-17 | Already working | — |
| 10 | Patient checked in | MOD-17 | Already working | — |
| 11 | Consultation started | MOD-18 | Already working | — |
| 12 | Investigation advised | MOD-18/19 | Already working | — |
| 13 | Investigation order generated | MOD-21 | Already working | Created from encounter advice or prescription |
| 14 | Bill calculated | MOD-10 | **Mock-only / Missing DB support** | `DiagnosticBillingPanel.tsx` is client state over mock arrays; no invoice model |
| 15 | Discount authorized | MOD-10 | **Missing DB support / Missing authorization / Missing audit** | Only `discountAllowed` booleans exist; no approver, reason, or audit trail |
| 16 | Payment received (full or partial) | MOD-10 | **Missing DB support** | No payment/receipt model; no idempotency |
| 17 | Cash memo generated | MOD-10 | **Missing backend** | No receipt numbering or persisted document |
| 18 | Sample containers determined | MOD-21 | Already working | `groupTestsBySpecimen` consolidation exists |
| 19 | Barcode labels printed | MOD-21 | Partially working | Text accession only — not machine-readable |
| 20 | Samples collected | MOD-21 | Already working | — |
| 21 | Samples received in laboratory | MOD-21 | Already working | Accept/reject with reasons |
| 22 | Samples routed to departments | MOD-21 | Already working | Department on order lines |
| 23 | Tests processed | MOD-21/22 | Already working | — |
| 24 | LIS results imported | MOD-22 | **Mock-only / Missing backend** | No ingest, device mapping, idempotency or quarantine |
| 25 | Abnormal and critical results handled | MOD-22 | Already working | Reference ranges, flags, critical events |
| 26 | Results reviewed | MOD-22 | Already working | — |
| 27 | Results verified | MOD-23 | Already working | — |
| 28 | Release eligibility evaluated | MOD-24 | Already working | Structured blocker matrix in `eligibility.ts` |
| 29 | Report authorized | MOD-24 | Already working | — |
| 30 | PDF/print report generated | MOD-24 | Already working | `pdf.ts`, `render-html.ts` |
| 31 | Verification QR embedded | MOD-24 | Already working | `qr.ts` + `/verify/report/[token]` |
| 32 | Report released to portal | MOD-24 | Already working (staff side) | Portal publish flags set |
| 33 | Notification sent | MOD-05 | **Missing DB support / Missing backend** | Module does not exist |
| 34 | Patient/guardian accesses portal | MOD-30 | **Mock-only / Unsafe for production** | No patient auth or ownership enforcement |
| 35 | Released report downloaded | MOD-30 | **Mock-only** | Depends on portal authentication |
| 36 | Follow-up doctor review | MOD-18 | Already working | — |
| 37 | Prescription updated with version history | MOD-19 | Already working | Versioned with supersede chain |
| 38 | Audit trail confirmed | MOD-04 | Partially working | Billing/discount/payment/notification events cannot be audited until those features exist |

---

## 6. Blocking gaps, ranked

| # | Gap | Blocks | Decision |
|---|-----|--------|----------|
| 1 | No invoice/payment/discount schema; billing screen is a client-side mock | Catalog rate snapshot, discount authorisation, payment, due tracking, accounting reconciliation for **all three patients** | Implement |
| 2 | MOD-05 Notification Center absent | Report-ready notification for all three patients | Implement outbox + provider abstraction |
| 3 | LIS integration mock-only; no idempotency or quarantine | Patient Case 3 controlled LIS-fault scenario | Implement |
| 4 | Patient portal has no authentication or ownership enforcement | Portal access and download for all three patients | Implement |
| 5 | No doctor schedule model | Published consultation schedules | Implement or record limitation |
| 6 | Sample barcode not machine-readable | Barcode label requirement | Implement |
| 7 | No department/category tenant setup screen | Department configuration | Implement or seed through approved path |
| 8 | Guardian/minor policy undocumented | Patient Case 3 portal/notification access | Record as gap; do not invent rules |
| 9 | Serum Ferritin absent from catalog | Patient Case 2 optional test | Record as catalog gap; omit the test |

---

## 7. Phase gate

Phase 1 (discovery) and Phase 2 (gap classification) are complete.
Phase 3–4 implementation for the ranked blockers is in the working tree
(billing, notifications, LIS quarantine, portal auth, schedules, barcodes, DPDC seed).

**Manual QC remains mandatory.** No module in this workflow may be marked `APPROVED`
on the basis of automated verification alone. Use `02-Manual-QC-UAT-Guide.md`.
