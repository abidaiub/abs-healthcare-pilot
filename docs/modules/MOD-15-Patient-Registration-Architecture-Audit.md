# MOD-15 — Patient Registration Architecture Audit

Audit date: 2026-07-24  
Baseline: `416a9bb` (MOD-07 db fix), `df88f95` (MOD-07)

## Module ID decision

| Candidate | Evidence | Verdict |
|-----------|----------|---------|
| **MOD-15** | `MODULE_REGISTRY`, `module-registry.ts` (`patientRegistration.id: "15"`), RBAC `moduleCode: "MOD-15"`, routes `/patients`, `ABMG_ENABLED_MODULES`, docs `15-PatientRegistration/` | **Authoritative** |
| MOD-08 | Architecture book lists MOD-08 as **Department** master | Not patient registration |

**Confirmed module ID: MOD-15**  
Verify command: `npm run verify:mod15`  
QC doc prefix: `015` (aligned with module number pattern in AI-QC pack)

## Existing assets reused

| Asset | Usage |
|-------|--------|
| `/patients`, `/patients/new` routes | Rewired to DB-backed flows |
| `PATIENT_SEARCH`, `PATIENT_REGISTER` RBAC resources | Retained; detail/edit use same permissions |
| `writeAuditLog()` | Patient lifecycle events |
| `resolveCurrentBranch()` / session enrichment | Registration branch on create |
| `ModulePageHeader`, UI components | Patient list/form/detail |
| MOD-06 i18n | New `patient` namespace |
| `TenantPatientCounter` | Concurrency-safe `PT-000001` numbering |

## Conflicts / gaps found

| Gap | Resolution |
|-----|------------|
| No `Patient` Prisma model | Added MOD-15 schema + migration |
| Mock `sample-data` patients | Replaced with DB queries in UI |
| English-only registration form | Localized via `patient` namespace |
| No duplicate detection backend | `checkPatientDuplicates()` server action |
| No MPI persistence | Full CRUD + lifecycle server actions |

## Deferred scope

- Appointments, billing, lab, prescriptions, clinical records
- Patient merge/deceased status
- Photo capture/upload
- Family trees, insurance guarantors
- Tenant-wide patient visibility restriction by branch (patients are tenant-wide; registration branch tracked)

## Design decisions

1. **Tenant-wide master** with `registrationBranchId` — not branch-owned master data.
2. **Patient number** via `TenantPatientCounter` transactional increment — no MAX+1 race.
3. **DOB OR estimated age** — mutually exclusive validation; age derived at display time from DOB.
4. **Duplicate workflow** — warnings + override permission; national ID hard block within tenant.
5. **Mobile normalization** — searchable normalized digits; display value preserved.

## Migration risks

- New tables only; no existing patient table collision.
- Partial unique index on `national_id_normalized` per tenant.
- Rollback: drop `patients` and `tenant_patient_counters` if no production data.
