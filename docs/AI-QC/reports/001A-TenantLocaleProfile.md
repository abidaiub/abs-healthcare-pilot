# AI-QC Report — MOD-01A Tenant Locale Profile

| Field | Value |
|-------|-------|
| **Report ID** | 001A-TenantLocaleProfile |
| **Scope** | MOD-01A — Tenant locale and regional profile foundation |
| **Parent gate** | MOD-01 Company/Tenant Management |
| **Date** | 23 July 2026 |
| **Verdict** | PASS (automated verification) |

---

## Summary

MOD-01A adds structured tenant locale fields, country-based suggestion logic with administrator override, host tenant form regional profile UI, settings API extensions, idempotent seed migration, and `npm run verify:mod01a`.

Translation engine, UI language switching, and RTL rendering remain deferred to MOD-06 per scope boundary.

---

## Automated evidence

| Check | Result |
|-------|--------|
| Country default suggestion (BD → bn-BD) | PASS |
| Administrator override validation | PASS |
| Unsupported locale rejection | PASS |
| Default locale ∈ supported locales | PASS |
| At least one supported locale | PASS |
| Arabic/Urdu RTL direction | PASS |
| Application registry (bn, en, ar, ur, hi) | PASS |
| ABMG migration compatibility | PASS |
| Idempotent seed migration | PASS |
| All tenants validate after migration | PASS |

Command: `npm run verify:mod01a`

---

## Key files

- `prisma/schema.prisma` — tenant locale columns
- `src/lib/locale/*` — registry, country defaults, validation
- `src/components/host/TenantRegionalProfileFields.tsx`
- `src/app/actions/host-tenant.ts`
- `src/app/api/v1/companies/[id]/settings/route.ts`
- `prisma/seed/tenant-locale-migration.ts`
- `scripts/verify-mod01a-locale.ts`

---

## Limitations (expected)

- No runtime UI translation or dictionary loading (MOD-06)
- No user-level language preference (MOD-06)
- `defaultLanguage` retained as legacy sync field only
- Manual QC supplementary cases in `001A-TenantLocale-Supplement-v1.0.md`

---

## Regression

- `npm run verify:mod01` — must remain PASS
- `npm run build` — must remain PASS
