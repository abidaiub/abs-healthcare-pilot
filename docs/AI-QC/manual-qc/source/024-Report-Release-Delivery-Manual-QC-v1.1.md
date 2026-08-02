# ABSHealthcareLite Manual Quality Control and UAT Guide
## MOD-24 — Report Release & Delivery

| Document control | Value |
|---|---|
| Module ID | MOD-24 |
| Module name | Report Release & Delivery |
| Document version | 1.1 |
| Document status | NOT TESTED |
| Prepared date | 24 July 2026 |
| Prepared by | ABSHealthcareLite Development / AI QC Handoff |
| Environment | QC Docker (non-production) |
| Intended audience | Independent QC engineers and UAT representatives |
| Classification | Internal QC / UAT working document |

> **Status: NOT TESTED** — execute in browser and attach evidence before marking pass.

---

## Preconditions

- MOD-21/22/23 workflow complete with at least one `VERIFIED` result
- Tenant policy flags available on tenant record (billing/critical ack)
- Credentials: `docs/AI-QC/manual-qc/.local/001-QC-Credentials.txt`

## Result template reference

Use `docs/AI-QC/manual-qc/results/024-Report-Release-Delivery-Manual-QC-Result-Template-v1.1.md`

---

## Core cases (v1.0 carry-forward)

### Test Case 1 — Release queue shows verified results

| Field | Content |
|---|---|
| Test Case ID | MOD24-001 |
| Test Case | 1. Release queue shows verified results |
| Objective | Confirm verified laboratory results appear on the report release worklist. |
| Steps | |
| | 1. Log in as REPORT_OFFICER or LAB_SUPERVISOR. |
| | 2. Open `/lab/report-release`. |
| | 3. Locate a result with clinical status verified and no competing release block. |
| Expected Result | Release queue shows verified results |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 2 — Prepare release — clinical state unchanged

| Field | Content |
|---|---|
| Test Case ID | MOD24-002 |
| Test Case | 2. Prepare → `LabReportRelease` pending; `LabResult` remains verified |
| Objective | Prepare a release record without mutating clinical verification state. |
| Steps | |
| | 1. From the worklist, choose a verified result and click Prepare release. |
| | 2. Confirm `LabReportRelease` moves to release pending. |
| | 3. Inspect the linked `LabResult` clinical status. |
| Expected Result | Prepare → `LabReportRelease` pending; `LabResult` remains verified |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 3 — Authorize release

| Field | Content |
|---|---|
| Test Case ID | MOD24-003 |
| Test Case | 3. Authorize → `RPT-` number, snapshot version, QR token |
| Objective | Authorize release and allocate immutable report artifacts. |
| Steps | |
| | 1. Open the pending release detail screen. |
| | 2. Authorize release with matching record version. |
| | 3. Review allocated report number, snapshot version, and verification token. |
| Expected Result | Authorize → `RPT-` number, snapshot version, QR token |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 4 — HTML print includes QR image

| Field | Content |
|---|---|
| Test Case ID | MOD24-004 |
| Test Case | 4. HTML print includes QR image |
| Objective | Verify printable HTML embeds a scannable QR image. |
| Steps | |
| | 1. Open print view for a released report. |
| | 2. Inspect the verification footer block. |
| | 3. Confirm QR image and verification URL are visible. |
| Expected Result | HTML print includes QR image |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 5 — PDF download includes QR image

| Field | Content |
|---|---|
| Test Case ID | MOD24-005 |
| Test Case | 5. PDF download includes QR image and opens correctly |
| Objective | Verify downloaded PDF contains embedded QR and opens correctly. |
| Steps | |
| | 1. Download PDF from release detail. |
| | 2. Open the file in a PDF viewer. |
| | 3. Confirm QR image is present and file is valid. |
| Expected Result | PDF download includes QR image and opens correctly |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 6 — Reprint requires reason

| Field | Content |
|---|---|
| Test Case ID | MOD24-006 |
| Test Case | 6. Reprint requires reason |
| Objective | Validate reprint governance and audit capture. |
| Steps | |
| | 1. Print a released report once. |
| | 2. Attempt a second print without a reason. |
| | 3. Provide reprint reason and print again. |
| Expected Result | Reprint requires reason |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 7 — Portal publish flag

| Field | Content |
|---|---|
| Test Case ID | MOD24-007 |
| Test Case | 7. Portal publish flag |
| Objective | Confirm portal publish flag is set for MOD-30 handoff. |
| Steps | |
| | 1. Authorize a valid release. |
| | 2. Publish portal flag from release detail. |
| | 3. Verify portal publish timestamp/eligibility state. |
| Expected Result | Portal publish flag |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 8 — Public QR verify — no PHI

