# MOD-41 — Budgeting, Cost Center & Financial Control

| Field | Value |
|-------|-------|
| **Module** | MOD-41 |
| **Numeric ID** | 41 |
| **Display name** | Budgeting, Cost Center & Financial Control |
| **Category** | Business Operations / Financial Control |
| **Depends on** | MOD-33; reads MOD-34 commitments; platform (MOD-01, MOD-01A, MOD-02, MOD-03, MOD-04, MOD-06, MOD-07); MOD-08 for department budgets |
| **Consumed by** | Approval / spend control consumers (procurement and posting adapters — future enforcement hooks) |
| **Documentation status** | ARCHITECTURE APPROVED |
| **Implementation status** | NOT STARTED |
| **AI-QC** | NOT RUN |
| **Manual QC/UAT** | NOT RUN |
| **Production** | NOT APPROVED |
| **Edition availability** | Diagnostic, Clinic/Hospital: Optional; Trading/Distribution, Manufacturing: Recommended; Enterprise: Required |
| **Scope document** | this file |
| **Suite overview** | docs/Architecture/05-Business-Operations-Suite.md |
| **ADRs** | ADR-001 (actuals source); MOD-34 commitments per ADR-006 context |

## Purpose

Provide cost-center and project dimensions, annual/branch/department/project budgets, commitment control against procurement, actual-vs-budget visibility, approval limits, and cash-flow forecasting. MOD-41 **reads** MOD-33 actuals and MOD-34 commitments; it does not become a second ledger.

## In scope

- Cost center master
- Project dimension
- Annual, branch, department, and project budgets
- Commitment control (open PO / approved PR commitments from MOD-34)
- Actual vs budget inquiry and variance
- Approval limits (financial control thresholds)
- Cash-flow forecast (planned)
- Department budget alignment with MOD-08 org structure

## Out of scope

- Creating GL vouchers or replacing Trial Balance / P&L (MOD-33)
- Owning PR/PO documents (MOD-34)
- Inventory valuation (MOD-35)
- Payroll calculation (MOD-38)
- Manufacturing standard cost setup ownership (MOD-42)
- **This reservation phase:** no UI, no API/routes, no Prisma schema, no tenant enablement

## Architectural boundaries

- Actuals are sourced from posted MOD-33 data (and approved posting adapters), never from a shadow accounting book.
- Commitments are sourced from MOD-34 open/approved purchasing documents.
- Budget check / commitment control may block or warn source modules via shared policy hooks in future implementation; enforcement details are reserved, not implemented.
- Cost center / project are analytical dimensions compatible with future voucher coding in MOD-33.
- Department budgets reference MOD-08; they do not redefine org hierarchy.

## Integration notes

| System | Role |
|--------|------|
| MOD-33 | Actual spend / revenue / cash actuals |
| MOD-34 | Commitment exposure (PR/PO) |
| MOD-08 | Department dimension for department budgets |
| MOD-07 | Branch budgets |
| Future adapters | Optional hard/soft commitment checks at submit/approve |

## Planned screens (documentation only — NOT IMPLEMENTED)

- Cost center master
- Project dimension master
- Budget entry (annual / branch / department / project)
- Budget revision & approval
- Commitment control console
- Actual vs budget dashboard / inquiry
- Approval limits setup
- Cash-flow forecast

Volume 4 UI rules apply when implemented: i18n, RTL, WCAG AA, persistent totals on budget grids, status badges (draft/approved/locked/over-commitment), no hardcoded English.

## Reports / print (planned)

- Budget vs actual, commitment vs budget
- Department / cost center / project variance
- Approval limit matrix
- Cash-flow forecast worksheet

## Governance

Standing ABSHealthcareLite rule: update module docs, registry, dependencies; run AI QC after implementation; Manual QC/UAT required before approval. This reservation is documentation only.

## Status declaration

This module is PLANNED / ARCHITECTURE APPROVED. It is not implemented, not active for tenants, not AI-QC passed, not Manual-QC passed, and not production ready.
