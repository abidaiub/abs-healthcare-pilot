# Master catalog operations

## Storage decision

The checked-in, versioned JSON is the release source. PostgreSQL is the operational master. The application never reads the user-supplied ZIP, workbook, or CSV files at runtime.

1. `catalog/abs-dx-draft-1.0/catalog.json` preserves stable test and field keys.
2. `npm run seed:master` validates the pinned hashes and structural invariants, then idempotently loads global `catalog_releases`, `catalog_templates`, and `catalog_template_fields` rows.
3. A lab or hospital tenant installs a cumulative tier from those global rows. The tenant receives owned `tenant_tests` and `tenant_result_fields` rows.
4. Refresh uses stable template/field keys. It does not replace tenant prices, activation state, or fields explicitly marked as customized.

## Draft safety boundary

`ABS-DX-DRAFT-1.0` contains 312 Starter, 444 Medium, and 725 Advanced cumulative templates with 3,571 field definitions. It has structural validation only. It has no approved price, discount, result default, or reference range.

The global templates are available for controlled configuration, carry `UNREVIEWED`, and set `tenant_default_active=false`. A tenant tier installation therefore creates disabled tests. Import is not clinical approval and must not make a test billable or publishable.

Before activation, an authorized local reviewer must approve the offered service, specimen and container, method/analyzer, units, choice lists, repeat-group behavior, required fields, reference ranges, price, discount policy, and report format. This implementation does not invent those values.

## Commands

Run from `lab-lite` with the target environment file selected:

```powershell
$env:DOTENV_CONFIG_PATH = ".env.local"
npm run db:migrate
npm run seed:master
npm run verify:master-catalog
```

The database identity guard still requires the matching `EXPECTED_DATABASE_NAME`. Publish a new catalog directory and migration-compatible release code for future versions; do not edit a published canonical JSON file in place.
