# MOD-18 — Doctor Worklist & Clinical Encounter

| Field | Value |
|-------|-------|
| **Module** | MOD-18 |
| **Display name** | Doctor Consultation |
| **Category** | Clinical Foundation |
| **Depends on** | MOD-01, MOD-01A, MOD-02, MOD-03, MOD-04, MOD-06, MOD-07, MOD-15, MOD-17 |
| **Status** | Implemented (foundation coverage) |
| **Verify** | `npm run verify:mod18` |

## Purpose

Provide the clinical encounter workspace when a doctor consults an OPD patient — complaints, vitals, examination, diagnosis, medicine advice, investigation advice, follow-up, and printable summary.

## Scope

- Clinical encounter CRUD with lifecycle (DRAFT, IN_PROGRESS, COMPLETED, CANCELLED)
- Appointment-linked start with MOD-17 integration
- Encounter numbering (`EN-000001`)
- Vitals, diagnosis, medicine advice, investigation advice (normalized child rows)
- Draft save, complete, cancel, authorized reopen
- Doctor worklist from today's appointment queue
- RBAC, audit, localization, print view

Out of scope: pharmacy dispensing, lab order creation, billing, full ICD/medicine masters, EMR extensions.

## Architecture

| Layer | Location |
|-------|----------|
| Schema | `ClinicalEncounter`, child entities, `TenantEncounterCounter` |
| Numbering | `src/lib/consultation/number.ts` |
| Validation | `src/lib/consultation/validation.ts` |
| Queries | `src/lib/consultation/queries.ts` |
| Actions | `src/app/actions/tenant-consultations.ts` |
| UI | `/consultations*`, `/doctor/worklist` |

## RBAC

| Route | Permission |
|-------|------------|
| `/consultations` | `CONSULTATION_MGMT` (view) |
| `/doctor/worklist` | `CONSULTATION_WORKLIST` (view) |
| `/consultations/start` | `CONSULTATION_START` (create) |
| `/consultations/edit` | `CONSULTATION_EDIT` (edit) |
| `/consultations/vitals` | `VITALS_CAPTURE` (edit) |
| `/consultations/complete` | `CONSULTATION_COMPLETE` (edit) |
| `/consultations/print` | `CONSULTATION_PRINT` (print) |
| `/consultations/reopen` | `CONSULTATION_REOPEN` (approve) |

## QC status

| Check | Status |
|-------|--------|
| Automated (`verify:mod18`) | PASS |
| Manual QC | NOT TESTED |
| Production approval | Pending Manual QC |
