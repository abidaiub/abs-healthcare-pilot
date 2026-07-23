# MOD-06 — Tenant-Aware Localization Engine

| Field | Value |
|-------|-------|
| **Module** | MOD-06 |
| **Depends on** | MOD-01A Tenant Locale Profile |
| **Status** | Implemented (foundation coverage) |

---

## Business purpose

Resolve and render application language, text direction, dates, numbers, currency, navigation, validation, and common UI messages using tenant locale configuration and authenticated user preferences.

MOD-06 does not replace MOD-01A tenant profile storage. Clinical and future modules register additional namespaces without redesigning the engine.

---

## Architecture

Custom lightweight i18n layer (no `next-intl` / `react-intl` dependency):

| Layer | Path | Role |
|-------|------|------|
| Constants | `src/lib/i18n/constants.ts` | Fallback locale, primary locales, namespaces |
| Resolution | `src/lib/i18n/resolve.ts` | Deterministic locale precedence |
| Messages | `src/messages/{locale}/*.json` | Namespace dictionaries |
| Loader | `src/lib/i18n/messages.ts` | Server-side JSON loading + en-BD fallback merge |
| Translator | `src/lib/i18n/translate.ts` | `t(key)` helper |
| Server context | `src/lib/i18n/server.ts` | `getServerI18n(session)` |
| Client context | `src/lib/i18n/client.tsx` | `I18nProvider`, `useI18n`, `LocaleDocument` |
| Formatting | `src/lib/i18n/format.ts` | Tenant-aware date/number/currency |
| Switch action | `src/app/actions/locale.ts` | Validated preference + cookie persistence |
| Switcher UI | `src/components/layout/LanguageSwitcher.tsx` | Shared language selector |

### Why custom instead of next-intl

- App uses session/tenant routing, not `[locale]` URL segments.
- Dictionaries are tenant-constrained and loaded server-side per request.
- Avoids routing migration and duplicate client bundles for all locales.
- MOD-01A registry remains authoritative for supported locale codes.

---

## Locale resolution order

1. Authenticated user `preferredLocale` (active user, same tenant)
2. HTTP-only cookie `abs-pilot-locale`
3. Tenant `defaultLocale`
4. Application fallback `en-BD`

Rules:

- Resolved locale must exist in application registry **and** tenant `supportedLocales`.
- Invalid values fall back safely.
- Host console allows MOD-06 primary locales only.
- Locale never changes tenant identity, membership, or authorization.

---

## Supported locales (MOD-06 primary)

| Locale | Direction | Dictionary | Foundation UI |
|--------|-----------|------------|-----------------|
| `en-BD` | LTR | Complete | Complete (reference) |
| `bn-BD` | LTR | Complete | Navigation + foundation screens |
| `ar-SA` | RTL | Complete | Navigation + foundation screens |
| `ur-PK` | RTL | Complete | Navigation + foundation screens |
| `hi-IN` | LTR | Complete | Navigation + foundation screens |

Clinical/diagnostic screens outside foundation modules may remain English until their module namespaces are added.

---

## Translation resources

```
src/messages/{locale}/{namespace}.json
```

Required namespaces:

`common`, `navigation`, `auth`, `tenant`, `users`, `rbac`, `audit`, `validation`, `system`, `profile`, `screens`

Keys are semantic (`common.actions.save`), not English sentences.

Fallback:

```text
requested locale → en-BD merged fallback → dev [missing:key] marker
```

Completeness check: `compareLocaleMessageStructure()` used by `npm run verify:mod06`.

---

## User preference storage

`users.preferred_locale` (nullable). Null means resolve from cookie/tenant/fallback.

Updated only through `switchLocaleAction` with tenant and active-user validation.

---

## RTL strategy

- `LocaleDocument` sets `<html lang dir>` on client after server render.
- CSS uses logical alignment (`text-align: start`) and optional `.rtl-mirror` for directional icons.
- RTL applies only for Arabic/Urdu locales; LTR tenants unaffected.

---

## Formatting

`formatTenantDate`, `formatTenantDateTime`, `formatTenantNumber`, `formatTenantCurrency` in `src/lib/i18n/format.ts`.

- Display preferences: tenant `dateFormat`, `numberFormat`, `currencyCode`, `timezone`
- Storage remains ISO/UTC in database

---

## Security model

- Server-side locale validation on every switch.
- Cross-tenant preference updates blocked.
- Inactive users cannot persist preferences.
- Localized errors use stable codes (`validation.INVALID_LOCALE`).
- Audit/action codes remain language-neutral.

---

## Performance model

- Only resolved locale dictionaries loaded per request.
- JSON read on server; compact pack passed to client provider.
- No all-locale client bundle.
- Static JSON cached by Node module loader in production.

---

## Adding translations (developer)

1. Add key to `src/messages/en-BD/{namespace}.json`.
2. Mirror key in all MOD-06 primary locale folders.
3. Use `t('namespace.key')` in server (`getServerI18n`) or client (`useI18n`).
4. Run `npm run verify:mod06`.

---

## Verification

```bash
npm run verify:mod06
npm run verify:mod01a
npm run build
```

---

## Known limitations

- Login pages partially English
- Diagnostic/clinical screens not fully translated
- No tenant-custom translation dictionary
- Browser QC requires manual UAT pack execution

---

## Acceptance criteria

- [x] Deterministic locale resolution
- [x] Tenant-supported locale restriction
- [x] User preference persistence
- [x] Language switcher in shared shell
- [x] RTL foundation
- [x] Localized navigation + foundation headers
- [x] Central formatting helpers
- [x] Missing-key verification
- [x] Idempotent seed scenarios
- [x] `verify:mod06` passes

Final production approval requires Manual QC evidence.
