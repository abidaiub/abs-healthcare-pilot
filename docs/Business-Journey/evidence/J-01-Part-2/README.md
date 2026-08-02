# J-01 Part 2 — Browser UAT Evidence

**Verdict:** PASS after `J01-P2-D001` UAT payload correction  
**Run:** 2026-08-01 · DPDC / BR-BHL-01 · 1920×1080

| File | Step | Route | Role | Module | Expected | Actual | Status |
|---|---|---|---|---|---|---|---|
| 01-receipt-worklist.png | Receipt queue | `/lab/receipt` | dp.collection | MOD-21 | Both accessions pending receipt | ACC-000011/12 matched to LAB-000004 | PASS |
| 02-accession-011-before-receipt.png | Identity check | Sample detail | dp.collection | MOD-21 | EDTA/CBC identity | PT-000009, EDTA, CBC | PASS |
| 03-accession-011-received.png | Receipt | `/lab/receipt` | dp.collection | MOD-21 | First sample removed after receipt | ACC-000011 absent from queue | PASS |
| 04-accession-012-before-receipt.png | Identity check | Sample detail | dp.collection | MOD-21 | Plain Tube/thyroid identity | PT-000009, TSH + Free T4 | PASS |
| 05-accession-012-received.png | Receipt | `/lab/receipt` | dp.collection | MOD-21 | Second sample received | ACC-000012 removed | PASS |
| 06-all-samples-received.png | Receipt completion | `/lab/receipt` | dp.collection | MOD-21 | No duplicate receipt action | Empty worklist | PASS |
| 07-haematology-processing-worklist.png | Section processing | `/lab/processing` | dp.tech.haem | MOD-21 | EDTA visible | ACC-000011 ready action available | PASS |
| 08-edta-ready-for-processing.png | Section processing | `/lab/processing` | dp.tech.haem | MOD-21 | EDTA processed once | ACC-000011 removed | PASS |
| 09-hormone-processing-worklist.png | Section processing | `/lab/processing` | dp.tech.hormone | MOD-21 | Plain Tube visible | ACC-000012 with TSH/FT4 | PASS |
| 10-serum-ready-for-processing.png | Section processing | `/lab/processing` | dp.tech.hormone | MOD-21 | Hormone sample ready | Item removed | PASS |
| 11-processing-status-complete.png | Processing completion | `/lab/processing` | dp.tech.hormone | MOD-21 | No remaining items | Empty worklist | PASS |
| 12-lis-worklist.png | LIS queue | `/lab/lis-worklist` | dp.report.entry | MOD-22 | Import controls and audit queue | Available | PASS |
| 13-cbc-lis-message-submitted.png | CBC import | LIS worklist | dp.report.entry | MOD-22 | Accession-keyed payload | `J01P2-CBC-001` submitted | PASS |
| 14-cbc-results-imported.png | CBC import | LIS worklist | dp.report.entry | MOD-22 | Successful import | CBC linked to ACC-000011 | PASS |
| 15-thyroid-lis-message-submitted.png | Thyroid import | LIS worklist | dp.report.entry | MOD-22 | TSH payload | `J01P2-TSH-001` submitted | PASS |
| 16-tsh-ft4-results-imported.png | Thyroid import | LIS worklist | dp.report.entry | MOD-22 | Both results imported | TSH and FT4 linked to ACC-000012 | PASS |
| 17-abnormal-tsh-flag.png | Flagging | Result detail | dp.report.entry | MOD-22 | TSH 6.8 HIGH | HIGH, range 0.4–4 | PASS |
| 18-lis-audit-evidence.png | Idempotency | LIS worklist | dp.report.entry | MOD-22 | Duplicate blocked and raw audit retained | `DUPLICATE_MESSAGE`; original remains SUCCESS | PASS |
| 19-result-entry-worklist.png | Result worklist | `/lab/result-entry` | dp.report.entry | MOD-22 | Three results | CBC, TSH, FT4 present | PASS |
| 20-cbc-result-review.png | CBC review | Result detail | dp.report.entry | MOD-22 | Normal corrected CBC | HGB 14.2, WBC 7200, PLT 250000 NORMAL | PASS |
| 21-tsh-ft4-result-review.png | TSH review | Result detail | dp.report.entry | MOD-22 | Value/unit/range/source | 6.8 mIU/L, 0.4–4, HIGH | PASS |
| 21b-free-t4-result-review.png | FT4 review | Result detail | dp.report.entry | MOD-22 | Normal FT4 | 1.2 ng/dL, 0.8–1.8, NORMAL | PASS |
| 22-abnormal-flag-visible.png | Abnormal flag | Result detail | dp.report.entry | MOD-22 | Non-critical abnormal visible | TSH HIGH | PASS |
| 23-results-completed.png | Completion | Result worklist | dp.report.entry | MOD-22 | Complete all | Submitted | PASS |
| 24-ready-for-verification.png | Lifecycle | Result worklist | dp.report.entry | MOD-22 | READY_FOR_VERIFICATION | All three ready | PASS |
| 25-unauthorized-edit-blocked.png | LIS protection | Result editor | dp.report.entry | MOD-22 | No LIS override permission | `LAB_LIS_OVERRIDE_NOT_PERMITTED` | PASS |
| 26-verification-worklist.png | Verification queue | `/lab/verification` | dp.verify.doctor | MOD-23 | Three results | Three review actions | PASS |
| 27-cbc-verification.png | CBC verification | Verification review | dp.verify.doctor | MOD-23 | Normal values reviewed | Values/ranges/flags visible | PASS |
| 28-thyroid-verification.png | Thyroid verification | Verification review | dp.verify.doctor | MOD-23 | TSH HIGH reviewed | Versioned review | PASS |
| 29-results-verified.png | Verification completion | `/lab/verification` | dp.verify.doctor | MOD-23 | Queue clears | No results awaiting verification | PASS |
| 30-verification-audit.png | Verification audit | Verification history | dp.verify.doctor | MOD-23 | Verifier/time/version | Attempt #1 VERIFIED | PASS |
| 31-release-worklist.png | Release queue | `/lab/report-release` | dp.report.delivery | MOD-24 | Verified results only | LAB-000004 results eligible to prepare | PASS |
| 32-release-eligibility-pass.png | Eligibility | Release detail | dp.report.delivery | MOD-24 | Due 0/no holds/current version | Eligible; no active holds | PASS |
| 33-unauthorized-release-denied.png | Authorization | `/lab/report-release` | dp.verify.doctor | MOD-24 | Denied | Redirected with insufficient permission | PASS |
| 34-report-authorized.png | Authorization | Release detail | dp.report.delivery | MOD-24 | RELEASED with report number | RPT-0000014 shown released | PASS |
| 35-reports-released.png | Release history | Release history | dp.report.delivery | MOD-24 | Three unique reports | RPT-0000012/13/14 RELEASED | PASS |
| 36-report-print-preview.png | Print | Print view | dp.report.delivery | MOD-24 | Full branded clinical report | TSH report includes identity, sample, HIGH, verifier, version, QR | PASS |
| 37-report-pdf.png | PDF | Release detail | dp.report.delivery | MOD-24 | PDF generated/download audited | RPT-0000012 download count became 1 | PASS |
| 38-report-qr.png | QR | Release detail | dp.report.delivery | MOD-24 | Versioned verification QR | Valid current-version URL | PASS |
| 39-public-qr-verification.png | Public verification | `/verify/report/{token}` | Public | MOD-24 | Privacy-safe authenticity | Only report number, release status, validity, version | PASS |
| 40-portal-published.png | Portal publication | Release detail | dp.report.delivery | MOD-24 | Published flag | All three releases have `portalPublishedAt` | PASS |
| 41-notification-outbox.png | Notification context | Release detail | dp.report.delivery | MOD-05 | Report-ready events queued | No outbox UI; read-only verifier confirms 3 SENT console-provider rows | PASS (DB evidence) |
| J01-P2-D001-cbc-unit-scale-mismatch.png | Defect | Result detail | dp.report.entry | MOD-22 | Normal CBC payload | First message used wrong absolute-count scale; safely flagged critical-low | FIXED |

Database evidence is produced by `npx tsx scripts/verify-j01-part2-state.ts`. No real patient data, direct SQL mutation, portal login, or portal download was used.
