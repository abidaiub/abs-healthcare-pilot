# J-01 Golden Reference — First Patient Operational Journey

## 1. Executive Summary

J-01 is the accepted DPDC golden journey for fictional patient Nusrat Jahan (`PT-000009`). It covers registration through consultation, paid diagnostic billing, laboratory processing, released portal reports, doctor follow-up and versioned treatment. Parts [1](./J-01-First-Patient-Part-1.md), [2](./J-01-First-Patient-Part-2.md) and [3](./J-01-First-Patient-Part-3.md) all passed browser UAT.

## 2. Business Workflow

Registration → appointment → consultation → RX v1 → invoice/payment → collection → receipt/processing → LIS/result entry → verification → release/PDF/QR/portal → patient download → doctor review → RX v2/treatment → operational completion.

## 3. System Workflow

`PT-000009` → `AP-000005` → `EN-000004` / `RX-000004 v1` → `INV-000004` due 0 → `LAB-000004` → accessions/results → `RPT-0000012`, `RPT-0000013`, `RPT-0000014` → portal access audit → `RX-000004 v2`. No replacement patient, appointment, invoice or lab order was created in Part 3.

## 4. Module Coverage

| Coverage | Modules |
|---|---|
| Patient, appointment, queue | MOD-15, MOD-16, MOD-17 |
| Consultation and prescription | MOD-18, MOD-19 |
| Billing and payment | MOD-20 |
| Collection, LIS and results | MOD-21, MOD-22 |
| Verification and release | MOD-23, MOD-24 |
| Notification and portal | MOD-05, MOD-30 |

## 5. Evidence Summary

Part 1 contains 23 browser captures, Part 2 contains 32, and Part 3 contains 16. Their README files are the canonical screenshot indexes: [Part 1](./evidence/J-01-Part-1/README.md), [Part 2](./evidence/J-01-Part-2/README.md), [Part 3](./evidence/J-01-Part-3/README.md).

## 6. All Defects Found During J-01

| Defect | Finding |
|---|---|
| J01-P1-D001 | DOB entry/age behavior required correction during UAT |
| J01-P1-D002 | Server/client mapper boundary issue |
| J01-P1-D003 | Appointment date/timezone handling issue |
| J01-P1-D004 | Doctor worklist timezone handling issue |
| J01-P2-D001 | CBC analyzer UAT payload used absolute-count reference ranges with scaled WBC/platelet inputs |
| J01-P3-D001 | PT-000009 had no portal enrollment at Part 3 baseline |

## 7. All Fixes

Part 1 corrected DOB mapping and timezone-safe appointment/worklist behavior in application code. Part 2 submitted a second, auditable analyzer message with WBC 7200 and platelets 250000 and acknowledged the historical critical events; no database patch was used. Part 3 enrolled the patient through the approved tenant-admin counter-enrollment UI. Clinical state changes were performed through browser workflows only.

## 8. Regression Coverage

Canonical checks are `npm run verify:dpdc`, module verifiers (especially MOD-19 and MOD-24), changed-file lint, browser UAT, and the read-only Part 2/3 state verifiers. Part 3 additionally asserts portal isolation, access audit, immutable v1, current v2, treatment and follow-up.

## 9. Screenshot Index

The three evidence READMEs index every capture. Key final evidence is Part 3 `10-report-review.png`, `13-rx-print.png`, `14-version-history.png`, and `16-journey-complete.png`.

## 10. Operational Lessons Learned

Reference-range units must match analyzer payload scale; release requires financial and quality eligibility; portal readiness includes patient enrollment, not only report publication; immutable clinical revisions are safer than overwrites; UI evidence should be paired with read-only audit queries when no audit screen exists.

## 11. Known Limitations

There is no notification-outbox UI, no patient-facing access-audit UI, and no dedicated “Journey Complete” entity. Part 2 verified outbox state read-only; Part 3 verified portal access and prescription state read-only. Some laboratory localization keys remain missing. All diagnosis and treatment text is fictional UAT data and not medical advice.

## 12. Production Readiness Statement

**J-01 verdict: PASS and READY FOR J-02 as a pilot golden journey.** This is operational pilot readiness, not unrestricted production certification. Production still requires manual QC, security/privacy review, backup/restore and disaster-recovery tests, performance testing, localization completion, external notification validation, clinical governance approval, and environment-specific deployment controls.
