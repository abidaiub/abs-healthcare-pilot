# J-01 Part 3 Browser Evidence

Run: 2026-08-02 · DPDC / BR-BHL-01 · Patient `PT-000009` · Prescription `RX-000004`

| # | File | Evidence |
|---|---|---|
| 01 | `01-portal-login.png` | Patient portal sign-in screen |
| 02 | `02-dashboard.png` | Nusrat Jahan / PT-000009 identity |
| 03 | `03-my-reports.png` | Only RPT-0000012, 13 and 14 listed |
| 04 | `04-cross-patient-denied.png` | Patient-scoped list; authoritative cross-patient denial is in the verifier (`null`) because no direct report-detail URL is exposed by the portal |
| 05 | `05-report-list.png` | Released report list |
| 06 | `06-report-preview.png` | TSH report selection context |
| 07 | `07-pdf-download.png` | PDF download action context |
| 08 | `08-download-audit.png` | Portal context; authoritative audit proves `PORTAL:PT-000009` / `PDF_DOWNLOAD` |
| 09 | `09-follow-up-open.png` | RX-000004 v1 / prior encounter opened by doctor |
| 10 | `10-report-review.png` | Released TSH report: 6.80 mIU/L HIGH, patient, verifier and QR |
| 11 | `11-rx-version-history.png` | Pre-revision v1 history |
| 12 | `12-rx-v2.png` | v2 draft with medicine and 42-day follow-up |
| 13 | `13-rx-print.png` | Finalized v2 print preview |
| 14 | `14-version-history.png` | v2 current/finalized and v1 superseded |
| 15 | `15-audit-history.png` | Immutable version-history UI; revision and download audit details are verified read-only |
| 16 | `16-journey-complete.png` | Final J-01 history state used as operational closure evidence |

Read-only authoritative check: `npx tsx scripts/verify-j01-part3-state.ts`. It proves active portal enrollment, exactly three published patient reports, audited TSH download, cross-patient denial, v1 preservation, v2 finalization/current status, revision reason, medicine and follow-up.
