# ABSHealthcareLite — AI Quality Control Framework

**Document:** AI-QC-v1.0.md  
**Version:** v1.0 (Frozen)  
**Status:** Official — Do not alter scoring rules without a new version (v1.1+)  
**Project:** ABSHealthcareLite Pilot  
**Effective date:** 18 July 2026

---

## 1. Purpose

This document defines the **official, frozen AI Quality Control framework** for ABSHealthcareLite.

AI-QC ensures that:

- Implementation matches approved product and module documentation
- Multi-tenant foundation (Host / Tenant / Branch) behaves correctly
- Database schema and seed data support documented workflows
- Security and workflow gaps are identified **before** manual QA and UAT
- All findings are evidence-based, classified, and traceable

AI-QC is **audit-only**. No code, database, or API changes are permitted during a QC run.

---

## 2. Scope

### In scope (by module gate)

| Gate | Module | Typical focus |
|------|--------|---------------|
| G0 | Foundation | Startup, build, login, sessions, route isolation, DB foundation |
| G1 | Documentation | Module Book, Product Book, UI Blueprint, naming, navigation |
| G2+ | Per module | As defined in Module Book for each MOD-XX |

### Out of scope during a scoped run

- Modules not explicitly requested in the QC task
- Production hardening items listed in Section 7 (unless explicitly in scope)
- Performance/load testing
- Penetration testing

### Pilot acknowledgment

ABSHealthcareLite Pilot may contain **mock sessions**, **UI-only workflows**, and **partial DB backing**. AI-QC must report actual behavior vs documented expectation without assuming future fixes.

---

## 3. Source of Truth

When conflicts arise, resolve in this **priority order** (highest first):

| Priority | Source | Location (repo) |
|----------|--------|-----------------|
| 1 | **Product Master Book** | `docs/ProductBook/ABSHealthcareLite_Product_Master_Book_v4_UIUXBlueprint.md` |
| 2 | **Module Documentation** | `docs/<NN>-<ModuleName>/` |
| 3 | **UI/UX Blueprint** | Product Book V4 + module `Mockups/` |
| 4 | **Sample Data Dictionary** | `docs/PDF/ABSHealthcareLite_Sample_Data_Dictionary.md`, `docs/UIUXMockups/` |
| 5 | **Database Schema** | `prisma/schema.prisma`, migrations |
| 6 | **API** | `src/app/api/` |
| 7 | **Business Workflow** | Module Book workflow sections, ScreenFlow mockups |
| 8 | **Current Implementation** | Application source code (lowest priority) |

**Rule:** If implementation differs from documentation, the finding is **documentation non-compliance** unless the Product Book explicitly defers to pilot/mock behavior.

---

## 4. 30-Point QC Checklist

Every module audit uses this checklist. Mark each item **PASS**, **FAIL**, or **N/A** (with justification).

### A. Documentation (5 points)

| # | Check |
|---|-------|
| D1 | Module exists in Product Book / Module Book |
| D2 | Route(s) match documented navigation map |
| D3 | Screen names and breadcrumbs match UI Blueprint |
| D4 | Mandatory fields match Module Book field list |
| D5 | Sample data aligns with Sample Data Dictionary |

### B. UI (5 points)

| # | Check |
|---|-------|
| U1 | Page/route renders without error |
| U2 | Layout matches wireframe structure (sections, headers, actions) |
| U3 | Role-appropriate navigation visible |
| U4 | Empty/error/loading states handled |
| U5 | Placeholder vs production-ready clearly indicated where applicable |

### C. Functional (5 points)

| # | Check |
|---|-------|
| F1 | Primary workflow steps match Module Book |
| F2 | Create/read/update paths behave as documented |
| F3 | Validation rules enforced (required fields, formats) |
| F4 | Server actions / API return expected success/error |
| F5 | Module enablement respected (disabled modules blocked) |

### D. Database (5 points)

