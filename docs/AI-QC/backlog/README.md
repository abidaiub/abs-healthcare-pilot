# AI-QC Backlog

Central tracker for findings raised during AI Quality Control runs.

---

## MOD-01 Program Status (19 July 2026)

| Gate | Status |
|------|--------|
| AI QC | PASS (`001-Foundation-ReQC-01.md`) |
| Manual QC Guide | **READY** |
| QC Docker Deployment | **BLOCKED** (see `../manual-qc/evidence/001-CompanyTenant/deployment/`) |
| Manual QC Execution | **PENDING** |
| UAT | **PENDING** |
| Production Approval | **NOT APPROVED** |

---

## MOD-01 Re-QC-01 Status (19 July 2026)

Source: `reports/001-Foundation.md` → fix cycle → `reports/001-Foundation-ReQC-01.md`

### Fixed Findings

| ID | Priority | Status | Module | Title | Fixed date |
|----|----------|--------|--------|-------|------------|
| FND-2026-001 | P0 | **Fixed** | MOD-01 | Host authentication bypass (AF2) | 2026-07-19 |
| FND-2026-002 | P0 | **Fixed** | MOD-01 | Tenant lifecycle not persisted | 2026-07-19 |
| FND-2026-003 | P0 | **Fixed** | MOD-01 | Dual tenant data sources (mock vs DB) | 2026-07-19 |
| FND-2026-004 | P0 | **Fixed** | MOD-01 | Audit logging not implemented | 2026-07-19 |
| FND-2026-005 | P1 | **Fixed** | MOD-01 | REST API `/api/v1/companies/{id}/settings` | 2026-07-19 |
| FND-2026-006 | P1 | **Fixed** | MOD-01 | Subscription & usage limits not seeded | 2026-07-19 |
| FND-2026-008 | P1 | **Fixed** | MOD-01 | Branch management non-persistent | 2026-07-19 |
| FND-2026-009 | P1 | **Fixed** | MOD-01 | Status/lifecycle enforcement absent | 2026-07-19 |

### Partially Fixed Findings

| ID | Priority | Status | Module | Title | Notes |
|----|----------|--------|--------|-------|-------|
| FND-2026-007 | P1 | **Partially Fixed** | MOD-01 | Missing Usage Dashboard | Integrated on tenant detail; unmeasured metrics show explicit state |
| FND-2026-010 | P1 | **Partially Fixed** | MOD-01 | Missing schema entities | Usage snapshot / notification models still absent; defer to architecture phase |

### Open Findings

| ID | Priority | Status | Module | Title | Affected file(s) |
|----|----------|--------|--------|-------|------------------|
| FND-2026-011 | P2 | **Open** | MOD-01 | Naming drift Company vs Tenant | Architecture docs |
| FND-2026-012 | P2 | **Open** | MOD-01 | Export report missing on tenant list | `TenantManagementPanel.tsx` |
| FND-2026-013 | P2 | **Open** | MOD-01 | Host settings cards are placeholders | `host/settings/page.tsx` |

### Deferred Findings

| ID | Priority | Status | Module | Title | Defer reason | Target gate |
|----|----------|--------|--------|-------|--------------|-------------|
| FND-2026-014 | P1 | **Deferred** | Cross-module | Module route gating (F5) | MOD-02 RBAC / navigation enforcement | MOD-02 QC |
| FND-2026-015 | P2 | **Deferred** | Foundation | Signed session cookies | Pilot scope; JSON cookie sufficient for local QC | Pre-production |

---

## Purpose

The backlog bridges **AI-QC reports** and **development fix cycles**:

- **Open Findings** — reported, not yet fixed
- **Fixed Findings** — code/doc fix applied, awaiting Re-QC
- **Deferred Findings** — accepted for a later gate (e.g. pre-UAT production auth)

---

## Fields

| Field | Description |
|-------|-------------|
| **ID** | Unique ID: `FND-YYYY-NNN` |
| **Priority** | P0 Critical, P1 Major, P2 Minor |
| **Status** | Open, In Progress, Fixed, Partially Fixed, Verified, Deferred |
| **Owner** | Person or team responsible |
| **Module** | Foundation, Host, MOD-XX name, etc. |
| **Source report** | e.g. `reports/001-Foundation.md` |
| **Title** | Short finding summary |
| **Affected file(s)** | Code or doc paths |
| **Recommended fix** | Action item |

---

## Status Definitions

| Status | Meaning |
|--------|---------|
| **Open** | Finding recorded; no fix started |
| **In Progress** | Fix underway |
| **Fixed** | Fix merged; needs Re-QC |
| **Partially Fixed** | Core requirement met; documented gap remains |
| **Verified** | Re-QC confirmed resolution |
| **Deferred** | Out of scope for current gate; documented waiver |

---

## Related Documents

- `../AI-QC-v1.0.md` — Verdict and automatic-fail rules
- `../reports/001-Foundation.md` — Original MOD-01 QC (verdict unchanged)
- `../reports/001-Foundation-ReQC-01.md` — Post-fix Re-QC
- `../README.md` — AI-QC program overview

---

## Seed Credentials (pilot local only)

| Account | Username | Password | Scope |
|---------|----------|----------|-------|
| Host Admin | `admin.abs` | `Host@2026!` | Host console |
| ABMG Tenant Admin | `laila.hasan` | `Tenant@2026!` | Tenant login (ABMG branch) |

*Do not use in production. Rotate before deployment.*
