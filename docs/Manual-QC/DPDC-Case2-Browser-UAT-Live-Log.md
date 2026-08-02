# DPDC Patient Case 2 — Live Browser UAT Log

**Started:** 2026-07-26  
**Last updated:** 2026-07-27  
**Patient profile:** Jannatul Ferdous · 34F · Thyroid workup (CBC, TSH, Free T4)  
**Doctor:** Dr. Kamrul Hasan · Discount 5% · Full payment (due = 0)  
**Controlled scenario:** Serum insufficient → reject → recollect → release block until cleared  
**Case 1 baseline defect logged:** DPDC-C1-D001 (follow-up interval/instructions persistence on encounter vs prescription)  
**UAT completed:** Step 11 — Case 2 **PASS** (after DPDC-C2-D010 fix)

## Step results

| Step | Result | Evidence |
|------|--------|----------|
| 1 Patient registration | **PASS** | `case-2/01-patient-registered.png`; DB `PT-000006` Jannatul Ferdous · DPDC |
| 2 Appointment + check-in | **PASS** | `case-2/02-appointment-checked-in.png`; AP `cms1w38tr000bz4vydqslgmta` · Dr Kamrul · 16:00 · checked in |
| 3 Consultation + Rx (CBC/TSH/FT4) | **PASS** | `case-2/03-prescription-finalized.png`; EN `cms1w7u05000hz4vy9vgr4hlr` · RX `cms1w9uog000pz4vyd8fnkhaq` |
| 4 Billing 5% discount + full payment | **PASS** | `case-2/05-billing-paid.png`; INV-000002 · LAB-000002 · RCP-000003 · Gross 2500 / Disc 125 / Net 2375 / Paid 2375 / Due 0 |
| 5 Sample collection + labels | **PASS** | LAB-000002 confirmed; ACC-000005 (EDTA/CBC) + ACC-000006 (Serum/TSH+FT4) collected |
| 6 Serum reject → recollect | **PASS** | ACC-000006 REJECTED `INSUFFICIENT_VOLUME`; ACC-000007 replacement collected/received; ACC-000006 preserved |
| 7 LIS import | **PASS** | CASE2-CBC-001 (ACC-000005 HL7); CASE2-TSH-001 (ACC-000007 TSH 6.8 HIGH); CASE2-FT4-001 (ACC-000007 FT4 1.2) |
| 8 Abnormal + unauthorized edit | **PASS** | TSH 6.8 HIGH; edit 6.8→5.0 as `dp.report.entry` did not persist (DB still 6.8) |
| 8b Critical ack (CBC) | **PASS** | False-critical WBC/PLT ack'd by `dp.verify.doctor` (UAT reference-range gap) |
| 9 Submit + verification | **PASS** | All 3 results → `READY_FOR_VERIFICATION` → `VERIFIED` by `dp.verify.doctor` |
| 9 Release + QR | **PASS** | RPT-0000005 (TSH), RPT-0000006 (CBC), RPT-0000007 (FT4) RELEASED; TSH QR verify URL present |
| 10 Portal download | **PASS** (after fix) | Reassigned `8801712200002` → PT-000006; portal shows RPT-0000005–7; PDF audit row; cross-patient denied — see below |
| 11 Doctor follow-up + Rx versioning | **PASS** | Revision RX-000002 v2 `cms3fmttp0049z4vy3uzpw9vu` — Levothyroxine 50 mcg OD; v1 SUPERSEDED; history page shows 2 versions |

## Step 10 — Portal (post DPDC-C2-D010 fix)

| Check | Expected | Actual |
|-------|----------|--------|
| Portal login | `8801712200002` / `Portal@2026!` @ DPDC | **PASS** — `/portal/reports` |
| Patient identity | PT-000006 — Jannatul Ferdous | **PASS** |
| Released reports visible | RPT-0000005 (TSH), RPT-0000006 (CBC), RPT-0000007 (FT4) | **PASS** (after portal publish for 6/7) |
| DP-000002 data hidden | No seeded patient reports/profile | **PASS** |
| Unreleased/unpublished hidden | Only portal-published releases | **PASS** |
| Cross-patient URL | RPT-0000001 (Case 1) blocked | **PASS** — `findPortalReportForAccess` denied |
| PDF download | Audit entry for PT-000006 | **PASS** — `LabReportAccessAudit` RPT-0000005 @ 2026-07-27T16:17:16Z |