| # | Check |
|---|-------|
| DB1 | Prisma models exist for persisted entities |
| DB2 | Migrations applied and repeatable |
| DB3 | Seed data supports QC scenarios |
| DB4 | Tenant scoping on reads/writes |
| DB5 | No duplicate seed baseline on re-run |

### E. Security (5 points)

| # | Check |
|---|-------|
| S1 | Authentication required on protected routes |
| S2 | Host/Tenant workspace isolation enforced |
| S3 | Role cannot be self-assigned without verification |
| S4 | Cross-tenant data access blocked |
| S5 | Sensitive operations require appropriate session context |

### F. Workflow (5 points)

| # | Check |
|---|-------|
| W1 | Entry route matches role home path |
| W2 | Exit/navigation to next workflow step documented and present |
| W3 | Status transitions match Module Book |
| W4 | Audit trail hooks present where required |
| W5 | Branch context applied where required |

**Scoring:** Count PASS items. N/A items do not count against total if justified.

---

## 5. PASS Criteria

| Verdict | Criteria |
|---------|----------|
| **PASS** | 30/30 applicable checks PASS; **no Critical** findings; no automatic-fail triggered |
| **PASS WITH OBSERVATIONS** | 27–29 applicable checks PASS; **no Critical** findings; Minor/Major observations documented with backlog entries |
| **FAIL** | Below 27 applicable PASS checks **OR** any **Critical** finding **OR** any **automatic-fail** rule triggered |

---

## 6. Automatic FAIL Rules

Any one of the following triggers **immediate FAIL** regardless of score:

| # | Rule |
|---|------|
| AF1 | Host/Tenant route isolation failure (cross-workspace access without redirect/deny) |
| AF2 | Authentication bypass (unauthenticated access to protected routes or mock auth accepted as production-ready without documented pilot waiver) |
| AF3 | Role privilege escalation (user can assign self a higher role without DB verification) |
| AF4 | Cross-tenant data access (read/write another tenant's data without authorization) |
| AF5 | Wrong database ownership (tenant A data written under tenant B context) |
| AF6 | Build failure (`npm run build` fails) |

---

## 7. Deferred Production Security Items

The following are **known pilot limitations**. They are logged as findings but may be **Deferred** when the QC scope is Foundation/Pilot-only and explicitly excludes production auth redesign:

| Item | Pilot status | Production requirement |
|------|--------------|------------------------|
| Mock session authentication | Accepted in pilot | Real `User` / password hash validation |
| Unsigned session cookie | Accepted in pilot | Signed JWT or server-side session store |
| RBAC not enforced at runtime | Accepted in pilot | Permission matrix enforced on routes/actions |
| Patient portal public route | Review per module scope | Authenticated portal access |
| Clinical workflow mock data | Accepted in pilot | Persisted Patient/Order/Result models |

**Rule:** Deferred items must appear in the backlog with **Status: Deferred**, owner, and target gate (e.g. Pre-UAT).

---

## 8. QC Workflow

```
Development
    ↓
AI QC  (read-only, this framework)
    ↓
Fix    (development team — outside AI-QC run)
    ↓
Re-QC  (new report version, verify backlog items)
    ↓
PASS / PASS WITH OBSERVATIONS
    ↓
Manual QA
    ↓
UAT
```

### Re-QC rules

- Create a new report file (do not overwrite signed-off reports)
- Reference prior finding IDs from backlog
- Close backlog items only after evidence of fix

---

## 9. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| **v1.0** | 18 July 2026 | ABSHealthcareLite QA | Initial frozen framework — 30-point checklist, verdict rules, automatic-fail rules, deferred security items |

**Current Version: v1.0 (Frozen)**

---

## Related Documents

- `AI-QC-Execution-Guide.md` — How to run AI-QC in Cursor
- `AI-QC-Report-Template.md` — Standard report format
- `README.md` — Folder structure and backlog process
