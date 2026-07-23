# AI QC Report — MOD-17 Appointment & Queue Management v1.0

| Field | Value |
|-------|-------|
| **Module** | MOD-17 |
| **Report date** | 2026-07-24 |
| **Automated verify** | `npm run verify:mod17` |
| **Overall status** | PASS (automated) |

## Summary

MOD-17 implements tenant-isolated OPD appointments with branch-aware scheduling, transactional appointment numbering, doctor-wise daily queue tokens, slot validation, patient master integration (MOD-15), RBAC, audit hooks, localization (5 locales), and Module Registry compliance.

## Automated checks

| Area | Result |
|------|--------|
| Prisma schema + migration | PASS |
| Appointment number uniqueness per tenant | PASS |
| Counter-based AP numbering | PASS |
| Queue token daily increment | PASS |
| Past date / slot validation | PASS |
| Duplicate slot prevention | PASS |
| RBAC resources MOD-17 | PASS |
| Reception permissions | PASS |
| MOD-07 branch resolver regression | PASS |
| MOD-15 patient seed regression | PASS |
| i18n `appointment` namespace (5 locales) | PASS |
| Translation key parity | PASS |
| RTL locales (ar-SA, ur-PK) | PASS |
| Module Registry governance | PASS |
| DB `module_registry` entry | PASS |

## Manual QC

**Status: NOT TESTED** — browser scenarios documented in `docs/AI-QC/manual-qc/source/017-Appointment-Queue-Management-Manual-QC-v1.0.md`.

## Production approval

**Pending Manual QC** — do not mark production approved until manual QC and browser UAT complete with evidence.

## Known gaps

- Browser UAT not executed in this automated pass
- Doctor schedule master / recurring calendars deferred
- Full non-English appointment copy may use English placeholders in some keys
