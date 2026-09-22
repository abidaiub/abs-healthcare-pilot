# Schema and migration reconciliation

Date: 2026-09-22

## Independent baseline

`migrations/0001_baseline.sql` is the Lab Lite baseline. Forward migration `0002_patient_billing.sql` adds Phase 2 billing, and `0003_hybrid_client.sql` adds Phase 3 device enrollment, catalog snapshots, sync inbox/events, and offline-action requests without rewriting earlier migrations. All are tracked by `lab_lite_schema_migrations` with SHA-256 checksums. Lab Lite does not reuse or modify the original Prisma migration ledger. Applied migration files are immutable.

The migration runner refuses any expected database name except `abs_lab_lite_dev` or `abs_lab_lite_test`, then verifies `current_database()` before creating a ledger or applying SQL. Test cleanup has the same identity guard.

## Ownership model

- Global, versioned and provenance-bearing: `catalog_templates`, `catalog_template_fields`, `catalog_template_ranges`.
- Tenant-owned: settings, branches, roles, permissions, users, sessions, groups, specimens, units, installed tests, installed result fields/ranges, doctors, referral partners, and patients.
- Template installation is an upsert. It preserves tenant price unconditionally and preserves test/field/range values when their customization flag is set.
- Every tenant child reference uses a composite `(tenant_id, id)` foreign key where cross-tenant attachment would otherwise be possible.
- Clinical-looking catalog content must carry provenance and review status. Tenant-authored ranges start as `UNREVIEWED`. Patient findings are not catalog defaults.
- Posted finance uses immutable `bills`/`bill_lines`, append-only `collections` and `bill_adjustments`, maker/checker `refunds`, tenant-scoped `billing_requests`, and `receipt_print_events`.
- Stable operation IDs are tenant-unique. A canonical payload hash prevents reuse with changed business content.

## RLS decision

PostgreSQL row-level security is intentionally not claimed in Phase 1. Tenant isolation currently uses composite database constraints plus mandatory tenant predicates in repositories/services. Enabling RLS while the application connects as the table owner would provide misleading protection.

A later RLS migration must first create a non-owner application role, set `app.tenant_id` with `SET LOCAL` inside every transaction, define policies for every tenant table, and add pooled-connection leakage tests. Until that complete design exists, partial RLS is prohibited.

## Reconciliation with the existing pilot

The original pilot database remains `abs_healthcare_pilot`. The final read-only reconciliation found 36 rows in `_prisma_migrations`, of which 34 are active and two are rolled back. Both rolled-back rows have the migration name `20260726060000_mod22_analyzer_lis_integration`, with rollback timestamps `2026-07-26T01:37:36.836Z` and `2026-07-26T01:38:57.609Z`. The last active migration remains `20260808120000_walk_in_billing_hold`, applied at `2026-08-13T08:38:48.147Z`.

This resolves the reported 34-to-36 change: 36 is the total ledger-row count, while 34 is the non-rolled-back migration count. No history was altered, and no Lab Lite migration was pointed at the original database.

The existing migration audit found historical checksum drift in these already-applied files:

- `20260724130000_mod24_release_polish`
- `20260726010000_mod17_doctor_schedule`
- `20260804120000_user_auth_epoch`
- `20260805100000_walk_in_direct_diagnostic_billing`
- `20260805180000_referral_source_master`
- `20260805183000_backfill_referral_snapshots`
- `20260805210000_walk_in_dual_referral`

Those files were not edited. Auth/session ideas and directory/billing concepts were manually adapted into the independent baseline; MOD24 and doctor scheduling were excluded. The billing implementation stops at pure calculations and quote snapshots because the existing write flow does not yet make due validation, invoice creation, and initial payment atomic and replay-safe.

## Extracted-source provenance

Reference commit: `5ba70fe0893f0f852a031e3fcbcf52358f7ba4b8`. Files marked “working tree” were uncommitted sources and must not be treated as a released baseline.

| Reference | State | SHA-256 |
|---|---|---|
| `docs/Architecture/Hybrid-Lab-Billing-Reuse-Audit-2026-09-22.md` | working tree | `4B8710266281E8BDF2F9D1BE589C73EC7A640D520E2B5C0C6DA932F3D35EFB23` |
| `src/lib/password.ts` | working tree | `2F04C4ACC475200173ADF871AF28A3DC6E3089F6F35FA903FE2B196FB63AB55B` |
| `src/lib/security/tokens.ts` | working tree | `D6A19C89E95D133EE39A1FA8EE5B99D664B8EAC24780FC6B77651EC9063FC973` |
| `src/lib/billing/money.ts` | committed reference | `E04EB4395584CCD5BAD73B55D71EE837D7A714414FF653FF2C607F18E88D4690` |
| `src/lib/billing/totals.ts` | committed reference | `CCC4A317FE8BEB405FA00C41F23A5EA9025AB3B4917D07CE242AD15DFD7F29EA` |
| `src/lib/patient/normalize.ts` | committed reference | `478C41E3D95412914C19B8E980EC5D55B574ACCECDC4F09E66A33D3A48F634BC` |
| `src/lib/patient/duplicates.ts` | committed reference | `9D0B8482C391302F9447119035D9BF34F805F3BA8CE2A22C20FB78155F9F3DE4` |
| `prisma/seed/data/host-diagnostic-catalog-data.ts` | committed reference | `643B0E699F062A9366135BB4AB3A209A868B069C603DD48EC702ED569EFDE842` |

These hashes were captured before extraction; the source files and parent documentation were not copied into `lab-lite`. Extracted code was reduced and adapted to Lab Lite boundaries.

## Forward migration policy

1. Add a numbered SQL migration; never alter an applied migration.
2. Test from an empty `abs_lab_lite_test` database and from the previous Lab Lite schema.
3. Verify cross-tenant negative cases and repeatability for every catalog change.
4. Require provenance/review-state handling for catalog/range changes.
5. Keep offline financial authority within the Phase 3 policy: new bill plus initial collections only; due collection and posted adjustments remain server-confirmed.
