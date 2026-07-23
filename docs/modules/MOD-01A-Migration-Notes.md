# MOD-01A Migration Notes

## Migration name

`mod01a_tenant_locale_profile`

## Schema changes

Adds to `tenants`:

- `country_code` (default `BD`)
- `default_locale` (default `en-BD`)
- `supported_locales` JSON (default `["bn-BD","en-BD"]`)
- `currency_code` (default `BDT`)
- `date_format` (default `DD/MM/YYYY`)
- `number_format` (default `en-IN`)
- `text_direction` (default `ltr`)

Existing columns retained:

- `country`, `timezone`, `default_language`

## Apply

```bash
npm run db:migrate
npm run db:seed
npm run verify:mod01a
```

For environments using push instead of migrate history:

```bash
npm run db:push
npm run db:seed
```

## Backfill logic

`migrateTenantLocaleProfiles()` runs on every seed:

1. Reads legacy `country`, `defaultLanguage`, and existing locale columns.
2. Infers a validated profile via `inferLegacyTenantLocaleProfile()`.
3. Writes structured locale fields and syncs legacy `defaultLanguage`.

ABMG seed explicitly sets English-primary Bangladesh profile after migration.

## Compatibility

- API consumers reading `defaultLanguage` continue to receive `EN`/`BN` synced from `defaultLocale`.
- Settings API now also exposes full locale profile fields.
- No authorization behavior changes.

## Post-migration checks

- ABMG: `countryCode=BD`, `defaultLocale=en-BD`, `supportedLocales=["bn-BD","en-BD"]`
- All tenants pass `validateTenantLocaleProfile`
- Second seed pass produces identical locale values (idempotent)
