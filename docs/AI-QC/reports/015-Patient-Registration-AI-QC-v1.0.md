# AI QC Report — MOD-15 Patient Registration v1.0

| Field | Value |
|-------|-------|
| **Module** | MOD-15 |
| **Report date** | 2026-07-24 |
| **Automated verify** | `npm run verify:mod15` |
| **Overall status** | PASS (automated) |

## Summary

MOD-15 implements tenant-isolated patient master registration with branch-aware creation, transactional patient numbering, duplicate detection, lifecycle controls, RBAC, audit hooks, localization (5 locales), and Module Registry compliance.

## Automated checks

| Area | Result |
|------|--------|
| Prisma schema + migration | PASS |
| Patient number uniqueness per tenant | PASS |
| Counter-based numbering | PASS |
| DOB / age validation | PASS |
| Mobile normalization | PASS |
| Duplicate detection rules | PASS |
| RBAC resources MOD-15 | PASS |
| Reception permissions | PASS |
| MOD-07 branch resolver regression | PASS |
| i18n `patient` namespace (5 locales) | PASS |
| Translation key parity | PASS |
| RTL locales (ar-SA, ur-PK) | PASS |
| Seed idempotency | PASS |
| Module Registry governance | PASS |
| DB `module_registry` entry | PASS |

## Manual QC

**Status: NOT TESTED** — browser scenarios documented in `docs/AI-QC/manual-qc/source/015-Patient-Registration-Manual-QC-v1.0.md`.

## Production approval

**Pending Manual QC** — do not mark production approved until manual QC and browser UAT complete with evidence.

## Known gaps

- Browser UAT not executed in this automated pass
- Photo upload deferred
- No second demo tenant in seed (tenant isolation validated in automated duplicate/query tests)
