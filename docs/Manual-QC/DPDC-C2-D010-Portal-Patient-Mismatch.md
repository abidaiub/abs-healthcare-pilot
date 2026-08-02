# DPDC-C2-D010 — Portal account bound to wrong patient

| Field | Value |
|-------|-------|
| **ID** | DPDC-C2-D010 |
| **Severity** | Major |
| **Module** | MOD-30 Patient Portal |
| **Case** | Patient Case 2 — Jannatul Ferdous |
| **Logged** | 2026-07-27 |
| **Status** | FIXED |

## Summary

Portal login `8801712200002` / `Portal@2026!` authenticated successfully but resolved to seeded patient **DP-000002** instead of UAT clinical patient **PT-000006**. Released reports RPT-0000005–7 (LAB-000002) belong to PT-000006 and were invisible in the portal session.

## Root cause

1. **UAT seed** (`DOCTORS_POINT_PORTAL_ACCOUNTS`) binds Case 2 portal credentials to `patientNumber: "DP-000002"` — the seeded duplicate demographics record.
2. **Case 2 browser UAT** registered a **new** patient via `/patients/new`, producing runtime number **PT-000006** with a different primary key (`patientId`).
3. **Portal enrollment** (`seedPortalAccounts` / `enrollPatientPortalAccountAction`) links accounts by resolved `patientId`, not by display name or case label. No product workflow existed to release a username from one patient and enroll another without unsafe SQL.
4. Operators reused seed portal credentials (`8801712200002`) assuming they matched the patient created during UAT registration.

## Fix

- Added **`reassignPortalUsername()`** (`src/lib/portal/reassign-username.ts`) and staff action **`reassignPortalUsernameAction`** with audit events `PORTAL_ACCOUNT_USERNAME_RELEASED` and `PORTAL_ACCOUNT_REASSIGNED`.
- Staff UI on `/settings/patient-portal` — **Reassign portal username** panel (tenant admin / `canApprove`).
- Superseded account: username archived (`archived.{id-suffix}.{username}`), `isActive=false`, `isSuspended=true`, sessions revoked; row preserved for audit.
- Case 2 correction: tenant admin reassigned `8801712200002` from DP-000002 → PT-000006 with documented reason.

## Verification

- Portal login resolves to PT-000006 — Jannatul Ferdous.
- Portal-published reports for PT-000006 only (RPT-0000005–7 when published); unreleased/unpublished hidden.
- Cross-patient direct URL / release id access denied (`findPortalReportForAccess` → RPT-0000001 blocked).
- PDF download creates `LabReportAccessAudit` row (`PORTAL:PT-000006`, RPT-0000005 @ 2026-07-27T16:17:16Z).
- Regression: `npm run verify:dpdc` — **PASS** (portal reassignment block, cross-patient denial, unknown username rejection).
- Case 2 Steps 10–11 browser UAT completed 2026-07-27 — see `DPDC-Case2-Browser-UAT-Live-Log.md`.

## Prevention

- UAT guide updated: distinguish **seed patient number (DP-*)** from **runtime registration (PT-*)**; enroll or reassign portal before release when using UI registration.
- Do not reassign clinical reports via SQL — fix portal ownership only.
