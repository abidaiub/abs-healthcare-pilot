# MOD-07 — Architecture Audit

Audit date: 2026-07-24  
Baseline commits: `a8ee1fc` (MOD-06), `326cd75` (MOD-06 registry)

## Repository state

| Check | Result |
|-------|--------|
| Branch | `main`, up to date with `origin/main` |
| Unrelated local changes | PDF manual QC, `tenant-users.ts`, daily-git-sync scripts (excluded from MOD-07) |

## Existing branch domain

| Layer | Finding |
|-------|---------|
| **Prisma `Branch`** | Already existed with `tenantId`, `code`, `name`, address fields, `EntityStatus`, `isActive`. Extended for MOD-07 with type, regional fields, default flag, hours, notes. |
| **Prisma `UserBranch`** | Already existed with `isPrimary` (default working branch), `isActive`, tenant isolation. Reused without duplicate model. |
| **Host branch CRUD** | `src/app/actions/host-tenant.ts` — `createBranchAction`, `updateBranchAction` for host console only. |
| **Host UI** | `/host/tenants/[tenantId]/branches` + `BranchManagementPanel.tsx` (English, host-scoped). |
| **Tenant branch UI** | **Missing** — MOD-07 adds `/settings/branches`. |
| **Branch switcher** | **Missing** — branch fixed at login in session cookie. MOD-07 adds resolver + switcher. |

## Session and context

| Component | Location | Notes |
|-----------|----------|-------|
| Session cookie | `abs-pilot-session` in `src/lib/session.ts` | JSON with `branchId`, `branchName`, `branchCode` |
| Login branch pick | `tenantLoginAction` in `host-auth.ts` | Validates active branch in tenant |
| Current branch cookie | **Added** `abs-pilot-current-branch` (MOD-07) | HTTP-only override with precedence resolver |

## RBAC

| Component | Location |
|-----------|----------|
| Permission catalog | `src/lib/rbac/permission-catalog.ts` |
| Seed | `prisma/seed/rbac-foundation.ts` from `TENANT_PERMISSION_RESOURCES` |
| Guard | `requireTenantPermission(resourceKey, action)` |

**Gap:** No `/settings/branches` resource before MOD-07. Added `BRANCH_MGMT` under Security & IAM.

## Audit (MOD-04)

| Component | Location |
|-----------|----------|
| Writer | `writeAuditLog()` in `src/lib/saas/audit.ts` |
| Actions | `INSERT`, `UPDATE`, `DELETE`, etc. |
| Branch events | Host already logs `entityType: "Branch"`. MOD-07 extends tenant-side lifecycle + context switch metadata in `changeData.event`. |

## Localization (MOD-06)

| Component | Location |
|-----------|----------|
| Namespaces | `src/messages/{locale}/*.json` |
| Server/client | `getServerI18n`, `useI18n`, `t('namespace.key')` |
| RTL | `LocaleDocument` + logical CSS in layout |

**Gap:** No `branch` namespace before MOD-07.

## Module Registry

| Layer | Location |
|-------|----------|
| Static source | `MODULE_REGISTRY` in `src/lib/saas-foundation-data.ts` |
| DB | `module_registry` via `seedModuleRegistry()` |
| Screen registry | `src/lib/module-registry.ts` |
| Governance | `module-governance.ts`, `module-governance-validate.ts` |
| Host UI | `ModuleRegistryPanel.tsx` |

**Gap:** MOD-07 not registered before this implementation.

## Seed architecture

| Seed | Role |
|------|------|
| `prisma/seed.ts` | ABMG tenant + primary branch upsert |
| `prisma/seed/rbac-foundation.ts` | Roles, permissions, `UserBranch` |
| `prisma/seed/saas-foundation.ts` | Host admin, ABMG foundation, module enablement |
| **Added** `prisma/seed/branch-foundation.ts` | Multi-branch demo data, default branch, assignments |

## Scope decision

Implement **Branch** as primary domain. No separate Location child model — schema remains extensible via future modules (rooms, counters, labs).

## Reuse strategy

- Extend existing `Branch` / `UserBranch` models — no duplicates
- Mirror tenant server action patterns from `tenant-users.ts`
- Mirror settings page pattern from `/settings/users`
- Mirror verify script from `verify-mod04-audit.ts` + registry checks from MOD-06
- Host branch actions unchanged; tenant actions are new
