# MOD-01A Rollback Notes

## When to rollback

Rollback only if MOD-01A causes production tenant create/edit failures or invalid locale data that cannot be corrected via host UI.

MOD-06 should not be started on top of a rolled-back MOD-01A schema.

## Pre-rollback backup

```sql
CREATE TABLE tenants_locale_backup AS
SELECT id, tenant_code, country, country_code, default_locale,
       supported_locales, timezone, currency_code, date_format,
       number_format, text_direction, default_language
FROM tenants;
```

## Application rollback steps

1. Revert commit `MOD-01A: add tenant locale and regional profile foundation`.
2. Restore host tenant form/actions to MOD-01 baseline (country text, timezone, EN/BN select).
3. Run Prisma migration rollback or manual column drop (see below).
4. Regenerate client: `npm run db:generate`
5. Verify MOD-01 baseline: `npm run verify:mod01`

## Database rollback (manual)

If migration was applied:

```sql
ALTER TABLE tenants
  DROP COLUMN IF EXISTS country_code,
  DROP COLUMN IF EXISTS default_locale,
  DROP COLUMN IF EXISTS supported_locales,
  DROP COLUMN IF EXISTS currency_code,
  DROP COLUMN IF EXISTS date_format,
  DROP COLUMN IF EXISTS number_format,
  DROP COLUMN IF EXISTS text_direction;
```

Restore from backup if locale values were corrupted:

```sql
UPDATE tenants t
SET country = b.country,
    timezone = b.timezone,
    default_language = b.default_language
FROM tenants_locale_backup b
WHERE t.id = b.id;
```

## Data loss considerations

Rolling back drops structured locale preferences. `country`, `timezone`, and `defaultLanguage` remain unless manually altered.

## Re-apply

Re-deploy MOD-01A commit, run migration + seed, then `npm run verify:mod01a`.