| Field | Content |
|---|---|
| Test Case ID | MOD24-008 |
| Test Case | 8. Public QR verify — no PHI |
| Objective | Verify public token page exposes no protected health information. |
| Steps | |
| | 1. Copy verification URL or scan QR from released report. |
| | 2. Open `/verify/report/[token]` without authentication. |
| | 3. Review response fields only. |
| Expected Result | Public QR verify — no PHI |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 9 — Withdraw revokes QR

| Field | Content |
|---|---|
| Test Case ID | MOD24-009 |
| Test Case | 9. Withdraw revokes QR |
| Objective | Confirm withdrawal revokes active verification tokens. |
| Steps | |
| | 1. Withdraw a released report with reason. |
| | 2. Retry public verification using prior QR/token. |
| Expected Result | Withdraw revokes QR |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 10 — Amendment re-release

| Field | Content |
|---|---|
| Test Case ID | MOD24-010 |
| Test Case | 10. Amendment re-release |
| Objective | Validate amendment workflow and re-authorization. |
| Steps | |
| | 1. Initiate amendment on a released report with reason. |
| | 2. Re-authorize amended release. |
| | 3. Confirm new version and token behavior. |
| Expected Result | Amendment re-release |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

## v1.1 polish cases

### Test Case 11 — Billing hold policy enforcement

| Field | Content |
|---|---|
| Test Case ID | MOD24-011 |
| Test Case | 11. Billing hold enabled (tenant policy) blocks authorize; disabled allows (hold cleared) |
| Objective | Validate billing hold blocking when tenant policy is enabled. |
| Steps | |
| | 1. Enable tenant billing clearance policy. |
| | 2. Add manual billing hold on release record. |
| | 3. Attempt authorize; then clear hold and retry with policy disabled if required. |
| Expected Result | Billing hold enabled (tenant policy) blocks authorize; disabled allows (hold cleared) |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 12 — Quality hold add and clear

| Field | Content |
|---|---|
| Test Case ID | MOD24-012 |
| Test Case | 12. Quality hold add blocks; clear allows |
| Objective | Validate quality hold blocks release until cleared. |
| Steps | |
| | 1. Add quality hold with reason as authorized supervisor. |
| | 2. Attempt authorize while hold is active. |
| | 3. Clear hold and retry authorize. |
| Expected Result | Quality hold add blocks; clear allows |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 13 — Critical acknowledgment policy

| Field | Content |
|---|---|
| Test Case ID | MOD24-013 |
| Test Case | 13. Critical acknowledgment pending blocks when policy enabled |
| Objective | Validate critical-result acknowledgment blocking when policy enabled. |
| Steps | |
| | 1. Enable tenant critical acknowledgment policy. |
| | 2. Use a result with unacknowledged critical event. |
| | 3. Attempt authorize; complete acknowledgment and retry if applicable. |
| Expected Result | Critical acknowledgment pending blocks when policy enabled |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 14 — Concurrent authorize

| Field | Content |
|---|---|
| Test Case ID | MOD24-014 |
| Test Case | 14. Two-browser concurrent authorize — second attempt fails with state changed |
| Objective | Prevent duplicate authorization under concurrent browser use. |
| Steps | |
| | 1. Open the same pending release in two browsers/sessions. |
| | 2. Authorize in browser A. |
| | 3. Attempt authorize in browser B without refresh. |
| Expected Result | Two-browser concurrent authorize — second attempt fails with state changed |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 15 — REPORT_OFFICER authorization

| Field | Content |
|---|---|
| Test Case ID | MOD24-015 |
| Test Case | 15. REPORT_OFFICER can authorize |
| Objective | Confirm REPORT_OFFICER can authorize release. |
| Steps | |
| | 1. Log in as REPORT_OFFICER. |
| | 2. Prepare and authorize a valid release. |
| Expected Result | REPORT_OFFICER can authorize |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 16 — LAB_TECH authorization denial

| Field | Content |
|---|---|
| Test Case ID | MOD24-016 |
| Test Case | 16. LAB_TECH authorize denied |
| Objective | Confirm lab technician cannot authorize release. |
| Steps | |
| | 1. Log in as LAB_TECH. |
| | 2. Attempt authorize on a pending release. |
| Expected Result | LAB_TECH authorize denied |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 17 — RECEPTION print-only

