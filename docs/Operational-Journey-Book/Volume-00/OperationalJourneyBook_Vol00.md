# ABSHealthcareLite Operational Journey Book

## Volume 00 - Tenant Go Live

### From Active Subscription to First-Patient Readiness

**Browser Review Complete. Readiness Journey Blocked.**

## Opening story

The Host has created Doctors Point Diagnostic Center and activated its subscription. The Tenant Administrator receives credentials and enters the Bhola Main Branch workspace. Their responsibility is simple to state and difficult to prove: make every operational dependency ready before the first patient arrives.

This volume follows the available setup surfaces honestly. It shows what the administrator can verify today, what is already configured for the pilot, and what the product must add before tenant onboarding can become a complete browser-driven operational journey.

## Chapter 1 - Tenant Administrator Login

The administrator selects DPDC, enters the assigned credentials and lands in the BR-BHL-01 workspace. The system establishes tenant and branch context and records the login in the Audit Center.

Evidence: J00-01, J00-02, J00-15. Status: **PASS**.

## Chapter 2 - Company Configuration

Report layout configuration exists, but the administrator cannot manage the complete company information, logo, address, phone, email, working hours, footer text, barcode prefix and QR policy from one tenant-owned profile.

Evidence: J00-14. Status: **BLOCKED**.

## Chapter 3 - Branch Setup

The existing default Bhola Main Branch is active, typed as a diagnostic center and assigned to 18 users. The browser can review and manage branch data, but this run did not create a duplicate branch.

Evidence: J00-03, J00-04. Status: **REVIEW PASS**.

## Chapter 4 - Departments

The verified tenant contains 12 operating departments. There is no tenant department-management page, so creation and editing cannot be taught or evidenced in the browser.

Status: **BLOCKED**.

## Chapter 5 - Roles

Roles and permissions can be reviewed and maintained. Separation of duties is independently regression-tested: result entry cannot verify or release, verification cannot release, and report delivery cannot verify.

Evidence: J00-05. Status: **PASS**.

## Chapter 6 - Users

The tenant has 18 branch-scoped users covering every required operating role. The browser list proves the inventory; their original creation happened before J-00 and is not re-enacted by creating duplicates.

Evidence: J00-06. Status: **REVIEW PASS; CREATION NOT PROVEN**.

## Chapter 7 - Doctors

Three doctors and twelve published shifts are configured. This supports General Medicine consultation and independent pathology verification.

Evidence: J00-07, J00-08. Status: **PASS FOR EXISTING CONFIGURATION**.

## Chapter 8 - Diagnostic Catalog

Fifteen services are imported, priced in BDT and assigned to branch laboratory sections. Required services include CBC, ESR, Random Blood Sugar, Serum Electrolytes, TSH and Free T4.

Evidence: J00-09, J00-10. Status: **PASS**.

## Chapter 9 - Reference Ranges

Twenty-one reference rows cover the pilot scenarios. Some rows are explicitly provisional because an approved clinical source was not available. A production go-live must require clinical governance approval, not simply the presence of a numeric range.

Evidence: J00-11. Status: **CONDITIONAL PASS**.

## Chapter 10 - Analyzer

Four analyzers and fifteen machine test-code mappings belong to Bhola Main Branch. The mapping layer supports traceable LIS imports.

Evidence: J00-12. Status: **PASS**.

## Chapter 11 - LIS

The pilot parses HL7, ASTM and API payloads, enforces control-ID idempotency and maps analyzer observations. It lacks a tenant-admin browser page for connection endpoints, credentials, connectivity testing and live connection state.

Status: **BLOCKED**.

## Chapter 12 - Patient Portal

The administrator can enroll and manage patient accounts, and J-01 proves released-report download. Tenant-level enablement, notification and download-policy settings are not exposed.

Evidence: J00-13. Status: **CONDITIONAL PASS**.

## Chapter 13 - Operational Readiness

The dashboard shows a functioning diagnostic operation, but not a setup checklist. Searching the live page found no `READY FOR FIRST PATIENT` indicator. The journey therefore stops one step short of its contractual ending.

Evidence: J00-16. Status: **BLOCKED**.

## Final decision

DPDC is a proven pilot tenant and can serve the J-01 workflow. Volume 00 cannot call the onboarding journey complete until the missing setup surfaces and readiness gate are implemented and run in the browser.
