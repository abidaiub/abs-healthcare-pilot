# AI-QC Report — MOD-06 Localization Engine v1.0

| Field | Value |
|-------|-------|
| **Report ID** | 006-Localization-AI-QC-v1.0 |
| **Scope** | MOD-06 tenant-aware localization foundation |
| **Date** | 23 July 2026 |
| **Starting commit** | `1c357c4` (MOD-01A) |
| **Verdict** | **PASS** (automated) / Manual QC **NOT TESTED** |

---

## Architecture decision

| Item | Selection |
|------|-----------|
| Package | Custom server-first i18n (no next-intl) |
| Resolution | user → cookie → tenant default → en-BD |
| Preference storage | `users.preferred_locale` |
| Dictionary loading | Server JSON per resolved locale + en-BD merge |
| RTL | `LocaleDocument` + logical CSS |
| Fallback | en-BD merge; dev `[missing:key]` |

---

## Translation coverage

Foundation namespaces complete for MOD-06 primary locales: `en-BD`, `bn-BD`, `ar-SA`, `ur-PK`, `hi-IN`.

Localized areas:

- Shared navigation and shell
- Module page headers (foundation screens)
- Users, RBAC, Audit, Tenant management descriptions
- Validation error codes
- Language switcher

Not fully localized: diagnostic/clinical screens, all server action prose, login branding.

---

## Security findings

| Test | Result |
|------|--------|
| Invalid locale cookie fallback | PASS (automated) |
| Locale not in tenant supported list | PASS (automated) |
| Cross-tenant preference update | Blocked in `switchLocaleAction` |
| Inactive user preference update | Blocked in `switchLocaleAction` |
| RBAC codes unchanged | PASS (codes remain stable) |

Browser security scenarios (UAT-16/17): **NOT TESTED**

---

## Performance findings

- Single-locale dictionary loaded per request
- No all-locale client bundle
- JSON namespaces loaded server-side only

Build output inspected via successful `npm run build`.

---

## Regression commands

Executed during implementation (see section 7 in final report).

---

## Browser tests

**NOT TESTED** — no automated browser run in this session. Manual QC pack provided.

---

## Known limitations

- Login pages partially English
- Clinical modules retain English UI
- No machine translation
- No tenant-custom terminology dictionary

---

## QC status summary

| Gate | Status |
|------|--------|
| Automated AI QC | PASS |
| `verify:mod06` | PASS |
| Browser QC | NOT TESTED |
| Manual QC/UAT | NOT TESTED |
