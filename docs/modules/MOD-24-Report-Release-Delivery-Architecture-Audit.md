# MOD-24 Architecture Audit — Report Release & Delivery (v1.1)

## Phase 1 audit table

| Concern | Existing implementation | Gap (pre-polish) | Planned change (v1.1) |
| --- | --- | --- | --- |
| Verified-result check | `assertReleaseEligibility()` | Not centralized | `evaluateReportReleaseEligibility()` |
| Open correction check | correctionRequests filter | OK | Reused in matrix |
| Tenant scope | action queries | OK | Reused in matrix |
| Branch scope | session.branchId | OK | Reused in matrix |
| Record version check | verification vs recordVersion | OK | Reused in matrix |
| Billing hold | None (billing panel mock) | No integration | Manual hold + tenant policy flag |
| Quality hold | None | No field | `LabReportRelease` quality hold fields |
| Critical-result acknowledgment | MOD-22 events | Not enforced on release | Policy-driven block |
| QR token | `LabReportVerificationToken` | OK | Reused |
| QR image in HTML | URL text only | No image | `qrcode` SVG data URL in footer |
| QR image in PDF | Text-only minimal PDF | No image | `pdfkit` + PNG QR embed |

## Release flow

```text
Release Queue (VERIFIED + no release OR release RELEASE_PENDING/AMENDED)
    ↓
Prepare Release → LabReportRelease RELEASE_PENDING (LabResult stays VERIFIED)
    ↓
evaluateReportReleaseEligibility (policy + holds + clinical checks)
    ↓
Authorize Release (optimistic stateVersion lock + transaction recheck)
    ↓
Create Immutable LabReportVersion snapshot
    ↓
Generate LabReportVerificationToken
    ↓
Print HTML (QR SVG) / PDF (QR PNG) / Portal publish flag
```

## Clinical vs release state

- **LabResult.status** remains `VERIFIED` after clinical approval (MOD-23 source of truth).
- **LabReportRelease.status** owns `RELEASE_PENDING`, `RELEASED`, `WITHDRAWN`, `AMENDED`.
- Migration backfills any legacy `LabResult` rows that were set to `RELEASE_PENDING` / `RELEASED`.

## Migration ordering repair (2026-07-29)

- Root cause: `20260724130000_mod24_release_polish` ran before `lab_report_releases` / `lab_results` existed (`42P01` on fresh/QC DBs).
- Repair: make early polish conditional on prerequisite objects; add idempotent `20260724261000_mod24_release_polish_deferred` after `20260724260000_mod24_report_release`.
- Do not rename the published polish migration; see `docs/modules/MOD-24-Migration-Notes.md` for QC recovery without reset/reseed.

## RBAC decision

- **TENANT_ADMIN**: `fullAccess` retained for administration, but seed `denyActions` remove clinical release authorization (`canApprove` on release/withdraw/amend/portal).
- **REPORT_OFFICER** / **LAB_SUPERVISOR**: authorize release.
- **LAB_TECH**: prepare and print only.
- **RECEPTION**: view/print only.

## QR dependency

- Package: **`qrcode`** (server SVG/PNG, no external API).
- PDF: **`pdfkit`** for embedded QR image.
- Payload: public verification URL only (`/verify/report/<token>`).

## Known limitations

- PDF text remains Latin/Helvetica; multilingual/RTL PDF deferred (HTML print supports RTL `dir`).
- Automated billing integration deferred; manual billing hold + tenant policy foundation only.

## Status

**AI COMPLETE — MANUAL QC PENDING**
