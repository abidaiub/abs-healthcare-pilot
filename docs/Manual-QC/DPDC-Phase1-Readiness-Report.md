# DPDC End-to-End Browser UAT — Phase 1 Readiness Report

**Test date/time:** 2026-07-26 (updated after Option A — reference ranges + section routing)  
**Verdict:** **READY FOR PATIENT CASE 1** — Gates A (reference ranges) and B (lab section routing) are satisfied for UAT.

---

## Environment record

| Item | Value |
|------|--------|
| Repository root | `D:/Al Baraka Soft/ABS_ERP_Cursour AI/ABSHealthCareLite/abs-healthcare-pilot` |
| Git branch | `main` (dirty working tree — DPDC package) |
| Application URL | `http://localhost:3000` |
| Tenant login | `http://localhost:3000/login` |
| Patient portal | `http://localhost:3000/portal/login` |
| Database | `abs_healthcare_pilot` @ localhost:5432 |

---

## Option A completion (required before Case 1)

| Gate | Requirement | Status |
|------|-------------|--------|
| **A** | Reference ranges verified for Case 1 adult male, Case 2 adult female, Case 3 12y male | **PASS** — seeded via `ServiceParameterReferenceRange`; `verify:dpdc` resolves age/sex/unit |
| **B** | Laboratory section routing proven or corrected | **PASS** — priced services remapped from host “Laboratory” to DP-HAEM / DP-BIOCHEM / DP-HORMONE / DP-ELECTRO / DP-CLINPATH |

### Department-routing classification

**Haematology / Biochemistry / Hormone / Electrolyte / Clinical Pathology mappings were missing on `TenantService.departmentId` after host import** (all showed generic **Laboratory**). They were **not** intentionally parent-only with a separate section field. Seed now remaps using `DOCTORS_POINT_PRICE_LIST.deptCode`. Order lines copy `TenantService.departmentId`; analyzers use the same section codes.

### Reference-range notes

- Approved sources used where available (Architecture §6.3 CBC; Sample Data Dictionary §17 FBS / HbA1c).
- Remaining parameters seeded as **CONFIGURATION_GAP_UAT_ONLY** — documented in `docs/E2E-Diagnostic-Workflow/04-DPDC-Reference-Ranges-and-Section-Routing.md`.
- Missing match → `LAB_RESULT_RANGE_NOT_FOUND` / null snapshot → flag `UNDETERMINED` (not silent invent).
- Age: DOB preferred; `estimatedAge` × 365 when DOB absent (draft fix). UAT patients also get deterministic DOB.

---

## Readiness table (updated)

| Area | Status | Evidence |
|------|--------|----------|
| DPDC tenant / branch / subscription | PASS | Seed + `verify:dpdc` |
| Users / SoD | PASS | Seed + `verify:dpdc` |
| Catalog rates | PASS | Price list branch rates |
| **Service departments (sections)** | **PASS** | Remapped to DP-* sections |
| **Reference ranges** | **PASS (UAT)** | `doctors-point-reference-ranges.ts` + verify matrix |
| Units vs LIS mappings | PASS | Verify asserts parameter/range unit match |
| Cross-tenant range isolation | PASS | tenantId filter + verify assertions |
| Notification / LIS / portal seed | PASS | Prior Phase 1 |

---

## Credentials for UAT (development only)

| Kind | Username | Password | Notes |
|------|----------|----------|-------|
| Host Admin | `admin.abs` | `Host@2026!` | Must not perform tenant clinical tx |
| Tenant staff | e.g. `dp.reception` | `DoctorsPoint@2026!` | Tenant code **DPDC** at `/login` |
| Portal Case 1 | `8801712200001` | `Portal@2026!` | Md. Rahim Uddin |

---

## Gate decision

| Decision | Value |
|----------|--------|
| Can Case 1 start? | **YES** |
| Gate A (ranges for 3 profiles) | **PASS** |
| Gate B (section routing) | **PASS** |
| Full 3-case clinical authority of all ranges? | **NO for production** — CONFIGURATION_GAP_UAT_ONLY rows must be replaced with approved clinical values before go-live |
| Next action | Begin browser Patient Case 1 |

### Exact first browser step for Patient Case 1

1. Open `http://localhost:3000/login`
2. Tenant code **`DPDC`**, username **`dp.reception`**, password **`DoctorsPoint@2026!`**
3. Navigate to **`/patients`** (or **`/patients/new`**) to confirm / register Case 1 patient **Md. Rahim Uddin** (`DP-000001`)

---

## Related docs

- `docs/E2E-Diagnostic-Workflow/04-DPDC-Reference-Ranges-and-Section-Routing.md`
- `docs/E2E-Diagnostic-Workflow/02-Manual-QC-UAT-Guide.md`
