# ABSHealthcareLite Pilot — Docker QC Guide

**Document version:** 1.0  
**Date:** 20 June 2026  
**Environment:** Docker deployment on LAN server  
**Application:** ABSHealthcareLite Pilot  

---

## 1. Deployment Status

| Item | Status |
| --- | --- |
| Docker stack | **Running** |
| App URL | http://192.168.2.44:3000 |
| Host login | http://192.168.2.44:3000/host/login |
| Tenant login | http://192.168.2.44:3000/login |
| pgAdmin | http://192.168.2.44:8081 |
| Health check | http://192.168.2.44:3000/api/health |
| Database | PostgreSQL 16 (container `abs-healthcare-pilot-db`) |
| App container | `abs-healthcare-pilot-app` |

### Pre-QC verification

Run these checks before functional QC:

1. Open http://192.168.2.44:3000/api/health — expect JSON with `"status": "ok"` and `"database": "connected"`.
2. Confirm Docker containers are up:
   ```powershell
   docker ps --filter name=abs-healthcare-pilot
   ```
3. Confirm database seed has been applied (see [Section 13 — Known Pending Issues](#13-known-pending-issues)). Docker entrypoint runs migrations only; seed is **not** automatic.

---

## 2. Docker Server Details

### 2.1 Services (`docker-compose.yml`)

| Service | Container name | Image / build | Host port | Internal port |
| --- | --- | --- | --- | --- |
| `postgres` | `abs-healthcare-pilot-db` | `postgres:16-alpine` | 5432 (default) | 5432 |
| `app` | `abs-healthcare-pilot-app` | Built from `Dockerfile` | 3000 (default) | 3000 |

### 2.2 Default environment variables

| Variable | Default value | Purpose |
| --- | --- | --- |
| `POSTGRES_USER` | `abshealthcare` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `abshealthcare_dev` | PostgreSQL password |
| `POSTGRES_DB` | `abs_healthcare_pilot` | Database name |
| `POSTGRES_PORT` | `5432` | Host port for PostgreSQL |
| `APP_PORT` | `3000` | Host port for Next.js app |
| `NEXT_PUBLIC_APP_NAME` | `ABSHealthcareLite Pilot` | UI display name |
| `NEXT_PUBLIC_SAMPLE_TENANT` | `Al Baraka Medical Group` | Sample tenant label |
| `NEXT_PUBLIC_SAMPLE_BRANCH` | `Dhaka Central Hospital` | Sample branch label |
| `DATABASE_URL` | `postgresql://abshealthcare:abshealthcare_dev@postgres:5432/abs_healthcare_pilot?schema=public` | Prisma connection (inside Docker network) |

### 2.3 App startup sequence (`scripts/docker-entrypoint.sh`)

1. `npx prisma migrate deploy` — applies pending migrations  
2. `node server.js` — starts Next.js production server  

**Note:** `npm run db:seed` is **not** invoked at container startup.

### 2.4 Dockerfile summary

- Base: `node:20-alpine`
- Multi-stage build: deps → builder → runner
- Runs as non-root user `nextjs`
- Exposes port `3000`, binds `0.0.0.0`
- Includes Prisma client, migrations, and PostgreSQL driver for runtime DB access

### 2.5 pgAdmin (external to repo compose file)

pgAdmin is reachable at http://192.168.2.44:8081 but is **not** defined in this repository’s `docker-compose.yml`. It is assumed to be installed separately on the Docker host.

**Suggested PostgreSQL server registration in pgAdmin:**

| Field | Value |
| --- | --- |
| Host | `192.168.2.44` (or Docker host IP) |
| Port | `5432` |
| Maintenance database | `abs_healthcare_pilot` |
| Username | `abshealthcare` |
| Password | `abshealthcare_dev` |

pgAdmin login credentials are managed on the server; they are not stored in this repository.

---

## 3. Git Repository and Branch

| Item | Value |
| --- | --- |
| Remote | https://github.com/abidaiub/abs-healthcare-pilot.git |
| Branch | `main` |
| Latest commit (at doc creation) | `5884167` — *Initial clean ABS Healthcare Pilot repository* |

### Deploy from Git

```powershell
git clone https://github.com/abidaiub/abs-healthcare-pilot.git
cd abs-healthcare-pilot
docker compose up -d --build
docker compose exec app npx prisma db seed
```

---

## 4. Host Admin Login Credentials

> **Important:** Host authentication is a **mock session**. Passwords are **not validated** against the database. Any non-empty username and password will sign in.

| Field | Value |
| --- | --- |
| URL | http://192.168.2.44:3000/host/login |
| Username (placeholder) | `admin.abs` |
| Password | Any value (form field is required but not checked) |
| Session role | `Host Admin` |
| Employee code | `HOST-001` |
| Post-login redirect | `/host/dashboard` |

### Expected session identity

- If username is left blank, session name defaults to **Host Administrator**.
- If username is entered (e.g. `admin.abs`), that value becomes the displayed user name.

### Source references

- `src/components/login/HostLoginForm.tsx` — mock session, no password check  
- `src/lib/mock-session.ts` — builds host session with role `Host Admin`  
- `src/app/actions/auth.ts` — `TODO: Replace mock session with real authentication before production.`

---

## 5. Tenant Login Credentials

> **Important:** The active tenant login form (`TenantLoginForm`) uses a **mock session**. Username and password fields are required in the UI but are **not verified** against the `User` table.

| Field | Value |
| --- | --- |
| URL | http://192.168.2.44:3000/login |
| Tenant (from DB) | **Al Baraka Medical Group** (`ABMG`) |
| Branch (from DB) | **Dhaka Central Hospital** (`BR-DHK-01`) |
| Primary role | Select from dropdown (see [Section 8](#8-role-list)) |
| Username | Any value (placeholder: `rec_arif`) |
| Password | Any value (required in form, not validated) |
| Post-login redirect | `/dashboard` (all roles via current form handler) |
| Employee code in session | `MOCK-USER` |

### Legacy demo users (`loginAction` — not used by current tenant login UI)

These credentials exist in `src/lib/session.ts` as `DEMO_USERS` and are validated only if the deprecated `loginAction` server action is used directly:

| Username | Password | Display name | Role |
| --- | --- | --- | --- |
| `arif.hossain` | `demo` | Arif Hossain | Receptionist |
| `tania.sultana` | `demo` | Tania Sultana | Receptionist |
| `dr.shafiqul` | `demo` | Dr. Shafiqul Islam | Doctor |
| `admin` | `demo` | Syed Asif Iqbal | Administrator |

**QC note:** The current `/login` page uses `setTenantMockSessionAction`, not `loginAction`. For QC, treat tenant login as **role-based mock access**, not credential-based auth.

---

## 6. Default Usernames and Passwords for All Seeded Users

### 6.1 Database (`prisma/seed.ts` and seed modules)

The Prisma seed **does not create `User` or `Role` records**. The `User` model exists in schema (`prisma/schema.prisma`) but no users are inserted during seed.

**Seeded identity-related records:**

| Type | Code / ID | Name | Notes |
| --- | --- | --- | --- |
| Tenant contact | — | Syed Asif Iqbal | `admin@albarakamedical.com` |
| Doctor | `DR-MK-001` | Dr. Mahmuda Khatun | Pathology; reporting + verifying |
| Doctor | `DR-SR-002` | Dr. Sayed Rahman | Radiology; reporting |

Doctors have **no login credentials** in seed data.

### 6.2 Application mock/demo credentials summary

| Context | Username | Password | Validated? |
| --- | --- | --- | --- |
| Host login | Any (e.g. `admin.abs`) | Any | No |
| Tenant login (current UI) | Any (e.g. `rec_arif`) | Any | No |
| Legacy `DEMO_USERS` | See table in Section 5 | `demo` | Yes (only via `loginAction`) |

### 6.3 Mock SaaS primary admin (UI-only, not in DB seed)

From `src/lib/saas-foundation-data.ts` — used on host tenant management screens as sample data:

| Tenant | Primary admin | Email |
| --- | --- | --- |
| ABMG | Laila Hasan | `laila.hasan@albarakamedical.com` |
| CCHN | Moniruzzaman | `monir@citycarehospital.com` |
| MPD | Habibur Rahman | `habib@medplusdiag.com` |

These are **not** login accounts.

---

## 7. Tenant List

### 7.1 Database-seeded tenant (`prisma/seed.ts`)

| Code | Name | Type | Contact | Branch |
| --- | --- | --- | --- | --- |
| `ABMG` | Al Baraka Medical Group | MIXED | Syed Asif Iqbal — `admin@albarakamedical.com` | `BR-DHK-01` — Dhaka Central Hospital |

Address: 12/A Dhanmondi, Dhaka 1209, Bangladesh

### 7.2 Mock host-console tenants (`src/lib/saas-foundation-data.ts`)

Displayed on host SaaS screens; **not** seeded into PostgreSQL unless manually created:

| Code | Name | Status | Onboarding |
| --- | --- | --- | --- |
| `ABMG` | Al Baraka Medical Group | Active | Live |
| `CCHN` | CityCare Hospital Network | Trial | Provisioning |
| `MPD` | MedPlus Diagnostics | Suspended | Live |

**QC expectation:** Tenant login dropdown shows **DB tenants only**. After seed, expect **one tenant: ABMG**.

---

## 8. Role List

### 8.1 Tenant login roles (selectable at sign-in)

From `src/lib/navigation.ts` → `TENANT_PRIMARY_ROLES`:

| Role | Default home path (role-based routing) | Primary navigation |
| --- | --- | --- |
| Tenant Admin | `/settings/service-catalog` | Diagnostic Setup (settings) |
| Reception | `/dashboard` | Patient Registration, Search, Billing |
| Billing | `/diagnostic/billing` | Diagnostic Billing |
| Lab Technician | `/lab/sample-collection` | Sample Collection through Report Release |
| Doctor | `/dashboard` (form redirect) | Reception nav (fallback) |
| Report Delivery | `/lab/report-release` | Report Release |
| Patient Portal | `/portal/reports` | My Reports |

### 8.2 Legacy demo roles (`DEMO_USERS`)

| Role | Users |
| --- | --- |
| Receptionist | `arif.hossain`, `tania.sultana` |
| Doctor | `dr.shafiqul` |
| Administrator | `admin` |

### 8.3 Host role

| Role | Home path |
| --- | --- |
| Host Admin | `/host/dashboard` |

### 8.4 RBAC in database

`Role`, `UserRole`, and `Permission` models exist in Prisma schema but are **not seeded**. Role/permission management screens are UI-first; no persisted RBAC matrix is loaded from seed files.

---

## 9. Module-wise QC Checklist

Legend:

- **DB** — backed by PostgreSQL seed / queries  
- **Mock** — static or in-memory UI data  
- **Pass** — expected to work for pilot QC scope  
- **Partial** — UI loads; persistence or integration incomplete  
- **Fail** — known broken or missing for pilot  

### 9.1 Foundation / Host console

| Module | Code | Route(s) | Data source | QC focus | Expected |
| --- | --- | --- | --- | --- | --- |
| Platform Administration | MOD-01 | `/host/dashboard`, `/host/tenants`, `/host/settings` | Mock (`saas-foundation-data`) | KPI cards, tenant list, create-tenant form | **Pass** (UI) |
| User Management & RBAC | MOD-02 | (tenant settings — limited) | Schema only | No seeded users | **Partial** |
| Audit Center | MOD-04 | `/host/audit` | Mock audit entries | Search/filter UI | **Pass** (UI) |
| Subscription Packages | — | `/host/subscription-packages` | Mock | Package list and form | **Pass** (UI) |
| Module Registry | — | `/host/modules` | **DB** (`module_registry`) | 13 modules from seed | **Pass** (DB) |
| Host Test Catalog | MOD-10 | `/host/catalog` | **DB** + mock enrichment | Departments, categories, host services | **Pass** (DB) |

### 9.2 Master data / tenant setup

| Module | Code | Route(s) | Data source | QC focus | Expected |
| --- | --- | --- | --- | --- | --- |
| Service Catalog Import | MOD-10 | `/settings/service-catalog` | **DB** | Import host services to tenant | **Pass** (DB) |
| Imported Services | MOD-10 | `/settings/services` | **DB** | CBC, FBS, LIPID, XRCHEST pricing | **Pass** (DB) |
| Test Parameters | MOD-22 | `/settings/test-parameters` | **DB** | Parameters from imported CBC etc. | **Pass** (DB) |
| Sample Types | MOD-21 | `/settings/sample-types` | **DB** (host) + tenant override UI | Blood, Urine, Stool, Non-Sample | **Pass** (DB) |
| Containers & Tubes | MOD-21 | `/settings/containers` | **DB** (host) | EDTA, Fluoride, Plain, Urine Cup | **Pass** (DB) |
| Test Methods | MOD-22 | `/settings/test-methods` | **DB** (tenant) | MANUAL, AUTOMATED, ELISA, etc. | **Pass** (DB) |
| Reporting Methods | MOD-22 | `/settings/reporting-methods` | **DB** (host) | Manual, Analyzer, Template, etc. | **Pass** (DB) |
| Analyzers | MOD-22 | `/settings/analyzers` | **DB** (seed) | Sysmex XN-1000, Cobas e411 | **Pass** (DB) |
| Doctors | MOD-23 | `/settings/doctors` | **DB** (seed) | Dr. Mahmuda Khatun, Dr. Sayed Rahman | **Pass** (DB) |
| Report Doctor Assignment | MOD-24 | `/settings/report-doctors` | **DB** (seed) | CBC → pathologist; XRCHEST → radiologist | **Pass** (DB) |
| Signature Templates | MOD-24 | `/settings/signatures` | **DB** (seed) + mock display assets | Template for pathology | **Pass** (DB) |
| Report Layouts | MOD-24 | `/settings/report-layouts` | Mock | Visual placeholder | **Partial** |
| Print Profiles | MOD-24 | `/settings/print-profiles` | Mock | Visual placeholder banner | **Partial** |
| Billing Layouts | MOD-10 | `/settings/billing-layouts` | Mock | Template preview only | **Partial** |
| Result Display Rules | MOD-22 | `/settings/result-display` | Mock | Visual placeholder banner | **Partial** |

### 9.3 Front office / clinical workflow

| Module | Code | Route(s) | Data source | QC focus | Expected |
| --- | --- | --- | --- | --- | --- |
| Patient Registration | MOD-15 | `/patients/new`, `/patients` | Mock | Registration form, search grid | **Partial** (no DB persist) |
| Appointments | MOD-17 | `/appointments` | Mock | Booking UI | **Partial** (module disabled in ABMG mock config) |
| Diagnostic Dashboard | — | `/dashboard` | Mock KPIs | Workflow tiles, queues | **Pass** (UI) |
| Diagnostic Billing | MOD-10 | `/diagnostic/billing` | Mock | Order creation UI | **Partial** |
| Sample Collection | MOD-21 | `/lab/sample-collection` | Mock queue | Status transitions UI | **Partial** |
| Label Print | MOD-21 | `/lab/label-print` | Mock | Barcode placeholder | **Partial** |
| LIS Worklist | MOD-22 | `/lab/lis-worklist` | Mock | Analyzer queue UI | **Partial** |
| Manual Result Entry | MOD-22 | `/lab/result-entry` | Mock | Parameter entry UI | **Partial** |
| Verification | MOD-23 | `/lab/verification` | Mock | Approval workflow UI | **Partial** |
| Report Release | MOD-24 | `/lab/report-release` | Mock | Print/PDF/portal release UI | **Partial** |
| Patient Portal | MOD-30 | `/portal/reports` | Mock | OTP/login placeholder | **Partial** |
| Doctor Worklist | MOD-40 | `/doctor/worklist` | Mock | AI prescription UI | **Partial** |

### 9.4 Seeded host catalog inventory (reference)

**Departments:** LAB (Laboratory), RAD (Radiology)  
**Categories:** HEM, BIO, IMM, MIC, CLP (LAB); XRY (RAD)  
**Host services (11):** CBC, HGB, BGRH, FBS, RBS, CREAT, SGPT, LIPID, TSH, URINE, BCS, XRCHEST  
**Tenant auto-import codes:** CBC, FBS, LIPID, XRCHEST, ECG — **ECG is not in host catalog seed** (see known issues)

---

## 10. Step-by-step QC Flow

Each flow lists: **Steps → Expected result → Pass/Fail criteria**

---

### 10.1 Host login

| Step | Action | Expected result | Pass | Fail |
| --- | --- | --- | --- | --- |
| 1 | Open http://192.168.2.44:3000/host/login | Host login page with branding panel | Page loads | 404/500/timeout |
| 2 | Enter username `admin.abs`, password `anyvalue` | Fields accept input | Form validates required fields | Cannot submit |
| 3 | Click **Sign in to Host Console** | Redirect to `/host/dashboard` | Lands on host dashboard | Stays on login / error |
| 4 | Verify header/session | Shows Host Admin context | Role visible | Wrong role |
| 5 | Open host nav | Dashboard, Tenants, Packages, Modules, Audit, Catalog, Settings | All links load | Broken routes |
| 6 | Click **Logout** | Returns to `/host/login` | Session cleared | Still authenticated |

---

### 10.2 Tenant creation / check

| Step | Action | Expected result | Pass | Fail |
| --- | --- | --- | --- | --- |
| 1 | Host login → `/host/tenants` | Tenant list with mock ABMG, CCHN, MPD | List renders | Empty/error |
| 2 | Open ABMG detail | Subscription, modules, branches, usage limits | Detail tabs load | Crash |
| 3 | `/host/tenants/new` | Multi-step create form | Form renders | Missing page |
| 4 | Submit new tenant (UI) | Success toast / redirect (mock) | UI feedback | No response |
| 5 | Tenant login `/login` | Dropdown shows **Al Baraka Medical Group (ABMG)** from DB | DB tenant visible | "No tenants available" |
| 6 | pgAdmin: `SELECT tenant_code, tenant_name FROM tenants` | One row: ABMG | Row exists | Empty table |

---

### 10.3 Role and permission check

| Step | Action | Expected result | Pass | Fail |
| --- | --- | --- | --- | --- |
| 1 | Tenant login as **Tenant Admin** | Redirect to dashboard (form) or settings via nav | Session role = Tenant Admin | Wrong nav |
| 2 | Verify nav | Service Catalog, Imported Services, Doctors, etc. | Setup menu visible | Missing items |
| 3 | Logout; login as **Reception** | Dashboard, Patients, Billing links | Reception nav only | Admin nav shown |
| 4 | Login as **Lab Technician** | Lab workflow links (sample → release) | Lab nav visible | Wrong menu |
| 5 | Login as **Billing** | Billing nav → `/diagnostic/billing` | Billing screen loads | Wrong redirect |
| 6 | DB check `users` / `roles` tables | Empty (not seeded) | Confirms mock auth | Unexpected rows without manual setup |

---

### 10.4 Diagnostic master check

| Step | Action | Expected result | Pass | Fail |
| --- | --- | --- | --- | --- |
| 1 | Tenant Admin → `/settings/services` | Imported services: CBC, FBS, LIPID, XRCHEST | ≥4 services listed | Empty list |
| 2 | `/settings/test-parameters` | CBC parameters: HGB, WBC, PLT | Parameters visible | Missing |
| 3 | `/settings/sample-types` | Blood, Urine, Stool, Non-Sample | Types listed | Empty |
| 4 | `/settings/containers` | EDTA (Purple), Fluoride (Grey), Plain (Red), Urine Cup | Containers listed | Empty |
| 5 | `/settings/test-methods` | MANUAL, AUTOMATED, ELISA, CLIA, etc. | Methods listed | Empty |
| 6 | `/settings/analyzers` | Sysmex XN-1000, Cobas e411 | 2 analyzers | Missing |
| 7 | `/settings/doctors` | Dr. Mahmuda Khatun, Dr. Sayed Rahman | 2 doctors | Missing |
| 8 | Host → `/host/catalog` | Full host service catalog (11+ services) | Catalog grid loads | Empty/error |
| 9 | Host → `/host/modules` | 13 module registry entries | MOD-01 through MOD-30 listed | Empty |

---

### 10.5 Department / category / service check

| Step | Action | Expected result | Pass | Fail |
| --- | --- | --- | --- | --- |
| 1 | Host catalog — filter LAB | HEM, BIO, IMM, MIC, CLP categories | Categories shown | Missing |
| 2 | Host catalog — filter RAD | X-Ray category, XRCHEST service | Radiology entries | Missing |
| 3 | Tenant imported CBC | Dept LAB, category HEM, price from host base (400 BDT) | Correct mapping | Wrong dept/price |
| 4 | `/settings/service-catalog` | Host services available to import (e.g. HGB, TSH) | Import preview works | No catalog |
| 5 | Import **TSH** to tenant | New tenant service row | Import success message | Import error |
| 6 | pgAdmin: `tenant_services` join host | Row count ≥4 after seed | Data present | Zero rows |

---

### 10.6 Doctor / employee check

| Step | Action | Expected result | Pass | Fail |
| --- | --- | --- | --- | --- |
| 1 | `/settings/doctors` — open Dr. Mahmuda Khatun | Pathology, BMDC 12345, reporting + verifying flags | Profile displays | Not found |
| 2 | Branches tab | Primary branch BR-DHK-01 | Branch linked | Missing |
| 3 | `/settings/report-doctors` | CBC → Dr. Mahmuda Khatun (report + verify) | Assignment row | Missing |
| 4 | XRCHEST assignment | Dr. Sayed Rahman as reporting doctor | Radiology assignment | Missing |
| 5 | Employee login | No seeded employee users | N/A — use mock tenant login | — |

---

### 10.7 Patient registration

| Step | Action | Expected result | Pass | Fail |
| --- | --- | --- | --- | --- |
| 1 | Reception login → `/patients/new` | Registration form (demographics, identity) | Form renders | Error |
| 2 | Fill required fields and save | Success UI / MRN assignment (mock) | UI confirms save | Validation broken |
| 3 | `/patients` search | Sample patients in grid (mock data) | Search results show | Empty/broken |
| 4 | Refresh / re-open | Data persists in DB | **Fail expected** — no Patient model seed | Data lost (expected) |
| 5 | pgAdmin | No `patients` table or empty | Confirms UI-only | — |

---

### 10.8 Appointment

| Step | Action | Expected result | Pass | Fail |
| --- | --- | --- | --- | --- |
| 1 | Navigate to `/appointments` | Appointment booking UI | Page loads | 404 |
| 2 | Search patient, select slot | Mock slot grid | UI interaction works | Broken |
| 3 | Confirm booking | Confirmation message (mock) | UI feedback | No response |
| 4 | ABMG module config (host mock) | MOD-17 OPD/Appointments **disabled** | Document as not licensed in sample tenant | — |

**Expected overall:** **Partial Pass** (UI only; module disabled in subscription mock)

---

### 10.9 Investigation order

| Step | Action | Expected result | Pass | Fail |
| --- | --- | --- | --- | --- |
| 1 | `/diagnostic/billing` | Billing / test order panel | Page loads | Error |
| 2 | Search mock patient (e.g. from sample list) | Patient details populate | Mock lookup works | Broken search |
| 3 | Add tests CBC, FBS | Line items and totals update | UI calculation | Broken |
| 4 | Save / bill order | Order appears in mock queue | UI state updates | No feedback |
| 5 | Dashboard `/dashboard` | Pending orders in KPI / queue section | Mock orders visible | Empty dashboard |

**Expected overall:** **Partial Pass** (mock workflow; no DB persistence)

---

### 10.10 Sample collection

| Step | Action | Expected result | Pass | Fail |
| --- | --- | --- | --- | --- |
| 1 | Lab Technician → `/lab/sample-collection` | Pending collection queue (mock) | Queue renders | Error |
| 2 | Select order → Collect | Status → Collected (UI) | Status changes in UI | No change |
| 3 | Reject sample flow | Rejection modal (placeholder) | Modal opens | Broken |
| 4 | `/lab/label-print` | Pending labels, print action | Label UI loads | Error |
| 5 | Barcode / QR area | Placeholder text shown | Placeholder visible | — |

**Expected overall:** **Partial Pass**

---

### 10.11 Result entry

| Step | Action | Expected result | Pass | Fail |
| --- | --- | --- | --- | --- |
| 1 | `/lab/lis-worklist` | LIS queue with analyzer mapping | Queue loads | Error |
| 2 | `/lab/result-entry` | Manual entry form with parameters | Form loads | Error |
| 3 | Enter numeric results | Draft → Entered state (UI) | State transition in UI | Broken |
| 4 | Submit for verification | Item moves to verification queue (mock) | UI updates | No update |
| 5 | Critical value banner | Placeholder notification text | Banner shown | — |

**Expected overall:** **Partial Pass**

---

### 10.12 Verification

| Step | Action | Expected result | Pass | Fail |
| --- | --- | --- | --- | --- |
| 1 | `/lab/verification` | Verification pending queue | Queue loads | Error |
| 2 | Open CBC result | Parameters with reference ranges (mock) | Detail panel | Missing |
| 3 | Approve result | Status → Verified / Release Ready | UI state change | Broken |
| 4 | Reject / hold | Hold reason UI | Modal/fields work | Broken |
| 5 | Pathologist identity | Dr. Mahmuda Khatun in mock data | Name shown | — |

**Expected overall:** **Partial Pass**

---

### 10.13 Report release

| Step | Action | Expected result | Pass | Fail |
| --- | --- | --- | --- | --- |
| 1 | `/lab/report-release` | Release pending reports | List loads | Error |
| 2 | Preview report | Layout preview (mock) | Preview panel | Missing |
| 3 | Print / PDF action | UI feedback (no real PDF engine) | Button response | No action |
| 4 | Release to portal | Portal status → Released (mock) | Status badge updates | Broken |
| 5 | `/settings/signatures` | Pathology signature template (DB seed) | Template row exists | Missing |

**Expected overall:** **Partial Pass**

---

### 10.14 Billing

| Step | Action | Expected result | Pass | Fail |
| --- | --- | --- | --- | --- |
| 1 | Billing role → `/diagnostic/billing` | Billing screen default landing | Loads | Wrong page |
| 2 | Create bill with discount/VAT fields | Totals recalculate (mock) | Math in UI | Broken |
| 3 | Payment capture | Paid/due amounts update | UI updates | Broken |
| 4 | Tax engine note | "Tax engine placeholder" visible | Placeholder shown | — |
| 5 | Dashboard due amount KPI | Mock due total displayed | KPI visible | Missing |

**Expected overall:** **Partial Pass**

---

### 10.15 Dashboard

| Step | Action | Expected result | Pass | Fail |
| --- | --- | --- | --- | --- |
| 1 | Tenant login (Reception) → `/dashboard` | Diagnostic dashboard | Loads | Error |
| 2 | KPI cards | Today's Bills, Collection, Pending queues, Due Amount | 8 KPI cards | Missing cards |
| 3 | Workflow strip | Billing → Sample → LIS → Result → Verify → Release → Portal | Steps visible | Broken layout |
| 4 | Pending sample table | Mock orders listed | Rows present | Empty |
| 5 | TAT / analyzer widgets | Placeholder labels | Placeholders shown | — |
| 6 | Host `/host/dashboard` | SaaS KPIs (tenants, revenue mock) | Host KPIs render | Error |

**Expected overall:** **Pass** (UI/mock KPIs)

---

## 11. Expected Pass/Fail Summary by Area

| Area | Expected QC result | Reason |
| --- | --- | --- |
| Docker deployment & health | **Pass** | Compose stack + health endpoint |
| Host login | **Pass** | Mock session always succeeds |
| Tenant login (DB tenant list) | **Pass** if seeded | Requires manual `db:seed` |
| Host SaaS screens | **Pass** (UI) | Mock foundation data |
| Module registry & host catalog | **Pass** (DB) | Seeded via `prisma/seed.ts` |
| Tenant diagnostic masters | **Pass** (DB) | Doctors, analyzers, imports seeded |
| Service catalog import (additional) | **Pass** (DB) | Prisma-backed import actions |
| RBAC / real authentication | **Fail** | Mock sessions; no User seed |
| Patient → Report clinical chain | **Partial** | UI mock only; no persistence |
| Appointments (MOD-17) | **Partial / Fail** | UI exists; disabled in sample tenant config |
| Patient portal auth | **Partial** | OTP/password UI placeholder |
| pgAdmin connectivity | **Pass** | If server admin configured pgAdmin separately |

---

## 12. Known Pending Issues

1. **Seed not run on Docker startup** — `scripts/docker-entrypoint.sh` runs `prisma migrate deploy` only. Run `docker compose exec app npx prisma db seed` manually after first deploy.
2. **Mock authentication** — Host and tenant logins do not validate against `users.password_hash`. Production auth is marked TODO in `src/app/actions/auth.ts` and `src/lib/mock-session.ts`.
3. **No User/Role seed data** — Prisma seed creates tenants, catalog, and diagnostic masters but **no login users** in the database.
4. **ECG import gap** — `prisma/seed/tenant-imported-services.ts` requests service code `ECG`, but `ECG` is **not** defined in `prisma/seed/data/host-diagnostic-catalog-data.ts`. Seed imports CBC, FBS, LIPID, XRCHEST only (4 services).
5. **Dual tenant data sources** — Host console shows 3 mock tenants (ABMG, CCHN, MPD) from `saas-foundation-data.ts`; PostgreSQL seed creates **ABMG only**.
6. **Clinical workflow is UI-first** — Patient registration, orders, sample collection, results, verification, release, and billing use `src/lib/diagnostic-data.ts` mock data; changes do not persist.
7. **pgAdmin not in repository compose** — Port 8081 pgAdmin is deployment-specific; credentials not in repo.
8. **Placeholder modules** — Result display rules, print profiles, billing layouts, report layouts show "Visual placeholder only" banners.
9. **Dashboard TAT/analyzer widgets** — Explicit placeholders; no live calculation or device integration.
10. **Tenant login redirect** — `TenantLoginForm` always routes to `/dashboard` regardless of selected role (role affects nav, not initial redirect).
11. **README drift** — README states "business modules are not implemented yet" while UI modules exist as mockups/wireframe implementations.

---

## 13. Recommended Next Development Tasks

Priority order for post-pilot development:

1. **Wire Docker seed into entrypoint** — Add optional `RUN_DB_SEED=true` or run `prisma db seed` after migrate in `docker-entrypoint.sh` for repeatable QC environments.
2. **Implement real authentication** — Seed host admin + tenant users with hashed passwords; replace mock session actions with credential verification against `User` table.
3. **Seed RBAC** — Insert default roles, permissions, and `UserRole` assignments matching `TENANT_PRIMARY_ROLES` and demo users.
4. **Add ECG to host catalog seed** — Align `HOST_SERVICES` with `DEFAULT_IMPORT_CODES` or remove ECG from import list.
5. **Persist clinical workflow** — Add Patient, Order, Sample, Result, Verification, Report models and connect UI actions to Prisma (replace `diagnostic-data.ts` mocks).
6. **Unify tenant data** — Sync host tenant management UI with PostgreSQL instead of static `SAAS_TENANTS` mock array.
7. **Enable end-to-end diagnostic chain test** — Single automated test: register patient → bill → collect → enter result → verify → release.
8. **Add pgAdmin to docker-compose (optional)** — Document or containerize pgAdmin with known credentials for QC team.
9. **Health check enhancement** — Include seed verification (tenant count, module registry count) in `/api/health` response.
10. **Production hardening** — Session security, HTTPS reverse proxy, secrets management, remove demo credential hints from UI error messages.

---

## Appendix A — Quick reference URLs

| Resource | URL |
| --- | --- |
| App home | http://192.168.2.44:3000 |
| Health | http://192.168.2.44:3000/api/health |
| Host login | http://192.168.2.44:3000/host/login |
| Tenant login | http://192.168.2.44:3000/login |
| Host dashboard | http://192.168.2.44:3000/host/dashboard |
| Tenant dashboard | http://192.168.2.44:3000/dashboard |
| pgAdmin | http://192.168.2.44:8081 |

## Appendix B — Seed execution command

```powershell
# From project root on Docker host
docker compose exec app npx prisma db seed
```

Expected console output includes:

- `Host diagnostic catalog seeded: 2 departments, … categories, … host services`
- `Seed complete: host catalog, module registry, ABMG tenant services, and diagnostic masters`

## Appendix C — Source files reviewed

| File | Purpose |
| --- | --- |
| `prisma/seed.ts` | Main seed orchestration |
| `prisma/seed/host-diagnostic-catalog.ts` | Host catalog seed |
| `prisma/seed/tenant-diagnostic-masters.ts` | Module registry + tenant masters |
| `prisma/seed/tenant-imported-services.ts` | Tenant service import |
| `prisma/seed/data/host-diagnostic-catalog-data.ts` | Catalog definitions |
| `src/lib/saas-foundation-data.ts` | Mock SaaS / tenant UI data |
| `src/lib/module-registry.ts` | Module and screen registry |
| `src/lib/session.ts` | Demo users and session types |
| `src/lib/mock-session.ts` | Mock session builders |
| `src/app/actions/auth.ts` | Login/logout actions |
| `src/components/login/TenantLoginForm.tsx` | Tenant login UI |
| `src/components/login/HostLoginForm.tsx` | Host login UI |
| `docker-compose.yml` | Docker services |
| `Dockerfile` | App image build |
| `scripts/docker-entrypoint.sh` | Container startup |

---

*End of QC Guide*
