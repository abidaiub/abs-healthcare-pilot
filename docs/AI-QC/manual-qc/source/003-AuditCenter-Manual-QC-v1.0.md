# MOD-04 Manual QC / UAT Guide — Audit Center

**Version:** 1.0  
**Date:** 23 July 2026

## Pre-checks

```bash
npm run db:seed
npm run verify:mod04
npm run build
```

## Credentials

| Role | Username | Password |
|------|----------|----------|
| Tenant Admin | `laila.hasan` | `Tenant@2026!` |
| Reception | `arif.hossain` | `Tenant@2026!` |

## Test Cases

### TC-01 — Tenant admin opens Audit Center

Login as `laila.hasan` → **Settings → Audit Center** → grid loads with tenant rows only.

### TC-02 — Reception blocked

Login as `arif.hossain` → navigate to `/settings/audit` → access denied / redirect.

### TC-03 — Filters

As admin, filter by **Action = LOGIN** → only LOGIN rows shown. Clear and filter by branch.

### TC-04 — Detail panel

Click **View** on an UPDATE row → old/new field table or summary shown.

### TC-05 — CSV export

Click **Export CSV** → file downloads; row count matches filter scope.

### TC-06 — Self-audit

After TC-04/TC-05, find new VIEW/PRINT rows for AuditLog entity.

### TC-07 — Tenant isolation

As admin, copy a host audit ID (if any) into tenant detail URL → not found.

### TC-08 — Pagination

If >25 rows, use Next/Previous — page changes without error.

## Exit criteria

All TC pass; `verify:mod01`, `verify:mod02`, `verify:mod04` pass.
