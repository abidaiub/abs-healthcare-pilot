# Manual QC Guide — MOD-24 Report Release & Delivery v1.1

**Status: NOT TESTED** — execute in browser and attach evidence before marking pass.

## Preconditions

- MOD-21/22/23 workflow complete with at least one `VERIFIED` result
- Tenant policy flags available on tenant record (billing/critical ack)
- Credentials: `docs/AI-QC/manual-qc/.local/001-QC-Credentials.txt`

## Core cases (v1.0 carry-forward)

1. Release queue shows verified results
2. Prepare → `LabReportRelease` pending; `LabResult` remains verified
3. Authorize → `RPT-` number, snapshot version, QR token
4. HTML print includes QR image
5. PDF download includes QR image and opens correctly
6. Reprint requires reason
7. Portal publish flag
8. Public QR verify — no PHI
9. Withdraw revokes QR
10. Amendment re-release

## v1.1 polish cases

11. Billing hold enabled (tenant policy) blocks authorize; disabled allows (hold cleared)
12. Quality hold add blocks; clear allows
13. Critical acknowledgment pending blocks when policy enabled
14. Two-browser concurrent authorize — second attempt fails with state changed
15. REPORT_OFFICER can authorize
16. LAB_TECH authorize denied
17. RECEPTION print-only (no authorize)
18. TENANT_ADMIN without explicit clinical release permission denied
19. QR scan from printed HTML
20. QR scan from downloaded PDF
21. Withdrawn QR invalid
22. Superseded-version QR marked invalid/superseded
23. Bangla HTML print layout
24. Arabic/Urdu RTL HTML print
25. Hindi HTML print
26. Long multi-page report — QR not clipped
27. Cross-tenant IDOR
28. Cross-branch IDOR
29. Portal publish after valid release
30. Withdrawal removes portal visibility

## Result template

Use `docs/AI-QC/manual-qc/results/024-Report-Release-Delivery-Manual-QC-Result-Template-v1.1.md`