**Correction applied:** Tenant admin used `/settings/patient-portal` → **Reassign portal username** — archived DP-000002 account (`archived.vyu8xrd3yp.8801712200002`), enrolled PT-000006 with reason *"Case 2 UAT: portal bound to seeded DP-000002; clinical data on PT-000006"* @ 2026-07-27T16:14:05Z.

## Step 11 — Doctor follow-up + Rx versioning

| Check | Expected | Actual |
|-------|----------|--------|
| Create revision from RX-000002 v1 | Draft with revision reason | **PASS** — `cms3fmttp0049z4vy3uzpw9vu` |
| Clinical summary | Thyroid follow-up context | **PASS** — *Subclinical hypothyroidism — TSH 6.8 mIU/L (HIGH)* |
| Revised medicines | Levothyroxine 50 mcg OD | **PASS** |
| Follow-up interval | 42 days | **PASS** (UI + prescription record) |
| Follow-up instructions | Repeat TSH in 6 weeks | **PASS** (UI + prescription record) |
| Finalize v2 | Status FINALIZED | **PASS** @ 2026-07-27T16:20:23Z |
| Version history | v1 SUPERSEDED + v2 FINALIZED | **PASS** — `/prescriptions/.../history` shows 2 rows |
| Revision reason preserved | Documented in v2 | **PASS** — *Follow-up after thyroid results — TSH 6.8 HIGH; start levothyroxine* |

## Defects

| ID | Severity | Summary | Status |
|----|----------|---------|--------|
| **DPDC-C2-D001** | Blocker | `/patients/new` hydration — `<Link><Button>` nesting | **FIXED** 2026-07-26 |
| **DPDC-C2-D010** | Major | Portal account DP-000002 vs UAT patient PT-000006 — portal cannot see released reports | **FIXED** 2026-07-27 |
| Seed gap | Minor | DPDC missing `SampleRejectionReason` — runtime `seedLabFoundation('DPDC')` workaround | **OPEN** |
| Config gap | Minor | False critical flags on CBC WBC 7.2 / PLT 250 (UAT reference ranges) | **OBSERVED** |
| i18n | Minor | `[missing:screens.reportRelease*]` on release screens | **OBSERVED** |
| Hydration | Minor | Recurring on result-entry / verification / report-release (non-blocking) | **OBSERVED** |

## Key IDs (LAB-000002)

| Entity | ID / Number |
|--------|-------------|
| Patient (Case 2) | `cms1vwgia0004z4vymguf89rp` · PT-000006 |
| Portal account (active) | `cms3ffsw2003uz4vy0093d8yb` · `8801712200002` → PT-000006 |
| Portal account (archived) | `cms17zemg00cd10vyu8xrd3yp` · `archived.vyu8xrd3yp.8801712200002` → DP-000002 |
| Lab order | `cms1wd5ma000yz4vymime4nxu` · LAB-000002 |
| Samples | ACC-000005 (CBC), ACC-000006 (rejected), ACC-000007 (replacement) |
| Results | CBC `cms3edm7w0024z4vy96ogn44u`, TSH `cms3edx0u002cz4vy3gi62izd`, FT4 `cms3ee63q002gz4vyqqdrh1ct` |
| Releases | TSH RPT-0000005, CBC RPT-0000006, FT4 RPT-0000007 (all portal-published) |
| Prescription v1 | `cms1w9uog000pz4vyd8fnkhaq` · RX-000002 v1 · SUPERSEDED |
| Prescription v2 | `cms3fmttp0049z4vy3uzpw9vu` · RX-000002 v2 · FINALIZED |

## Defect fixed before Case 2 resume

**DPDC-C2-D001** — `ButtonLink` fix + submit guard; regression `npm run verify:mod15:browser` PASS.

## Build cleanup (unrelated — defer)

`scripts/tmp-check-urine.ts` — wrong Prisma import; blocks `npm run build` only.

## Case 2 registration record (UI)

| Field | Value |
|-------|-------|
| Patient # | **PT-000006** |
| Name | Jannatul Ferdous |
| Gender | Female |
| DOB | 1992-03-15 |
| Mobile | 01712200902 |
| Address | Borhanuddin, Bhola |
| Tenant | DPDC · BR-BHL-01 |

## Regression

`npm run verify:dpdc` — **PASS** (includes portal reassignment, cross-patient denial, seed vs runtime patient separation).

## Final verdict

**Patient Case 2 — PASS** (Steps 1–11 complete; DPDC-C2-D010 fixed via approved portal username reassignment; Case 3 not started).
