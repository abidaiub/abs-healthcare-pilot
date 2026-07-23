# ABSHealthcareLite Manual QC / UAT Guide
## MOD-02 User Management + MOD-03 Role & Permission

**Version:** 1.0  
**Date:** 23 July 2026  
**Environment:** QC Docker / local pilot only  
**Prerequisite:** MOD-01 Manual QC may run in parallel; IAM tests require seeded database

---

## 1. Purpose

Verify tenant-scoped user lifecycle, role definition, permission matrix persistence, account lockout, and RBAC enforcement for the ABMG pilot tenant.

---

## 2. Test Credentials

| Account | Username | Password | Expected role |
|---------|----------|----------|---------------|
| Tenant Admin | `laila.hasan` | `Tenant@2026!` | TENANT_ADMIN |
| Reception | `arif.hossain` | `Tenant@2026!` | RECEPTION |
| Lab Technician | `tania.sultana` | `Tenant@2026!` | LAB_TECH |
| Billing | `billing.ops` | `Tenant@2026!` | BILLING |

**Tenant:** Al Baraka Medical Group (ABMG)  
**Branch:** Dhaka Central Hospital (BR-DHK-01)

---

## 3. Pre-conditions

1. Database seeded: `npm run db:seed`
2. Automated check passes: `npm run verify:mod02`
3. Application running: `npm run dev` or QC Docker stack

---

## 4. Test Cases

### TC-01 — Tenant admin opens User Management

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login as `laila.hasan` | Redirect to `/settings/users` |
| 2 | Open **Settings → User Management** | User grid shows ≥ 4 users |
| 3 | Verify columns | Username, email, primary role, primary branch, status |

### TC-02 — Create tenant user

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click **Create User** | Form opens at `/settings/users/new` |
| 2 | Enter username `qc.reception`, email, password | Fields accept input |
| 3 | Select role **Reception**, primary branch **Dhaka Central** | Saved |
| 4 | Submit | Redirect to user detail; user appears in list |

### TC-03 — Edit user and reset password

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `qc.reception` detail | Profile loads |
| 2 | Change phone number, save | Success message / updated value |
| 3 | Click **Reset password** | Password reset succeeds |
| 4 | Login as new user with temp password | Login succeeds |

### TC-04 — Role list and permission matrix

| Step | Action | Expected |
|------|--------|----------|
| 1 | Navigate to **Roles & Permissions** | Role list shows TENANT_ADMIN, RECEPTION, LAB_TECH, BILLING |
| 2 | Open **RECEPTION → Permission matrix** | Matrix loads grouped by Security / Operations / Laboratory |
| 3 | Uncheck **View** for `/settings/users`, save | Save succeeds |
| 4 | Check audit log (tenant scope) | Permission matrix UPDATE logged |

### TC-05 — RBAC enforcement (Reception blocked from IAM)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login as `arif.hossain` | Lands on `/dashboard` |
| 2 | Manually browse to `/settings/users` | Redirect or access denied |
| 3 | Verify nav | No User Management / Roles entries (or inaccessible) |

### TC-06 — Lab technician operational access

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login as `tania.sultana` | Lands on `/lab/sample-collection` |
| 2 | Open LIS routes from nav | Sample collection, result entry accessible |
| 3 | Browse to `/settings/roles` | Access denied |

### TC-07 — Account lockout

| Step | Action | Expected |
|------|--------|----------|
| 1 | Logout | Login page shown |
| 2 | Enter valid username, wrong password 5 times | Generic error each time |
| 3 | Attempt 6th login | Locked message or continued block |
| 4 | Verify in User Management (as admin) | User status = LOCKED |
| 5 | Admin clicks **Unlock** | Status returns to ACTIVE; login succeeds |

### TC-08 — Primary branch assignment

| Step | Action | Expected |
|------|--------|----------|
| 1 | As admin, edit a user | Primary branch dropdown populated |
| 2 | Change primary branch, save | User list shows updated branch |
| 3 | User logs in selecting assigned branch | Session branch matches selection |

### TC-09 — Tenant isolation (negative)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login as ABMG tenant admin | Session tenant = ABMG |
| 2 | Attempt to access another tenant's user ID via URL tampering | 404 or not found |

---

## 5. Exit Criteria

- [ ] All TC-01 through TC-09 executed
- [ ] No P0/P1 defects open
- [ ] Evidence stored under `docs/AI-QC/manual-qc/evidence/002-UserRBAC/`
- [ ] Result template completed in `docs/AI-QC/manual-qc/results/`

---

## 6. Automated Regression

```powershell
npm run verify:mod02
npm run build
```

Both must pass before sign-off.

---

**End of document — MOD-02/MOD-03 Manual QC Guide v1.0**
