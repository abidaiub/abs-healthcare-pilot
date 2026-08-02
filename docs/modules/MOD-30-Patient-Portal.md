# MOD-30 — Patient Portal

| Field | Value |
|---|---|
| **Module** | MOD-30 |
| **Display name** | Patient Portal |
| **Depends on** | MOD-15, MOD-24 + platform identity/audit |
| **Status** | J-01 BROWSER UAT PASS — MANUAL QC PENDING |

## Purpose

Provide patient-scoped authentication and self-service access to released laboratory reports while recording report views and PDF downloads.

## J-01 Part 3 QC

Browser UAT on 2026-08-02 passed for `PT-000009`: approved counter enrollment, patient login, identity display, exactly three own released reports, TSH PDF download and logout. Read-only verification proved a `PORTAL:PT-000009` PDF audit and denial of another patient's release. No direct report-detail route or patient-facing audit screen exists; those controls are verified at the server-query/audit layer.
