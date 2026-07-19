# AI-QC Reports

This folder stores **completed AI Quality Control reports** for ABSHealthcareLite.

---

## Rules

| Rule | Description |
|------|-------------|
| **One report per module per QC run** | Each audit produces one markdown file |
| **Do not overwrite signed-off reports** | Re-QC uses a new filename (e.g. `-R2` suffix) |
| **Use the official template** | Copy from `../AI-QC-Report-Template.md` |
| **Naming convention** | `NNN-<ModuleSlug>.md` — three-digit sequence + short module name |

---

## Naming Examples

| File | Scope |
|------|-------|
| `001-Foundation.md` | G0 — startup, build, login, sessions, DB foundation |
| `002-Host.md` | MOD-01 — Host console, tenant management, SaaS |
| `003-Tenant.md` | Tenant workspace foundation |
| `004-MasterServiceCatalog.md` | MOD-10 |
| `005-PatientRegistration.md` | MOD-15 |
| `006-SampleCollection.md` | MOD-21 |
| `007-ResultEntry.md` | MOD-22 |
| `008-Verification.md` | MOD-23 |
| `009-ReportRelease.md` | MOD-24 |
| `010-PatientPortal.md` | MOD-30 |

Re-QC example: `001-Foundation-R2.md`

---

## Report Lifecycle

```
Draft → Reviewed → PASS/FAIL issued → Manual QA handoff → Archived
```

Link each report to backlog finding IDs in `../backlog/`.

---

## Current Reports

_No reports filed yet. This folder is intentionally empty except for this README._
