# MOD-02 Migration Notes — UserBranch / user_branches

| Field | Value |
|-------|-------|
| **Module** | MOD-02 — User Management & RBAC |
| **Related modules** | MOD-07 Branch / Location Management |
| **Migration** | `20260730093000_add_user_branches` |
| **Status** | UserBranch migration and fresh seed verified; QC redeployment pending |

## Root cause

Commit `1eb7dd8` (MOD-02/03 IAM foundation) added `model UserBranch` mapped to
`user_branches`, plus seed, RBAC, and branch-resolution runtime code. No committed
Prisma migration ever created the table.

Consequences observed before this repair:

- Fresh databases built only from `prisma/migrations` had no `public.user_branches`.
- `npx prisma db seed` failed with Prisma `P2021` / `TableDoesNotExist` on model
  `UserBranch`.
- Some development/QC databases contained the table only because it was created out
  of band (for example `prisma db push` during AI-QC).

This was separate from the MOD-24 migration-order repair and the later
`LabSample.sampleStatus` `@map("sample_status")` client-mapping fix.

## Intended table structure

| PostgreSQL column | Prisma field | Type | Null | Default |
|---|---|---|---|---|
| `id` | `id` | TEXT (cuid) | NOT NULL | — |
| `tenant_id` | `tenantId` | TEXT | NOT NULL | — |
| `user_id` | `userId` | TEXT | NOT NULL | — |
| `branch_id` | `branchId` | TEXT | NOT NULL | — |
| `is_primary` | `isPrimary` | BOOLEAN | NOT NULL | `false` |
| `is_active` | `isActive` | BOOLEAN | NOT NULL | `true` |
| `created_at` | `createdAt` | TIMESTAMP(3) | NOT NULL | `CURRENT_TIMESTAMP` |
| `created_by` | `createdBy` | TEXT | NULL | — |
| `updated_at` | `updatedAt` | TIMESTAMP(3) | NOT NULL | — |
| `updated_by` | `updatedBy` | TEXT | NULL | — |

### Constraints and indexes

- Primary key: `user_branches_pkey` on `id`
- Unique: `(user_id, branch_id)` via `user_branches_user_id_branch_id_key`
- Indexes: `tenant_id`, `user_id`, `branch_id`, `(tenant_id, is_active)`
- Foreign keys (ON DELETE/UPDATE CASCADE):
  - `tenant_id` → `tenants.id`
  - `user_id` → `users.id`
  - `branch_id` → `branches.id`

### Tenant and assignment rules

- `tenantId` is stored on every assignment row and is checked at runtime.
- Application code requires user and branch to belong to the same tenant as the
  assignment (`src/lib/branch/resolve.ts`, `src/app/actions/tenant-branches.ts`).
- One user may be assigned to multiple branches within a tenant.
- One branch may have multiple users.
- `isPrimary` marks the default working branch; the application resolves branch
  context using primary-first logic but does **not** enforce a database unique
  constraint on primary rows.

## Forward-only repair strategy

Migration `20260730093000_add_user_branches` uses catalog-aware reconciliation:

| Database state | Behavior |
|---|---|
| Table absent | Creates the exact Prisma table, indexes, and foreign keys |
| Compatible existing table | Validates required columns/types/nullability, then adds only missing compatible indexes/constraints |
| Incompatible structure or data | Fails with an explicit `RAISE EXCEPTION` (missing columns, wrong types, duplicate `(user_id, branch_id)`, orphan FK targets, tenant/user/branch mismatches) |

The migration does **not** use `prisma db push`, `migrate reset`, or manual edits to
`_prisma_migrations`.

Read-only pre-check before QC deploy or seed:

```sql
SELECT to_regclass('public.user_branches') AS user_branches;
```

## Fresh-environment evidence

Isolated candidate tested from `origin/main` (`fe39ad5`) plus this migration only (not the
dirty working tree’s unrelated uncommitted migrations):

| Check | Result |
|---|---|
| Target | Temporary PostgreSQL cluster `127.0.0.1:55434`, database `abs_healthcare_userbranch_test_*` |
| `npx prisma migrate deploy` | **21** migrations applied (20 at `fe39ad5` + `20260730093000_add_user_branches`) |
| `npx prisma migrate status` | Database schema is up to date |
| `user_branches` catalog | Table, 10 columns, PK, unique `(user_id, branch_id)`, 4 secondary indexes, 3 FKs |
| `npm run db:seed` | PASS — no `P2021` / `UserBranch` failure |
| Seeded rows | 16 on first run; 18 after idempotent rerun (upserts) |
| Integrity | 0 orphan users/branches, 0 duplicate pairs, 0 tenant mismatches |
| `npm run verify:mod02` / `verify:mod07` | PASS |
| Compatible existing table path | PASS — table created manually after 20 migrations; migration 21 reconciled indexes/FKs |
| `user_branches` drift vs HEAD schema | none reported |

## QC deployment dependency

QC recovery for MOD-24 and subsequent fresh provisioning remain blocked until this
commit is present on `origin/main` and redeployed. Do **not** mark MOD-02 or MOD-07
production-ready until QC has redeployed and re-verified.

Recommended QC sequence (run only after confirming this commit is on `origin/main`):

1. Read-only check: `SELECT to_regclass('public.user_branches');`
2. Pull the new commit and rebuild the Docker app image.
3. Keep the app stopped during manual Prisma work.
4. Run Prisma commands with `--entrypoint npx` because the app entrypoint auto-runs
   `prisma migrate deploy`.
5. Use `prisma migrate resolve --rolled-back` only for the known failed MOD-24 step if
   still required, then `prisma migrate deploy`.
6. Never use `db push`, `migrate reset`, `resolve --applied`, or manual
   `_prisma_migrations` edits.
7. Start the app only after `migrate deploy` succeeds.
8. Do not run seed automatically on QC unless explicitly approved after checking QC
   business data.

## Remaining unrelated drift

Other pre-existing schema gaps (for example missing `audit_logs` indexes, cosmetic
index-name truncation, unrelated uncommitted module migrations in local working trees)
are outside this repair and require separate approved work.
