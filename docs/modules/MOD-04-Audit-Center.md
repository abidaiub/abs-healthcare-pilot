# MOD-04 — Audit Center

**Project:** ABSHealthcareLite Pilot  
**Module ID:** MOD-04  
**Version:** 1.0  
**Date:** 23 July 2026  
**Status:** Implementation specification

---

## 1. Business Purpose

The Audit Center provides a tamper-evident, read-only view of platform activity for compliance and troubleshooting. Tenant administrators and auditors can answer: **who did what, when, and from where** within their organization boundary.

Healthcare deployments require traceability for administrative changes, authentication events, and permission modifications without exposing data across tenants.

---

## 2. Scope

### In scope (pilot)

- Tenant-facing audit log grid at `/settings/audit`
- Search and filter by branch, user, action, entity, module, date range
- Detail inspection with before/after values from `changeData` JSON
- CSV export of filtered results
- RBAC enforcement via MOD-03 permission matrix
- Strict tenant isolation (`tenantId` filter on all reads)
- Self-audit: log VIEW events when detail/export is accessed

### Out of scope (deferred)

- Host audit UI changes (existing `/host/audit` remains MOD-01 host console)
- PDF export
- Retention/archival configuration UI
- Real-time SIEM streaming
- Patient PHI access audit (clinical modules not yet live)

---

## 3. Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-01 | Authorized tenant users can open Audit Center from Settings |
| FR-02 | Grid shows timestamp, branch, user, action, entity, summary, IP |
| FR-03 | Filter by date range (from/to) |
| FR-04 | Filter by branch, user, action type, entity type, module |
| FR-05 | Free-text search across user, entity, action, change summary |
| FR-06 | Paginated results (default 25, max 100 per page) |
| FR-07 | Detail panel shows structured old/new values when present |
| FR-08 | Export filtered results to CSV |
| FR-09 | No create/update/delete of audit rows via UI |
| FR-10 | Cross-tenant access attempts return empty or 404 |

---

## 4. Data Model

Uses existing Prisma model `AuditLog`:

| Field | Purpose |
|-------|---------|
| `tenantId` | Tenant scope (required for tenant queries) |
| `branchId` | Optional branch context |
| `userId` | Actor reference |
| `actionType` | INSERT, UPDATE, DELETE, LOGIN, VIEW, etc. |
| `entityType` | Logical entity (User, Role, Tenant, Branch, …) |
| `entityId` | Affected record ID |
| `changeData` | JSON diff (`oldValue`, `newValue`, nested objects) |
| `ipAddress`, `userAgent` | Origin metadata |
| `createdAt`, `createdBy` | Immutable audit metadata |

**Indexes added:** `[tenantId, actionType]`, `[userId]` for filter performance.

---

## 5. API / Server Actions

| Action | Purpose | Auth |
|--------|---------|------|
| Page load (RSC) | Query filtered audit rows | `requireTenantPermission("/settings/audit")` |
| `exportTenantAuditLogsAction` | CSV export of current filters | `canPrint` on `/settings/audit` |
| `logAuditDetailViewAction` | Self-audit VIEW event | `canView` on `/settings/audit` |

All queries use `where: { tenantId: session.tenantId }`.

---

## 6. UI Specification

**Route:** `/settings/audit`

**Layout:** Settings shell with Security & IAM sidebar (same as users/roles)

**Sections:**

1. **Filter bar** — date from/to, branch, user, action, entity, module, search
2. **Results table** — sortable columns, pagination controls
3. **Detail drawer** — field-level old/new comparison
4. **Export button** — downloads `audit-export-YYYYMMDD.csv`

**Responsive:** Filters stack on mobile; table horizontal scroll.

**Accessibility:** Table headers, form labels, keyboard-focusable controls.

---

## 7. RBAC Rules

| Resource key | Default roles |
|--------------|---------------|
| `/settings/audit` | TENANT_ADMIN (full matrix) |

| Action | Permission flag |
|--------|-----------------|
| View grid | `canView` |
| Export CSV | `canPrint` |
| View detail | `canView` (triggers self-audit) |

RECEPTION, LAB_TECH, BILLING roles have no audit access by default.

---

## 8. Tenant Isolation Rules

1. Every tenant audit query includes `tenantId = session.tenantId`
2. Detail fetch verifies `log.tenantId === session.tenantId`
3. Export uses identical filter scope
4. Host events (`tenantId IS NULL`) never appear in tenant audit UI
5. URL tampering with another tenant's log ID returns not found

---

## 9. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| AC-01 | Tenant admin sees tenant-scoped audit rows | Manual TC-01 |
| AC-02 | Filters reduce result set correctly | Manual TC-03 |
| AC-03 | Detail shows old/new values | Manual TC-04 |
| AC-04 | CSV export matches filters | Manual TC-05 |
| AC-05 | Reception cannot access `/settings/audit` | Manual TC-02 + verify:mod04 |
| AC-06 | No UI to delete/edit audit records | Code review |
| AC-07 | VIEW self-audit on detail open | Manual TC-06 |
| AC-08 | MOD-01–03 regression scripts pass | verify:mod01, verify:mod02 |

---

## 10. Risks

| Risk | Mitigation |
|------|------------|
| Large audit volume | Pagination + indexed filters |
| Incomplete changeData on legacy rows | Display raw JSON fallback |
| IP not captured on all writes | Document gap; enhance writers incrementally |
| Export of sensitive data | RBAC + tenant scope; no password fields logged |

---

## 11. Dependencies

| Module | Dependency |
|--------|------------|
| MOD-01 | Tenant/branch context, host audit writer |
| MOD-02 | User actors in audit rows |
| MOD-03 | Permission guards on audit routes |
| Prisma | `AuditLog` model populated by existing actions |

---

## 12. Database Migration Summary

**Change:** Add indexes on `audit_logs`:

- `@@index([tenantId, actionType])`
- `@@index([userId])`

**Apply:**

```bash
npx prisma db push
```

No new tables. No data migration required.

---

## 13. Rollback Guidance

1. Revert application deploy to prior commit
2. Indexes are additive — rollback optional; safe to leave in place
3. Re-run `npm run db:seed` if seed permission catalog changes need reset
4. Verify: `npm run verify:mod01 && npm run verify:mod02`

---

## 14. Deployment Notes

See `docs/modules/MOD-04-Deployment-Notes.md`.

---

## 15. User & Administrator Guides

See:

- `docs/modules/MOD-04-User-Guide.md`
- `docs/modules/MOD-04-Administrator-Guide.md`

---

*End of MOD-04 implementation specification*
