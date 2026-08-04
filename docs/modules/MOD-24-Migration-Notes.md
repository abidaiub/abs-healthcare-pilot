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

**Prerequisite:** the corrected source must be committed, pushed, pulled on the QC host, and the version-matched
`qc` image rebuilt. The production `app` image has no Prisma CLI or migration directory; all migration recovery runs
as an explicit one-off QC job.

```bash
# 0. On the QC host: get corrected source and build version-matched images
git pull
docker compose build app qc

# 1. Stop the app while repairing migration state
docker compose stop app

# 2. Mark the failed polish migration as rolled back
docker compose run --rm qc npx \
  prisma migrate resolve --rolled-back 20260724130000_mod24_release_polish

# 3. Deploy remaining history (patched polish + MOD-21..24 creates + deferred polish)
docker compose run --rm qc npm run db:migrate:deploy

# 4. Confirm
docker compose run --rm qc npx prisma migrate status
docker compose up -d app
docker compose run --rm qc npm run verify:smoke
```

If `migrate resolve` reports the migration is not in a failed state, skip step 2 and run `migrate deploy` only.

Prisma keeps the failed and rolled-back attempts as history rows in `_prisma_migrations`
(`applied_steps_count = 0`, `rolled_back_at` set). That is expected audit history — do not delete those rows.
A successful row for the same migration name is appended by step 3.

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

Some environments (including the local development database) applied the **old** polish migration successfully because
`migrate dev` had already created `lab_report_releases` before the out-of-order timestamp was reached. Patching the file
changes its checksum, so the stored `_prisma_migrations.checksum` no longer matches:

```text
20260724130000_mod24_release_polish
  file sha256  : 7410d16e73797522225747c6407b492e44a8bcfc54c2a799cecbb824779a00f7
  db  checksum : d16ba5c9346c24988d94e5f22f1ad1d55ddb7df58c6cd3787dacdad05763dee1
```

Verified on Prisma **7.8.0** (2026-07-30): `migrate deploy` and `migrate status` **do not fail** on this mismatch for an
already-applied migration. Deploy proceeds and applies only the pending
`20260724261000_mod24_release_polish_deferred`, which is a no-op on the existing columns
(`ADD COLUMN IF NOT EXISTS` + idempotent `UPDATE`).

Consequently:

- Do **not** hand-edit `_prisma_migrations.checksum`.
- Do **not** run `migrate resolve --applied` as a workaround.
- Do **not** run reset / `db push` / reseed.

Limitation: `prisma migrate dev` (development only) is stricter than `deploy` about edited applied migrations and may
prompt for a reset. Use `migrate deploy` on any database that holds real data.

## Fresh database behavior

Sorted migration history now succeeds from zero:

1. Early polish → tenant flags only (release tables absent, guarded blocks skipped).
2. MOD-22 / MOD-24 create migrations → tables + enums.
3. Deferred polish → release hold/`state_version` columns + clinical cleanup.

## Fresh-database test evidence (2026-07-30)

Docker is not installed on the development workstation, and the `abshealthcare` role has no `CREATEDB`. A genuinely
isolated target was therefore produced with a **separate temporary PostgreSQL 18.2 cluster** (own data directory, own
port `55432`, trust auth), leaving the development instance on `5432` untouched.

```text
cluster : %TEMP%\abs_pg_migtest_20260730065243   (port 55432, disposable)
test DB : abs_healthcare_migration_test_20260730065243
command : npx prisma migrate deploy      (not db push)
```

| Test | Target | Result |
| --- | --- | --- |
| A — fresh deploy (working tree, 25 migrations) | `abs_healthcare_migration_test_*` | all 25 applied, `applied_steps_count = 1` each, `migrate status` up to date |
| B — QC failure reproduction (source `e93ae08`, 19 migrations) | `abs_healthcare_qc_recovery_sim_*` | reproduced `P3018` / `42P01` on `20260724130000`, `applied_steps_count = 0` |
| B — recovery (`resolve --rolled-back` + `deploy` on corrected source) | same DB | remaining 12 migrations applied, status up to date |
| C — environment that already applied the old polish | `abs_healthcare_preapplied_sim_*` | changed checksum tolerated, only the deferred polish applied, pre-existing tenant row preserved |

Post-deploy catalog verification on the fresh database (`information_schema` / `pg_catalog`):

- 7 MOD-24 tables present, no duplicate relations.
- All 15 polish columns on `lab_report_releases`, with `state_version NOT NULL DEFAULT 0` and both
  `*_hold_active` columns `NOT NULL DEFAULT false`.
- 3 `tenants` release-policy flags present, `NOT NULL DEFAULT false`.
- Enums single-instance with expected labels; `LabResultStatus` contains `RELEASE_PENDING` and `RELEASED`.
- 34 indexes on MOD-24 tables including all unique constraints; no duplicate index names.
- 22 foreign keys with expected delete rules; no duplicate constraint names.

### Cleanup artifact — not a migration failure

`pg_ctl start` on Windows keeps holding the server process, so the shell that launched the temporary cluster never
returned. Its trailing connectivity check therefore executed only after the cluster had already been shut down during
cleanup, producing a late `connection refused` on port `55432` and a non-zero exit.

This is a teardown artifact of the test harness. The cluster started correctly (`server started`), connectivity was
confirmed separately at the time, and every migration and validation above ran through it successfully. Do not read that
notification as a migration failure. After cleanup, port `55432` is free, no temporary database or data directory
remains, and the development instance on `5432` is untouched (migration history row count unchanged).

## Known drift limitations (pre-existing, not MOD-24)

`prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma` against the freshly migrated database
reports **no MOD-24 drift**. It does report pre-existing, unrelated gaps that this repair intentionally does not touch:

- `user_branches` (`model UserBranch`, added in `1eb7dd8`) previously had **no migration**;
  repair migration `20260730093000_add_user_branches` is now committed. Fresh databases
  and seed are verified; QC redeployment is still pending.
- Two `audit_logs` indexes declared in `schema.prisma` are absent from migrations.
- Several index names differ only by PostgreSQL's 63-character identifier truncation (cosmetic).
- At commit `ba5e4a7`, `LabSample.sampleStatus` is missing `@map("sample_status")`; migrations create the column as
  `sample_status`. A fix exists in the working tree but is not yet committed.

These require separate, approved migrations and must not be folded into the MOD-24 ordering repair.

Consequence observed during testing before the UserBranch repair: a database built **only**
from `prisma/migrations` could not be seeded — `prisma db seed` failed with
`P2021 TableDoesNotExist` on model `UserBranch`. That blocker is resolved by
`20260730093000_add_user_branches`; see `docs/modules/MOD-02-Migration-Notes.md`.
This does not affect the QC recovery above (recovery applies migrations only and does
not reseed), but any brand-new environment provisioning required the UserBranch migration
before this commit. Read-only pre-check before considering a seed anywhere:

```sql
SELECT to_regclass('public.user_branches') AS user_branches;
```
