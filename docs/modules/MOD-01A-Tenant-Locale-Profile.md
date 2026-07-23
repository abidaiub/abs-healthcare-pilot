# MOD-01A — Tenant Locale and Regional Profile

| Field | Value |
|-------|-------|
| **Module** | MOD-01A (enhancement to MOD-01) |
| **Status** | Implemented |
| **Depends on** | MOD-01 Company/Tenant Management |
| **Blocks** | MOD-06 Localization Engine, MOD-07 Branch/Location |
| **Out of scope** | Translation dictionaries, UI language switching, RTL rendering, localized validation messages |

---

## Purpose

Localization configuration must begin when a tenant is created. Country selection may suggest suitable defaults, but country must not permanently hardcode language. Administrators can override all suggestions before saving.

MOD-01A stores and validates tenant locale preferences only. MOD-06 remains responsible for the full localization engine.

---

## Tenant fields

| Field | Standard | Storage |
|-------|----------|---------|
| `countryCode` | ISO 3166-1 alpha-2/alpha-3 | `tenants.country_code` |
| `country` | Display name | `tenants.country` |
| `defaultLocale` | BCP 47 (`bn-BD`, `en-US`, …) | `tenants.default_locale` |
| `supportedLocales` | Validated JSON array | `tenants.supported_locales` |
| `timezone` | IANA identifier | `tenants.timezone` |
| `currencyCode` | ISO 4217 | `tenants.currency_code` |
| `dateFormat` | Tenant preference string | `tenants.date_format` |
| `numberFormat` | Locale-style key | `tenants.number_format` |
| `textDirection` | `ltr` or `rtl` | `tenants.text_direction` |
| `defaultLanguage` | Legacy `EN`/`BN` sync | `tenants.default_language` |

---

## Application locale registry

Minimum prepared locales (not full translation until MOD-06 QC):

- Bangla: `bn-BD`, `bn-IN`
- English: `en-BD`, `en-US`, `en-IN`, `en-PK`
- Arabic: `ar-SA`, `ar-AE`
- Urdu: `ur-PK`
- Hindi: `hi-IN`

Registry: `src/lib/locale/registry.ts`  
Country suggestions: `src/lib/locale/country-defaults.ts`  
Validation: `src/lib/locale/validation.ts`

---

## Country suggestion behavior

| Country | Primary | Optional | Notes |
|---------|---------|----------|-------|
| Bangladesh (`BD`) | `bn-BD` | `en-BD` | Admin may set English primary |
| Saudi Arabia (`SA`) | `ar-SA` | `en-US` | RTL |
| UAE (`AE`) | `ar-AE` | `en-US` | RTL |
| Pakistan (`PK`) | `ur-PK` | `en-PK` | RTL for Urdu |
| India (`IN`) | `en-IN` | `hi-IN`, `bn-IN` | Does not assume Hindi only |
| International (`INT`) | Admin-defined | Broad registry | Flexible selection |

Country change on the tenant form shows a confirmation banner when locale fields were manually edited. Suggestions apply only after explicit confirmation.

---

## Validation rules

1. Every locale must exist in the application registry.
2. `defaultLocale` must be included in `supportedLocales`.
3. At least one supported locale must remain enabled.
4. Arabic/Urdu default locales require `textDirection = rtl`.
5. Locale input must never infer authorization or tenant identity.
6. Supported locales are not stored as comma-separated free text.

---

## UI integration

- Host tenant create/edit: `src/components/host/TenantFormPanel.tsx`
- Regional profile section: `src/components/host/TenantRegionalProfileFields.tsx`
- Server actions: `src/app/actions/host-tenant.ts`
- Settings API: `GET/PATCH /api/v1/companies/[id]/settings`

---

## Seed and migration

- Idempotent backfill: `prisma/seed/tenant-locale-migration.ts`
- Called from `prisma/seed.ts` after tenant upsert
- ABMG legacy `defaultLanguage: EN` maps to `defaultLocale: en-BD`

---

## Verification

```bash
npm run verify:mod01a
```

Regression:

```bash
npm run verify:mod01
npm run db:seed
npm run build
```

---

## Related documents

- `docs/modules/MOD-01A-Migration-Notes.md`
- `docs/modules/MOD-01A-Rollback-Notes.md`
- `docs/AI-QC/reports/001A-TenantLocaleProfile.md`
- `docs/AI-QC/manual-qc/source/001A-TenantLocale-Supplement-v1.0.md`
