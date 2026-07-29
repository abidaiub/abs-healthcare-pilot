# MOD-24 — Report Release & Delivery

| Field | Value |
|-------|-------|
| **Module** | MOD-24 |
| **Display name** | Report Release & Delivery |
| **Depends on** | MOD-07, MOD-15, MOD-21, MOD-22, MOD-23 + platform modules |
| **Downstream** | MOD-30 Patient Portal |
| **Verify** | `npm run verify:mod24` |
| **Status** | AI COMPLETE — MANUAL QC PENDING |

## Purpose

Authorize release of pathologist-verified laboratory results, enforce a centralized blocking matrix, freeze immutable report snapshots, support print/PDF delivery with embedded QR codes, portal publish handoff, withdrawal, and post-release amendment versioning.

## Scope (Pilot)

- Release queue for clinically verified results (`LabResult.status = VERIFIED`)
- Release distribution state on `LabReportRelease` only
- Centralized `evaluateReportReleaseEligibility()` blocking matrix
- Tenant policy flags: billing clearance, critical acknowledgment
- Manual billing hold and quality hold on release records (automated billing deferred)
- Optimistic concurrency via `stateVersion`
- HTML printable report with embedded QR (SVG)
- Server PDF with embedded QR (`pdfkit` + `qrcode`)
- Print/reprint audit with reason governance
- Portal publish flag for MOD-30
- Public QR verification (no PHI, superseded/withdrawn handling)
- Withdrawal and amendment version history

## Deferred / product-book gaps

- Patient portal UI (MOD-30)
- WhatsApp/email/SMS dispatch
- Automated invoice/payment billing integration
- Multilingual/RTL PDF (HTML print supports RTL)

## Integration notes (Business Operations Suite — Architecture Approved)

- Billing hold remains an **operational** release control based on MOD-10 invoice dues.
- Future MOD-33 accounting integration must **not** bypass MOD-24 release blocking / billing-hold controls.
- Accounting posting of invoices/payments is a MOD-10 → MOD-33 adapter concern, separate from release eligibility.

## QC

Automated: PASS | Manual: NOT TESTED | Production: Pending Manual QC

## Migrations

| Migration | Notes |
| --- | --- |
| `20260724260000_mod24_report_release` | Creates release/version/delivery tables and `RELEASE_*` lab-result enum labels |
| `20260724130000_mod24_release_polish` | Tenant policy flags + conditional polish (safe when release tables are absent) |
| `20260724261000_mod24_release_polish_deferred` | Idempotent polish after report-release create (holds + `state_version` + clinical cleanup) |

Ordering repair details and QC recovery commands: `docs/modules/MOD-24-Migration-Notes.md`.

See also: `docs/modules/MOD-24-Report-Release-Delivery-Architecture-Audit.md`