| Field | Content |
|---|---|
| Test Case ID | MOD24-017 |
| Test Case | 17. RECEPTION print-only (no authorize) |
| Objective | Confirm reception role cannot authorize but may print released reports. |
| Steps | |
| | 1. Log in as RECEPTION. |
| | 2. Verify authorize action is unavailable or denied. |
| | 3. Print a released report if granted print permission. |
| Expected Result | RECEPTION print-only (no authorize) |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 18 — TENANT_ADMIN clinical release denial

| Field | Content |
|---|---|
| Test Case ID | MOD24-018 |
| Test Case | 18. TENANT_ADMIN without explicit clinical release permission denied |
| Objective | Confirm tenant admin without explicit clinical permission cannot authorize. |
| Steps | |
| | 1. Log in as TENANT_ADMIN after RBAC seed/policy review. |
| | 2. Attempt authorize release. |
| Expected Result | TENANT_ADMIN without explicit clinical release permission denied |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 19 — QR scan from printed HTML

| Field | Content |
|---|---|
| Test Case ID | MOD24-019 |
| Test Case | 19. QR scan from printed HTML |
| Objective | Validate QR scanned from HTML print resolves to public verify page. |
| Steps | |
| | 1. Print/open HTML report with QR. |
| | 2. Scan QR with mobile device or camera. |
| | 3. Confirm landing on trusted verification URL. |
| Expected Result | QR scan from printed HTML |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 20 — QR scan from downloaded PDF

| Field | Content |
|---|---|
| Test Case ID | MOD24-020 |
| Test Case | 20. QR scan from downloaded PDF |
| Objective | Validate QR scanned from PDF resolves correctly. |
| Steps | |
| | 1. Download released report PDF. |
| | 2. Scan embedded QR code. |
| | 3. Confirm verification response. |
| Expected Result | QR scan from downloaded PDF |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 21 — Withdrawn QR invalid

| Field | Content |
|---|---|
| Test Case ID | MOD24-021 |
| Test Case | 21. Withdrawn QR invalid |
| Objective | Confirm withdrawn report QR/token fails verification. |
| Steps | |
| | 1. Withdraw a released report. |
| | 2. Scan prior QR or open prior verification URL. |
| Expected Result | Withdrawn QR invalid |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 22 — Superseded-version QR

| Field | Content |
|---|---|
| Test Case ID | MOD24-022 |
| Test Case | 22. Superseded-version QR marked invalid/superseded |
| Objective | Confirm superseded version token is marked invalid/superseded. |
| Steps | |
| | 1. Authorize amended release creating new current version. |
| | 2. Verify using prior version QR/token. |
| Expected Result | Superseded-version QR marked invalid/superseded |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 23 — Bangla HTML print layout

| Field | Content |
|---|---|
| Test Case ID | MOD24-023 |
| Test Case | 23. Bangla HTML print layout |
| Objective | Validate Bangla locale HTML print layout readability. |
| Steps | |
| | 1. Switch locale to bn-BD. |
| | 2. Open HTML print view for released report. |
| Expected Result | Bangla HTML print layout |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 24 — Arabic/Urdu RTL HTML print

| Field | Content |
|---|---|
| Test Case ID | MOD24-024 |
| Test Case | 24. Arabic/Urdu RTL HTML print |
| Objective | Validate RTL HTML print direction and layout. |
| Steps | |
| | 1. Switch locale to ar-SA or ur-PK. |
| | 2. Open HTML print view and inspect direction/layout. |
| Expected Result | Arabic/Urdu RTL HTML print |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 25 — Hindi HTML print layout

| Field | Content |
|---|---|
| Test Case ID | MOD24-025 |
| Test Case | 25. Hindi HTML print layout |
| Objective | Validate Hindi locale HTML print layout readability. |
| Steps | |
| | 1. Switch locale to hi-IN. |
| | 2. Open HTML print view for released report. |
| Expected Result | Hindi HTML print layout |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 26 — Long multi-page report QR placement

| Field | Content |
|---|---|
| Test Case ID | MOD24-026 |
| Test Case | 26. Long multi-page report — QR not clipped |
| Objective | Ensure QR block is not clipped on multi-page reports. |
| Steps | |
| | 1. Use a long multi-parameter report. |
| | 2. Print preview across multiple pages. |
| | 3. Inspect QR footer placement. |
| Expected Result | Long multi-page report — QR not clipped |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 27 — Cross-tenant IDOR

| Field | Content |
|---|---|
| Test Case ID | MOD24-027 |
| Test Case | 27. Cross-tenant IDOR |
| Objective | Prevent cross-tenant release access by identifier manipulation. |
| Steps | |
| | 1. Log in to tenant A. |
| | 2. Attempt to access tenant B release ID/URL directly. |
| Expected Result | Cross-tenant IDOR |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 28 — Cross-branch IDOR

