# Manual QC Guide — MOD-24 Report Release & Delivery v1.0

## Preconditions

- MOD-21/22/23 workflow complete with at least one `VERIFIED` result
- Login as REPORT_OFFICER or LAB_SUPERVISOR (or TENANT_ADMIN)

## Test cases

1. Open `/lab/report-release` — verified result appears in queue
2. Prepare release — status becomes release pending
3. Authorize release — report number `RPT-` allocated, portal eligible flag set
4. Open print view — HTML report renders patient/test/results sections
5. Download PDF — file opens as valid PDF
6. Reprint — requires reason, reprint audit recorded
7. Publish portal flag — `portalPublishedAt` set (MOD-30 handoff only)
8. Public QR verify — `/verify/report/[token]` shows report number and validity only
9. Withdraw released report — token revoked, status withdrawn
10. Amendment — new version draft, re-authorize release

## Credentials

See `docs/AI-QC/manual-qc/.local/001-QC-Credentials.txt`
