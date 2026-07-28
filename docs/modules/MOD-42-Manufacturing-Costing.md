# MOD-42 — Manufacturing, BOM, Production & Costing

| Field | Value |
|-------|-------|
| **Module** | MOD-42 |
| **Numeric ID** | 42 |
| **Display name** | Manufacturing, BOM, Production & Costing |
| **Category** | Business Operations / Manufacturing |
| **Depends on** | MOD-35, MOD-33, MOD-34 (materials procurement), platform (MOD-01, MOD-01A, MOD-02, MOD-03, MOD-04, MOD-06, MOD-07) |
| **Consumed by** | Finished-goods stock consumers via MOD-35; costing actuals via MOD-33 |
| **Documentation status** | ARCHITECTURE APPROVED |
| **Implementation status** | NOT STARTED |
| **AI-QC** | NOT RUN |
| **Manual QC/UAT** | NOT RUN |
| **Production** | NOT APPROVED |
| **Edition availability** | Manufacturing: Required; Enterprise: Optional; Diagnostic / Clinic/Hospital / Trading: not in base edition map |
| **Scope document** | this file |
| **Suite overview** | docs/Architecture/05-Business-Operations-Suite.md |
| **ADRs** | ADR-002, ADR-008 (materials/FG stock); ADR-001, ADR-007 (costing posts); procurement via ADR-006 |

## Purpose

Support manufacturing operations and product costing: raw materials, bill of materials (BOM), production orders, material issue/return, WIP, finished-goods receipt, wastage, labor and overhead absorption, and batch/product costing. Materials and FG quantities use MOD-35; monetary posts use MOD-33 only.

## In scope

- Raw materials (as inventory items via MOD-35 item types)
- Bill of Materials (BOM)
- Production order
- Material issue and return to/from production
- Work-in-progress (WIP)
- Finished goods receipt
- Wastage in production
- Labor cost and overhead absorption
- Batch costing and product costing
- Manufacturing / Enterprise optional edition packaging

## Out of scope

- Generic warehouse engine ownership (MOD-35)
- Supplier PR/PO/GRN ownership (MOD-34 supplies materials)
- Standalone GL and financial statements (MOD-33)
- HR attendance ownership (MOD-37); payroll run ownership (MOD-38) — labor cost may allocate from approved inputs later
- Healthcare lab production / analyzer workflows
- **This reservation phase:** no UI, no API/routes, no Prisma schema, no tenant enablement

## Architectural boundaries

- One inventory engine for RM / WIP-as-stock (if applicable) / FG (ADR-002); valuation per ADR-008.
- Costing journals (material consumption, WIP, FG receipt, wastage, labor, overhead) post only via MOD-33 (ADR-001); corrections via reversal + repost (ADR-007).
- MOD-42 does not create a parallel stock ledger or a parallel GL.
- Materials procurement remains MOD-34; production consumes stock from MOD-35.
- Edition gate: Manufacturing required; Enterprise optional; not assumed for Diagnostic-only tenants.

## Integration notes

| System | Role |
|--------|------|
| MOD-35 | RM issue/return, wastage qty, FG receipt, item ledger |
| MOD-33 | WIP, material, labor, overhead, FG valuation posts |
| MOD-34 | Raw material procurement |
| MOD-38 (future) | Optional labor cost inputs |
| MOD-41 (future) | Optional production / project budget dimensions |

## Planned screens (documentation only — NOT IMPLEMENTED)

- BOM maintenance
- Production order list / detail
- Material issue / return
- WIP status
- Finished goods receipt
- Wastage entry
- Labor / overhead absorption
- Batch & product costing inquiry

Volume 4 UI rules apply when implemented: i18n, RTL, WCAG AA, persistent totals on cost sheets, status badges (planned/released/in-process/completed/closed), no hardcoded English.

## Reports / print (planned)

- BOM print, production order traveler
- Material consumption vs BOM variance
- WIP aging / valuation
- Batch cost sheet, product cost sheet
- Wastage register, FG receipt register

## Governance

Standing ABSHealthcareLite rule: update module docs, registry, dependencies; run AI QC after implementation; Manual QC/UAT required before approval. This reservation is documentation only.

## Status declaration

This module is PLANNED / ARCHITECTURE APPROVED. It is not implemented, not active for tenants, not AI-QC passed, not Manual-QC passed, and not production ready.
