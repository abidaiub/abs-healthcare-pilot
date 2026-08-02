# DPDC Reference Ranges & Laboratory Section Routing

**Date:** 26 July 2026  
**Tenant:** Doctors Point Diagnostic Center (`DPDC`)  
**Seed:** `npm run seed:uat:doctors-point`  
**Verify:** `npm run verify:dpdc`

---

## 1. Architecture (no parallel tables)

| Concern | Implementation |
|---------|----------------|
| Storage | `ServiceParameterReferenceRange` (tenant-owned) |
| Selection | `src/lib/laboratory-result/range-selection.ts` → `selectReferenceRange` |
| Flagging | `src/lib/laboratory-result/abnormal-flags.ts` → `computeAbnormalFlag` |
| Draft snapshot | `src/lib/laboratory-result/draft.ts` (filters ranges by `tenantId`) |
| Seed data | `prisma/seed/uat/doctors-point-reference-ranges.ts` |

### Scope supported by schema

| Dimension | Supported? | Notes |
|-----------|------------|-------|
| Tenant | Yes | `tenantId` on every range row |
| Branch | No | Not in schema — CONFIGURATION GAP if branch-specific ranges are required later |
| Test/service | Yes | Via `serviceParameterId` → `TenantService` |
| Sex | Yes | `gender` `M` / `F` / null (both) |
| Age from/to | Yes | `ageFromDays` / `ageToDays` (365 d/y; adult = 6570) |
| Unit | Yes | Must match `ServiceParameter.unit` |
| Method/analyzer | No | Not in schema — analyzer mappings do not override ranges |
| Effective dates | No | Not in schema — `isActive` only |

### Boundary behaviour

| Condition | Behaviour |
|-----------|-----------|
| Below normal | `LOW` |
| Within normal | `NORMAL` |
| Above normal | `HIGH` |
| Outside critical | `CRITICAL_LOW` / `CRITICAL_HIGH` (`isCritical=true`) |
| No matching range | Draft continues with null snapshots; flag path → `UNDETERMINED`; selection API → `LAB_RESULT_RANGE_NOT_FOUND` |
| Unit mismatch | Excluded from selection; flag path → `UNDETERMINED` |

Age resolution: prefer `dateOfBirth`; if absent, `estimatedAge` × 365 (+ elapsed since `ageAsOfDate`). UAT patients also receive deterministic `dateOfBirth`.

---

## 2. Range coverage matrix

| Service | Parameter | Unit | Profiles | Authority |
|---------|-----------|------|----------|-----------|
| CBC | HGB | g/dL | Adult M 13–17; Adult F 12–16; Paediatric M 11.5–15.5 | Architecture §6.3 (+ UAT paediatric HGB) |
| CBC | WBC | /cumm | All ages 4000–11000 | Architecture §6.3 |
| CBC | PLT | /cumm | All ages 150000–450000 | Architecture §6.3 |
| ESR | ESR | mm/1st hour | Adult M/F + paediatric M | **CONFIGURATION_GAP_UAT_ONLY** |
| FBS | GLU | mmol/L | All ages 3.9–5.5 | Sample Data Dictionary §17 |
| RBS | GLU | mmol/L | All ages 3.9–7.8 | **CONFIGURATION_GAP_UAT_ONLY** |
| HbA1c | HBA1C | % | All ages ≤5.7 | Sample Data Dictionary §17 |
| CREAT | CREAT | mg/dL | Adult M/F | **CONFIGURATION_GAP_UAT_ONLY** |
| TSH | TSH | mIU/L | Adult | **CONFIGURATION_GAP_UAT_ONLY** |
| FT4 | FT4 | ng/dL | Adult | **CONFIGURATION_GAP_UAT_ONLY** |
| ELECTRO | NA / K / CL | mmol/L | All ages (K critical 2.5 / 6.0) | **CONFIGURATION_GAP_UAT_ONLY** |
| URINE | APPEAR / PROT / SUGAR | (TEXT) | textRange display only | TEXT — flag `NOT_APPLICABLE` |

Documented gap list: `DOCTORS_POINT_REFERENCE_RANGE_GAPS` in the seed file. UAT-only rows use `createdBy` prefix `seed.uat.dpdc.reference-ranges:CONFIGURATION_GAP_UAT_ONLY`.

---

## 3. Laboratory section routing

**Finding:** Host catalog import attached every DPDC service to the generic host department name **Laboratory**. That was a seed gap — not an intentional “parent department only” design for section worklists.

**Correction:** After import, `seedPricedCatalog` remaps each priced service’s `departmentId` to the price-list `deptCode`:

| deptCode | Section |
|----------|---------|
| DP-HAEM | Haematology Laboratory |
| DP-BIOCHEM | Biochemistry Laboratory |
| DP-HORMONE | Hormone and Immunology Laboratory |
| DP-ELECTRO | Electrolyte Laboratory |
| DP-CLINPATH | Urine and Clinical Pathology Laboratory |

Lab order lines copy `TenantService.departmentId` (`tenant-lab-orders.ts`). Analyzers are also assigned to the same section codes. Section routing is therefore service-master + analyzer configuration — not a separate routing field.

---

## 4. Case profile resolution

| Case | Patient | Age / sex | Example resolved range |
|------|---------|-----------|------------------------|
| 1 | DP-000001 | 52M adult | HGB M 13–17; FBS 3.9–5.5 (5.6 → HIGH) |
| 2 | DP-000002 | 34F adult | HGB F 12–16; TSH/FT4 adult UAT rows |
| 3 | DP-000003 | 12M paediatric | HGB paediatric UAT; K critical for acknowledgement |

---

## 5. Production safety

- UAT seed is **not** wired into `prisma db seed`.
- CONFIGURATION_GAP values must be replaced with clinically approved tenant ranges before production go-live.
