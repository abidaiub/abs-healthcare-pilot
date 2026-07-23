# MOD-02 / MOD-03 Implementation Specification

**Project:** ABSHealthcareLite Pilot  
**Date:** 23 July 2026  
**Scope:** MOD-02 User Management + MOD-03 Role & Permission (delivered as combined IAM foundation)

---

## 1. Roadmap Verdict

| Question | Answer |
|----------|--------|
| Authoritative next module after MOD-01? | **MOD-03 Role & Permission** (dependency-only on MOD-01), immediately followed by **MOD-02 User Management** |
| Pilot delivery unit | **Combined MOD-02/MOD-03 IAM foundation** — matches `saas-foundation-data.ts` label "User Management & RBAC" |
| Sprint alignment | Sprint 1 Foundation: 01 → 03 → 02 → 04 → 06 per `docs/Architecture/02-DevelopmentSequenceGuide.md` |

MOD-02 explicitly depends on MOD-01 and MOD-03. MOD-01 AI QC passed; no MOD-01 blockers remain for IAM work.

---

## 2. MOD-01 Status (unchanged)

| Gate | Status |
|------|--------|
| Development | Complete |
| AI QC | PASS (`001-Foundation-ReQC-01.md`) |
| Manual QC | In progress (independent QC engineer) |
| Open P2 items | Export report, host settings placeholders, naming drift — non-blocking |

Deferred cross-module item **FND-2026-014** (module route gating) is addressed in this module via permission checks on IAM routes and seeded permission matrix.

---

## 3. Implementation Summary

### Schema

- Added `UserBranch` model for primary branch assignment
- Existing `User`, `Role`, `UserRole`, `Permission` models used as-is

### Routes

| Route | Screen |
|-------|--------|
| `/settings/users` | User list |
| `/settings/users/new` | Create user |
| `/settings/users/[userId]` | Edit user / reset password |
| `/settings/roles` | Role list |
| `/settings/roles/new` | Create role |
| `/settings/roles/[roleId]/permissions` | Permission matrix |

### Server actions

- `src/app/actions/tenant-users.ts` — CRUD, password reset, activate/deactivate/unlock
- `src/app/actions/tenant-roles.ts` — role CRUD, permission matrix save, copy permissions

### RBAC library

- `src/lib/rbac/permission-catalog.ts` — tenant route resource catalog
- `src/lib/rbac/queries.ts` — user/role queries, effective permissions
- `src/lib/rbac/auth.ts` — `requireTenantPermission()` guard

### Seed data (ABMG tenant)

| Username | Role | Password |
|----------|------|----------|
| `laila.hasan` | TENANT_ADMIN | `Tenant@2026!` |
| `arif.hossain` | RECEPTION | `Tenant@2026!` |
| `tania.sultana` | LAB_TECH | `Tenant@2026!` |
| `billing.ops` | BILLING | `Tenant@2026!` |

Roles seeded: `TENANT_ADMIN`, `RECEPTION`, `LAB_TECH`, `BILLING` with permission matrix rows.

### Security enhancements

- Failed login lockout sets `UserStatus.LOCKED` after 5 attempts
- Session includes `roleCode` for navigation and post-login routing
- Permission guards on IAM pages via `requireTenantPermission()`

### Verification

```powershell
npm run verify:mod02
npm run build
```

---

## 4. Acceptance Criteria Mapping

| Criterion | Status |
|-----------|--------|
| Tenant user isolation | Implemented — all queries scoped by `tenantId` |
| Role enforcement | Implemented — permission matrix + route guards on IAM |
| Lockout after 5 failures | Implemented — `login-rate-limit.ts` + `UserStatus.LOCKED` |
| Primary branch assignment | Implemented — `UserBranch.isPrimary` |
| Permission change audit | Implemented — `AuditLog` on matrix save |
| Multilingual / RTL | Deferred — pilot English-only |

---

## 5. Out of Scope (deferred)

- Host cross-tenant user management UI (`/host/users`)
- UserProfile / UserLoginHistory / Session monitor screens
- Full permission-based nav filtering for all diagnostic routes (IAM routes guarded; operational nav still role-code based)
- Signed session cookies (FND-2026-015)

---

## 6. Recommended Next Module

After MOD-02/MOD-03 Manual QC: **MOD-04 Audit Center** or **MOD-06 Localization**, then **MOD-07 Branch/Location** master data per development sequence.