| Field | Content |
|---|---|
| Test Case ID | MOD24-028 |
| Test Case | 28. Cross-branch IDOR |
| Objective | Prevent unauthorized cross-branch release access. |
| Steps | |
| | 1. Log in with branch-scoped user. |
| | 2. Attempt to access another branch release record. |
| Expected Result | Cross-branch IDOR |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 29 — Portal publish after valid release

| Field | Content |
|---|---|
| Test Case ID | MOD24-029 |
| Test Case | 29. Portal publish after valid release |
| Objective | Confirm portal publish succeeds only after valid release. |
| Steps | |
| | 1. Authorize valid release. |
| | 2. Publish portal flag. |
| Expected Result | Portal publish after valid release |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

### Test Case 30 — Withdrawal removes portal visibility

| Field | Content |
|---|---|
| Test Case ID | MOD24-030 |
| Test Case | 30. Withdrawal removes portal visibility |
| Objective | Confirm withdrawal removes portal publish eligibility/visibility handoff. |
| Steps | |
| | 1. Publish portal flag for released report. |
| | 2. Withdraw release. |
| | 3. Verify portal visibility/eligibility state. |
| Expected Result | Withdrawal removes portal visibility |
| Actual Result | |
| Status | NOT RUN |
| Evidence | |
| Tester | |
| Date | |
| Remarks | |

---

## Appendix A — Test Evidence

| Test Case ID | Evidence file / link | Captured by | Date |
|---|---|---|---|
| MOD24-001 | | | |
| MOD24-002 | | | |
| MOD24-003 | | | |
| MOD24-004 | | | |
| MOD24-005 | | | |
| MOD24-006 | | | |
| MOD24-007 | | | |
| MOD24-008 | | | |
| MOD24-009 | | | |
| MOD24-010 | | | |
| MOD24-011 | | | |
| MOD24-012 | | | |
| MOD24-013 | | | |
| MOD24-014 | | | |
| MOD24-015 | | | |
| MOD24-016 | | | |
| MOD24-017 | | | |
| MOD24-018 | | | |
| MOD24-019 | | | |
| MOD24-020 | | | |
| MOD24-021 | | | |
| MOD24-022 | | | |
| MOD24-023 | | | |
| MOD24-024 | | | |
| MOD24-025 | | | |
| MOD24-026 | | | |
| MOD24-027 | | | |
| MOD24-028 | | | |
| MOD24-029 | | | |
| MOD24-030 | | | |

## Appendix B — Screenshots

| Test Case ID | Screenshot file | Description |
|---|---|---|
| MOD24-001 | _placeholder_ | |
| MOD24-002 | _placeholder_ | |
| MOD24-003 | _placeholder_ | |
| MOD24-004 | _placeholder_ | |
| MOD24-005 | _placeholder_ | |
| MOD24-006 | _placeholder_ | |
| MOD24-007 | _placeholder_ | |
| MOD24-008 | _placeholder_ | |
| MOD24-009 | _placeholder_ | |
| MOD24-010 | _placeholder_ | |
| MOD24-011 | _placeholder_ | |
| MOD24-012 | _placeholder_ | |
| MOD24-013 | _placeholder_ | |
| MOD24-014 | _placeholder_ | |
| MOD24-015 | _placeholder_ | |
| MOD24-016 | _placeholder_ | |
| MOD24-017 | _placeholder_ | |
| MOD24-018 | _placeholder_ | |
| MOD24-019 | _placeholder_ | |
| MOD24-020 | _placeholder_ | |
| MOD24-021 | _placeholder_ | |
| MOD24-022 | _placeholder_ | |
| MOD24-023 | _placeholder_ | |
| MOD24-024 | _placeholder_ | |
| MOD24-025 | _placeholder_ | |
| MOD24-026 | _placeholder_ | |
| MOD24-027 | _placeholder_ | |
| MOD24-028 | _placeholder_ | |
| MOD24-029 | _placeholder_ | |
| MOD24-030 | _placeholder_ | |

## Appendix C — Known Limitations

- Automated invoice/payment billing integration is deferred; manual billing hold + tenant policy only.
- PDF output is Latin/Helvetica; multilingual and RTL PDF are not supported (use HTML print for Bangla/Arabic/Urdu/Hindi).
- Existing database TENANT_ADMIN permissions may retain clinical release rights until RBAC re-seed.
- Patient portal UI remains MOD-30 scope; MOD-24 sets portal publish flag only.
- WhatsApp, email, and SMS dispatch are out of scope for this pilot.

## Appendix D — Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Reviewer | | | |
| QA Lead | | | |
| Date | | | |
| Signature | | | |
