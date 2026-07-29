# MOD-24 Migration Notes — Release Polish Ordering Repair

## Problem

Migration `20260724130000_mod24_release_polish` is timestamped **before** the tables it alters:

| Migration | Role |
| --- | --- |
| `20260724130000_mod24_release_polish` | Added tenant release-policy flags + polish columns on `lab_report_releases` + clinical status cleanup |
| `20260724240000_mod22_laboratory_result_entry` | Creates `lab_results` |
| `20260724260000_mod24_report_release` | Creates `lab_report_releases` / versions / deliveries and adds `RELEASE_*` enum labels |

On fresh / QC databases that had only completed through `20260724120000_mod15_patient_registration`, deploy failed with:

```text
42P01 relation "lab_report_releases" does not exist
```

`applied_steps_count` was `0` (transaction rolled back; no polish DDL retained).

## Repair strategy (forward-compatible)

Do **not** rename the published polish migration (other environments may already have it recorded).

1. **`20260724130000_mod24_release_polish`** (patched in place)
   - Always applies tenant policy columns (`IF NOT EXISTS`).
   - Applies `lab_report_releases` polish columns only when that table exists in `current_schema()`.
   - Applies `lab_results` `RELEASE_* → VERIFIED` cleanup only when the table and enum labels exist.
2. **`20260724261000_mod24_release_polish_deferred`** (new, after report-release create)
   - Idempotently applies the same release polish columns and clinical-status cleanup once prerequisites exist.

### Dependency audit of polish SQL

| Object | Created by | Used by polish |
| --- | --- | --- |
| `tenants` | early SaaS foundation | policy columns — always safe |
| `lab_report_releases` | `20260724260000_mod24_report_release` | hold / `state_version` columns |
| `lab_results` | `20260724240000_mod22_laboratory_result_entry` | status cleanup |
| `LabResultStatus.RELEASE_PENDING` / `RELEASED` | `20260724260000_mod24_report_release` | status cleanup filter |

No other MOD-21–MOD-24 indexes/constraints are required by the polish SQL.

## Safe QC recovery (no reset / no reseed)

On the QC database that failed with `applied_steps_count = 0`:

```bash
# 1. Mark the failed polish migration as rolled back (required if Prisma recorded the failure)
npx prisma migrate resolve --rolled-back 20260724130000_mod24_release_polish

# 2. Deploy remaining history (includes patched polish + create + deferred polish)
npx prisma migrate deploy

# 3. Confirm MOD-24 objects
npx prisma migrate status
npm run verify:mod24
```

If `migrate resolve` reports the migration is not in a failed state, skip step 1 and run `migrate deploy` only.

### Optional verification queries

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'lab_report_releases'
  AND column_name IN ('state_version', 'billing_hold_active', 'quality_hold_active')
ORDER BY 1;

SELECT column_name
FROM information_schema.columns
WHERE table_name = 'tenants'
  AND column_name LIKE 'lab_report_release_enforce_%'
ORDER BY 1;
```

## Environments that already applied the old polish successfully

Patched migration content changes the file checksum. If `migrate deploy` reports a checksum mismatch for `20260724130000_mod24_release_polish`:

1. Confirm polish columns already exist on `lab_report_releases`.
2. Update the stored checksum to match the repaired file (Prisma records this in `_prisma_migrations.checksum`), **or** follow the current Prisma troubleshooting guide for edited applied migrations.
3. Deploy so `20260724261000_mod24_release_polish_deferred` runs (no-op via `IF NOT EXISTS` / idempotent `UPDATE`).

Do **not** re-run destructive reset/seed.

## Fresh database expectation

Sorted migration history now succeeds from zero:

1. Early polish → tenant flags only (release tables absent).
2. MOD-22 / MOD-24 create migrations → tables + enums.
3. Deferred polish → release hold/`state_version` columns + clinical cleanup.

## Local smoke tests used

- `npx tsx scripts/tmp-test-mod24-migration-order.ts` — schema-scoped polish behavior
- `npx tsx scripts/tmp-test-mod24-migration-from-zero.ts` — full SQL history apply in a disposable schema

(`CREATEDB` is not granted to the app role on the local Postgres used for development, so a true separate temporary database could not be created; the disposable-schema from-zero apply covers the same SQL ordering risk.)
