# MOD-07 — Branch / Location Management

| Field | Value |
|-------|-------|
| **Module** | MOD-07 |
| **Display name** | Branch Management |
| **Depends on** | MOD-01, MOD-01A, MOD-02, MOD-03, MOD-04, MOD-06 |
| **Status** | Implemented (foundation coverage) |
| **Verify** | `npm run verify:mod07` |

## Purpose

Provide tenant-isolated branch management, user assignments, default branch rules, and secure working-branch context for all operational modules.

## Scope

- Branch CRUD (tenant settings)
- Default tenant branch (one per tenant)
- Activation / deactivation (soft lifecycle)
- User-to-branch assignments and default working branch
- Current branch resolution and switcher
- RBAC, audit, localization, RTL
- Host branch CRUD remains under MOD-01 host console

Out of scope: child Location entities, patient/clinical workflows.

## Architecture

| Layer | Location |
|-------|----------|
| Schema | `prisma/schema.prisma` — `Branch`, `UserBranch`, `BranchType` |
| Queries | `src/lib/branch/queries.ts` |
| Resolver | `src/lib/branch/resolve.ts` |
| Actions | `src/app/actions/tenant-branches.ts` |
| UI | `/settings/branches`, `BranchManagementPanel`, `BranchSwitcher` |
| Cookie | `abs-pilot-current-branch` |

## Data model

**Branch** — tenant-owned location with code, type, address/regional fields, timezone override, default flag, active status.

**UserBranch** — assignment with `isPrimary` as default working branch per tenant.

## Branch lifecycle

1. Create branch (first branch auto-default)
2. Set another branch as default (transaction clears previous default)
3. Deactivate non-default branch when another active branch exists
4. Default branch cannot be deactivated until another default is assigned

## Current branch resolution

Precedence:

1. Valid HTTP-only current-branch cookie
2. Session branch (login)
3. User primary assigned branch
4. Tenant default branch (if assigned)
5. First permitted active branch

## RBAC

Resource: `/settings/branches` (`BRANCH_MGMT`)

| Action | Permission |
|--------|------------|
| View list/detail | canView |
| Create | canCreate |
| Edit / activate / assign | canEdit |
| Set tenant default | canApprove |
| Switch working branch | any assigned active user |

## Audit events

Logged via MOD-04 with `entityType: "Branch"` and `changeData.event`:

- `BRANCH_CREATED`, `BRANCH_UPDATED`, `BRANCH_ACTIVATED`, `BRANCH_DEACTIVATED`
- `BRANCH_DEFAULT_CHANGED`, `BRANCH_USER_ASSIGNED`, `BRANCH_USER_REMOVED`
- `BRANCH_USER_DEFAULT_CHANGED`, `BRANCH_CONTEXT_SWITCHED`

## Error codes

`BRANCH_NOT_FOUND`, `BRANCH_CODE_DUPLICATE`, `BRANCH_INACTIVE`, `BRANCH_DEFAULT_REQUIRED`, `BRANCH_DEFAULT_CANNOT_DEACTIVATE`, `BRANCH_ACCESS_DENIED`, `BRANCH_ASSIGNMENT_INVALID`, `BRANCH_CROSS_TENANT`, `BRANCH_USER_INACTIVE`, `BRANCH_NO_AVAILABLE_BRANCH`

## Localization

Namespace: `branch` in all MOD-06 primary locales. Branch type labels use `branch.types.*` keys.

## Module Registry metadata

| Field | Value |
|-------|-------|
| **Module ID** | MOD-07 |
| **Registry source** | `MODULE_REGISTRY` in `src/lib/saas-foundation-data.ts` |
| **Automated QC** | PASS (after `verify:mod07`) |
| **Manual QC** | NOT TESTED |
| **Browser UAT** | NOT TESTED |
| **Production approval** | Pending Manual QC |

## Known limitations

- Host and tenant branch UIs are separate surfaces
- No room/counter sub-locations yet
- Manual/browser QC pack not executed in automated pipeline

## Future integration contract

Downstream modules must:

1. Read current branch from enriched session / resolver
2. Scope operational data by `tenantId` + `branchId`
3. Never trust client-supplied tenant or branch IDs without server validation

## Deployment notes

Run migration `20260724000000_mod07_branch_location_management`, then `npm run db:seed`.

## Rollback notes

Revert migration only if no production branch assignments exist; preserve `branches` and `user_branches` rows when rolling back UI layer.
