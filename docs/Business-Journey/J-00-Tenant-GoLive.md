# J-00 - Tenant Go-Live Journey

> **Historical pre-implementation baseline.** The FAIL / BLOCKED findings below describe the browser state captured before MOD-00 was completed. They are retained as gap-analysis evidence and are superseded by the production-readiness tutorial and 34-screen UAT record in `J-00-Tenant-Onboarding-and-User-Management.md`.

**Current journey verdict:** PASS — `READY_FOR_FIRST_PATIENT` at 100%  
**Baseline verdict recorded below:** FAIL / BLOCKED  
**Browser review date:** 2026-08-02  
**Tenant:** Doctors Point Diagnostic Center (`DPDC`)  
**Branch:** Doctors Point Diagnostic Center - Bhola Main Branch (`BR-BHL-01`)  
**Evidence:** `docs/Business-Journey/evidence/J-00/README.md`

## Business objective

Take an active, host-created tenant from administrator credentials to a browser-proven **READY FOR FIRST PATIENT** state. J-00 is a tenant administrator tutorial, not a seed-data or developer workflow.

## Result at a glance

DPDC's existing configuration is sufficient to support the already-proven J-01 patient journey. The tenant administrator successfully logged in and reviewed the available setup pages at 1920x1080. The DPDC regression verifier passed the configured state. J-00 itself remains blocked because several required setup actions do not have browser surfaces and the application does not expose a readiness checklist or final readiness status.

## Chapter results

| Chapter | Browser route/evidence | Verified outcome | Status |
|---|---|---|---|
| 1. Tenant Admin Login | `/login`, `/dashboard`; J00-01/02 | `dp.tenant.admin` authenticated in DPDC/BR-BHL-01 | PASS |
| 2. Company Configuration | Report layout page only; J00-14 | No tenant-admin company profile page for logo, address, contact, working hours, invoice/report footer, barcode prefix or QR settings | BLOCKED |
| 3. Branch Setup | `/settings/branches` and branch detail; J00-03/04 | Existing default active diagnostic branch verified; it was not created during this run | REVIEW PASS / CREATION NOT PROVEN |
| 4. Department Setup | No department-management route | 12 required operating departments exist by read-only regression verification; browser creation is unavailable | BLOCKED |
| 5. User Roles | `/settings/roles`; J00-05 | Built-in tenant roles and permission access are reviewable | PASS |
| 6. Create Users | `/settings/users`; J00-06 | 18 active branch-scoped users exist, including all requested operational roles; individual browser creation in this run is not proven | REVIEW PASS / CREATION NOT PROVEN |
| 7. Doctor Setup | `/settings/doctors`, `/settings/doctor-schedules`; J00-07/08 | 3 doctors and 12 published consultation shifts verified | PASS FOR EXISTING CONFIGURATION |
| 8. Diagnostic Catalog | `/settings/service-catalog`, `/settings/services`; J00-09/10 | 15 priced branch services include CBC, ESR, RBS, electrolytes, TSH and Free T4 | PASS |
| 9. Reference Ranges | `/settings/test-parameters`; J00-11 | 21 seeded reference rows exist, including adult/sex/paediatric coverage; several are explicitly provisional UAT ranges | CONDITIONAL PASS |
| 10. Analyzer | `/settings/analyzers`; J00-12 | 4 analyzers assigned to Bhola with 15 machine-code mappings | PASS |
| 11. LIS | Analyzer setup and J-01 LIS worklist only | Parsing/mapping/idempotency are verified, but no browser page configures a live LIS endpoint/connection | BLOCKED |
| 12. Patient Portal | `/settings/patient-portal`; J00-13 | Portal administration, enrollment and released-report download work; no tenant-level enable/notification/download policy switches | CONDITIONAL PASS |
| 13. Operational Readiness | `/dashboard`; J00-16 | Operational dashboard loads, but there is no readiness checklist or `READY FOR FIRST PATIENT` indicator | BLOCKED |

## Existing operational inventory

- Departments: **12**
- Tenant users: **18**
- Doctors: **3**
- Published doctor shifts: **12**
- Priced services: **15**
- Reference-range rows: **21**
- Analyzers: **4**
- LIS machine mappings: **15**
- Seeded portal accounts: **7**, plus the approved J-01 enrollment
- Audit Center: **381** tenant-scoped records at capture time

## Requested user coverage

The existing user list includes Tenant Admin, Reception, Billing, Cash, Collection, Haematology Technician, Biochemistry Technician, Hormone Technician, Electrolyte Technician, Clinical Pathology Technician, Report Entry, Verification Doctor, Report Delivery, Branch Admin, Hold Officer and LIS Reconciliation, plus two consultant doctors. No duplicate users were created for screenshot purposes.

## Catalog and reference-range note

CBC, ESR, Random Blood Sugar, Serum Electrolytes, TSH and Free T4 are priced and assigned to their laboratory departments. The reference-range seed explicitly labels ESR, RBS, TSH, Free T4 and parts of electrolyte/paediatric coverage as UAT-only or configuration gaps where approved clinical sources are absent. They must receive clinical governance approval before production use.

## Missing features blocking J-00

1. Tenant-admin company profile and branding configuration.
2. Tenant-admin department management.
3. Consolidated working-hours management for company and branch.
4. Central invoice/report footer, barcode-prefix and QR-policy configuration.
5. Browser-configurable LIS connection/endpoints, credentials and connection test.
6. Tenant-level portal enablement, notification and download policy switches.
7. Operational readiness checklist with evidence links and blocking rules.
8. Final, auditable `READY FOR FIRST PATIENT` status.
9. A browser onboarding wizard that records completion of each required setup item.

## Exit decision

**J-00 is not READY FOR FIRST PATIENT as a browser-proven onboarding journey.** DPDC is operational for the pilot and J-01 passed, but this request requires the setup itself to be completed and evidenced in the browser. That standard cannot be met until the missing configuration and readiness surfaces exist.
