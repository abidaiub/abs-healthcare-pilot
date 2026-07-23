# MOD-06 Localization — Architecture Audit (Phase 1)

Audit date: 23 July 2026

## Findings

| Area | Finding |
|------|---------|
| Localization package | None installed (`package.json` has no i18n dependency) |
| Locale persistence | Mock language `<Select>` in `AppShell` (client state only, EN/BN/AR/UR/HI codes) |
| Tenant locale profile | MOD-01A fields in `tenants` table + registry in `src/lib/locale/*` |
| User preference field | Not present before MOD-06 (`preferredLocale` added) |
| URL locale routing | Absent — session/cookie based app |
| Middleware | No `middleware.ts` |
| Root layout | Static `lang="en"` without `dir` |
| Navigation | Hardcoded English labels in `src/lib/navigation.ts` |
| Validation messages | Hardcoded English in server actions |
| Date/number/currency | Partial — `src/lib/saas/format.ts` uses fixed `en-GB` / BDT helper |
| RTL CSS | No RTL rules before MOD-06 |

## Decision (Phase 2)

Implement custom server-first i18n aligned with existing session/tenant architecture. Rejected `next-intl` due to lack of locale URL routing and added routing complexity.

## Selected loading strategy

Server resolves locale → loads JSON namespaces → passes compact bundle to `I18nProvider` for client components (navigation, switcher).
