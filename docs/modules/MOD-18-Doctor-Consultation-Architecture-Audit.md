# MOD-18 — Doctor Consultation Architecture Audit

Audit date: 2026-07-24  
Baseline: MOD-17 (`5671377`), MOD-15, MOD-07

## Module ID decision

| Candidate | Evidence | Verdict |
|-----------|----------|---------|
| **MOD-18** | Product/Architecture books Module 18 = Doctor Worklist & Encounter; `docs/18-DoctorWorklistEncounter/`; dependency chain 11,15,17 → 18; route `/doctor/worklist` | **Authoritative** |
| MOD-19 | Prescription Management (downstream) | Separate module |
| MOD-40 | AI Prescription mock conflation on worklist | Corrected to MOD-18 |

**Confirmed module ID: MOD-18**  
Verify: `npm run verify:mod18`  
QC prefix: `018`

## Existing assets reused

| Asset | Usage |
|-------|--------|
| `Doctor`, `DoctorBranch`, `Department` | Provider validation |
| `Patient` (MOD-15) | Reference only — no demographic duplication |
| `Appointment` (MOD-17) | Linked consultation start/complete lifecycle |
| `resolveCurrentBranch` / `validateBranchAccess` (MOD-07) | Operational branch authorization |
| `writeAuditLog()` (MOD-04) | Encounter lifecycle events |
| RBAC (MOD-02) | Granular consultation permissions |
| i18n (MOD-06) | `consultation` namespace |
| `/doctor/worklist` mock route | Rewired to DB-backed worklist |

## Existing clinical masters

| Master | Status |
|--------|--------|
| Diagnosis / ICD catalog | Not implemented — free-text + optional ICD code on encounter rows |
| Medicine catalog | Not implemented — free-text medicine advice rows |
| Investigation/test catalog | Tenant service catalog exists for billing/LIS — advice uses free-text fallback |
| Dosage/frequency masters | Not implemented — structured text fields |

## Gaps resolved

| Gap | Resolution |
|-----|------------|
| No `ClinicalEncounter` model | Added MOD-18 schema + migration |
| Mock `DoctorWorklistPanel` sample data | DB worklist from appointments + encounters |
| Queue start only changed appointment status | `startConsultationAction` creates/resumes encounter transactionally |
| No encounter numbering | `TenantEncounterCounter` → `EN-000001` |
| Duplicate encounters on retry | Partial unique index + idempotent start |

## Deferred scope

- Full EMR, IPD, nursing charts, dental/ophthalmology diagrams
- Pharmacy dispensing, lab orders, billing collection
- ICD catalog import, e-prescription integration, AI diagnosis

## Design decisions

1. **Branch persistence** — encounter stores appointment branch; not overwritten by session branch later.
2. **One active encounter per appointment** — partial unique index on `(tenant_id, appointment_id)` for DRAFT/IN_PROGRESS.
3. **Lifecycle** — DRAFT → IN_PROGRESS → COMPLETED / CANCELLED; reopen requires `canApprove` + reason.
4. **Completed records** — read-only unless reopened with audit.
5. **Vitals** — single upsert row per encounter; BMI calculated server-side.
6. **Child entities** — normalized rows for diagnosis, medicine advice, investigation advice.
