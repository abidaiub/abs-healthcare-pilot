# MOD-15 — Patient Registration / Patient Master

| Field | Value |
|-------|-------|
| **Module** | MOD-15 |
| **Display name** | Patient Registration |
| **Category** | Clinical Foundation |
| **Depends on** | MOD-01, MOD-01A, MOD-02, MOD-03, MOD-04, MOD-06, MOD-07 |
| **Status** | Implemented (foundation coverage) |
| **Verify** | `npm run verify:mod15` |

## Purpose

Provide a secure, tenant-isolated and branch-aware patient master for front-office registration and future clinical workflows.

## Scope

- Patient master CRUD (tenant-wide visibility)
- New patient registration with server-generated patient numbers
- Demographics, contact, address, guardian, emergency contact
- DOB or estimated-age handling
- Duplicate detection (warning + override; national ID critical block)
- Active/inactive lifecycle (no hard delete)
- Registration branch from MOD-07 current branch context
- RBAC, audit, localization, RTL
- Module Registry compliance

Out of scope: appointments, queue, billing, laboratory, prescriptions, clinical records, merge/deceased workflows, photo upload.

## Module ID decision

**Authoritative ID: MOD-15** (not MOD-08). Evidence: `MODULE_REGISTRY`, `module-registry.ts`, RBAC `moduleCode: "MOD-15"`, existing routes `/patients` and `/patients/new`. MOD-08 remains Department master in architecture docs.

See `docs/modules/MOD-15-Patient-Registration-Architecture-Audit.md`.

## Architecture

| Layer | Location |
|-------|----------|
| Schema | `prisma/schema.prisma` — `Patient`, `TenantPatientCounter` |
| Numbering | `src/lib/patient/number.ts` |
| Validation | `src/lib/patient/validation.ts` |
| Duplicates | `src/lib/patient/duplicates.ts` |
| Queries | `src/lib/patient/queries.ts` |
| Branch context | `src/lib/patient/context.ts` |
| Actions | `src/app/actions/tenant-patients.ts` |
| UI | `/patients`, `/patients/new`, `/patients/[patientId]`, `/patients/[patientId]/edit` |

## Data model

**Patient** — tenant-owned master with demographics, contacts, guardian/emergency fields, normalized mobile/NID/passport, `registrationBranchId`, `isActive`.

**TenantPatientCounter** — one row per tenant; transactional increment for `PT-000001` format numbers.

Constraints:

- `@@unique([tenantId, patientNumber])`
- Partial unique on `(tenantId, nationalIdNormalized)` when not null
- Registration branch must belong to same tenant and be active at create time

## Patient number generation

`allocatePatientNumber()` uses `upsert` + `increment` inside a Prisma transaction. Safe under concurrent registrations; numbers are immutable after creation.

## Tenant isolation

All queries filter by session `tenantId`. Client-supplied tenant IDs are never trusted. Cross-tenant patient IDs return not found / access denied.

## Branch integration

On create, `resolveRegistrationBranch()` uses MOD-07 `resolveCurrentBranch()` and persists the resolved active branch as `registrationBranchId`. Patient list remains tenant-wide; registration branch is filterable.

## DOB and estimated age

Mutually exclusive modes:

- Exact DOB — age calculated at display time
- Estimated age — stored with `ageAsOfDate`; future display derives from estimate metadata

Future DOB and invalid age ranges are rejected.

## Contact normalization

Mobile numbers normalized to searchable digits (`normalizeMobile`). Email lowercased. Empty values stored as null.

## Duplicate detection

Tenant-scoped checks for:

- National ID (critical)
- Mobile, passport, name+DOB, name+guardian mobile (warnings)

Override requires `canApprove` on `/patients/new`. Never auto-merge.

## Lifecycle

- `isActive: true | false`
- Inactive patients remain searchable
- Reactivation/deactivation audited

## RBAC

| Route | Permission code | Typical use |
|-------|-----------------|-------------|
| `/patients` | PATIENT_SEARCH | View/search |
| `/patients/new` | PATIENT_REGISTER | Create/edit/activate/deactivate |

Reception role: view + create + edit on both routes. Tenant admin: full access via role matrix.

## Audit events

`entityType: "Patient"` with `changeData.event`:

- `PATIENT_CREATED`, `PATIENT_UPDATED`, `PATIENT_ACTIVATED`, `PATIENT_DEACTIVATED`
- `PATIENT_DUPLICATE_WARNING_SHOWN`, `PATIENT_DUPLICATE_WARNING_OVERRIDDEN`

## Error codes

`PATIENT_NOT_FOUND`, `PATIENT_ACCESS_DENIED`, `PATIENT_NUMBER_DUPLICATE`, `PATIENT_NATIONAL_ID_DUPLICATE`, `PATIENT_INVALID_DOB`, `PATIENT_INVALID_AGE`, `PATIENT_INVALID_MOBILE`, `PATIENT_BRANCH_REQUIRED`, `PATIENT_BRANCH_INACTIVE`, `PATIENT_CROSS_TENANT`, `PATIENT_DUPLICATE_WARNING`, `PATIENT_INACTIVE`, `PATIENT_VALIDATION`

## Localization

Namespace: `patient` in en-BD, bn-BD, ar-SA, ur-PK, hi-IN. Enum codes stored untranslated; labels from dictionaries. Arabic and Urdu RTL supported via MOD-06 direction resolution.

## Seed behaviour

`prisma/seed/patient-foundation.ts` creates fictional ABMG demo patients idempotently (create-if-missing by patient number). Does not overwrite existing rows. Syncs `TenantPatientCounter` after seed.

## Module Registry metadata

| Field | Value |
|-------|-------|
| **Automated QC** | PASS (after `verify:mod15`) |
| **Manual QC** | NOT TESTED |
| **Browser UAT** | NOT TESTED |
| **Production approval** | Pending Manual QC |

## Privacy considerations

National ID and passport masked on detail view (last four digits). Audit payloads avoid full sensitive identifiers.

## Known limitations

- No photo capture
- No patient merge or deceased status
- Duplicate override uses route `canApprove` rather than separate permission resource
- Single-tenant demo seed only (ABMG)

## Future integration contract

Appointment, queue, billing, and clinical modules should reference `Patient.id` + `tenantId`; operational records carry their own `branchId`.

## Deployment notes

```text
git pull
docker compose build app
docker compose run --rm app npx prisma migrate deploy
docker compose run --rm app npm run db:seed
docker compose up -d
```

Include seed in production only if your production seed policy allows demo/reference data.

## Rollback notes

If no production patient data exists, rollback migration `20260724120000_mod15_patient_registration`. If patients exist, do not drop tables without data migration plan.
