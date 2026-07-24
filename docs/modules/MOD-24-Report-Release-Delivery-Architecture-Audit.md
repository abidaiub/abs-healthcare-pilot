# MOD-24 Architecture Audit — Report Release & Delivery

## Routes

| Route | Screen key | Permission |
|-------|------------|------------|
| `/lab/report-release` | reportRelease | `/lab/report-release` |
| `/lab/report-release/[releaseId]` | reportReleaseDetail | `/lab/report-release` |
| `/lab/report-release/[releaseId]/print` | reportReleasePrint | `/lab/report-release/print` |
| `/lab/report-release/history` | reportReleaseHistory | `/lab/report-release/history` |
| `/verify/report/[token]` | Public | None (QR verify) |

## Server actions

`src/app/actions/tenant-lab-report-release.ts` — queue, prepare, authorize, print, download PDF, portal publish, withdraw, amend, QR verify.

## Data model

- `LabReportRelease` — release header, portal flags, counters
- `LabReportVersion` — immutable JSON snapshot versions
- `LabReportDelivery` — delivery log
- `LabReportAccessAudit` — view/download/QR audit
- `LabReportReprintAudit` — reprint governance
- `LabReportVerificationToken` — QR token
- `TenantLabReportCounter` — tenant-scoped `RPT-` numbering

## RBAC

- **REPORT_OFFICER** / **LAB_SUPERVISOR**: authorize, print, portal publish
- **LAB_TECH**: view/prepare/print only (no authorize)
- **RECEPTION**: view/print only when granted

## Dependencies

MOD-23 verified results (`VERIFIED`) required before release authorization.

## Verification

`npm run verify:mod24` — registry, workflow guards, PDF, QR, RBAC, i18n, tenant isolation checks.
