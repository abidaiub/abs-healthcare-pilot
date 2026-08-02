# J-00 Tenant Go-Live Browser Evidence

**Viewport:** 1920x1080  
**Tenant:** DPDC  
**Branch:** BR-BHL-01  
**Verdict:** FAIL / BLOCKED - existing configuration reviewed; complete browser onboarding is not available.

| Evidence | Route | What it proves | QC |
|---|---|---|---|
| `01-tenant-admin-login.png` | `/login` | Tenant/branch staff login surface | PASS |
| `02-tenant-admin-dashboard.png` | `/dashboard` | Authenticated tenant and branch context | PASS |
| `03-branch-setup.png` | `/settings/branches` | Active default Bhola diagnostic branch and assigned users | PASS |
| `04-branch-detail.png` | `/settings/branches/{id}` | Existing branch detail and assignments | PASS |
| `05-user-roles.png` | `/settings/roles` | Tenant role-management surface | PASS |
| `06-users.png` | `/settings/users` | Existing DPDC user inventory | PASS |
| `07-doctors.png` | `/settings/doctors` | Existing doctor master | PASS |
| `08-doctor-schedules.png` | `/settings/doctor-schedules` | Published availability/schedules | PASS |
| `09-diagnostic-catalog.png` | `/settings/service-catalog` | Host diagnostic services available for tenant import | PASS |
| `10-imported-services-prices.png` | `/settings/services` | Tenant services, prices and departments | PASS |
| `11-reference-ranges.png` | `/settings/test-parameters` | Parameter and reference-range setup surface | CONDITIONAL PASS |
| `12-analyzers.png` | `/settings/analyzers` | Analyzer and mapping setup | PASS |
| `13-patient-portal.png` | `/settings/patient-portal` | Portal administration and patient enrollment | CONDITIONAL PASS |
| `14-report-layouts.png` | `/settings/report-layouts` | Report layout configuration; not a complete company-profile screen | PARTIAL |
| `15-audit-center.png` | `/settings/audit` | Tenant-scoped logins and operational changes | PASS |
| `16-readiness-dashboard.png` | `/dashboard` | Operational dashboard; no readiness indicator exists | FAIL - GAP |

## Evidence integrity

All 16 PNGs were captured from the in-app browser at the requested 1920x1080 viewport. No screenshot was invented, cropped or altered. Existing records were reviewed rather than duplicated. `npm run verify:dpdc` supplied read-only inventory/regression proof and passed.

## Not evidenced because no browser surface exists

Company profile/branding, department creation, live LIS connection configuration, tenant-level portal switches and an auditable readiness gate. These are recorded as product gaps rather than silently skipped.
