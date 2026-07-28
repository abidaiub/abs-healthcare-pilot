# MOD-35 — Enterprise Inventory

| Field | Value |
|-------|-------|
| **Module** | MOD-35 |
| **Numeric ID** | 35 |
| **Display name** | Enterprise Inventory |
| **Category** | Business Operations / Inventory |
| **Depends on** | MOD-01, MOD-01A, MOD-02, MOD-03, MOD-04, MOD-06, MOD-07, MOD-33 (valuation posting), MOD-09 (category integration) |
| **Consumed by** | MOD-14, MOD-20 stock adapter, MOD-34 GRN stock, MOD-36 spare parts, MOD-42 |
| **Documentation status** | ARCHITECTURE APPROVED |
| **Implementation status** | NOT STARTED |
| **AI-QC** | NOT RUN |
| **Manual QC/UAT** | NOT RUN |
| **Production** | NOT APPROVED |
| **Edition availability** | Diagnostic, Clinic/Hospital: Recommended; Trading/Distribution, Manufacturing, Enterprise: Required |
| **Scope document** | this file |
| **Suite overview** | docs/Architecture/05-Business-Operations-Suite.md |
| **ADRs** | ADR-002, ADR-008 (primary); ADR-003, ADR-004 (consumers); valuation posts via ADR-001 |

## Purpose

Provide the **single enterprise inventory engine** for healthcare, pharmacy, trading, distribution, and manufacturing. MOD-35 owns generic item master, warehouses/stores, batch/expiry/serial/barcode, stock movements, physical count, reorder, and valuation (weighted average default; optional FIFO). Vertical modules adapt; they do not fork a second stock ledger.

## In scope

- Generic item master and item types
- Category integration (MOD-09)
- UOM and conversion
- Warehouse, central store, department store
- Batch, expiry, serial, barcode
- Stock movements: receipt, transfer, issue, return, consumption, wastage, damage
- Physical count and stock adjustment
- Reorder level / reorder signals
- Valuation: weighted average (default), optional FIFO (ADR-008)
- Item ledger and inventory valuation posting to MOD-33
- Perpetual inventory system supporting healthcare / pharmacy / trading / distribution / manufacturing

## Out of scope

- Supplier, PR/PO, three-way matching, GRNI policy ownership (MOD-34 orchestrates GRN into this engine)
- Healthcare clinical extension rules beyond generic stock (MOD-14)
- Pharmacy medication catalog content (MOD-20); stock uses adapter to this engine (ADR-004)
- Fixed asset register and depreciation (MOD-36); spare-parts stock may use this engine
- Manufacturing BOM, production order, WIP accounting ownership (MOD-42 uses this engine for materials/FG)
- GL vouchers and financial statements (MOD-33)
- **This reservation phase:** no UI, no API/routes, no Prisma schema, no tenant enablement

## Architectural boundaries

- One inventory engine (ADR-002). No parallel pharmacy-only or lab-only stock ledgers.
- MOD-14 is a healthcare extension (ADR-003), not a replacement engine.
- MOD-20 remains catalog/pharmacy domain; stock quantity/value goes through MOD-35 adapter (ADR-004).
- Valuation and inventory GL impact post only via MOD-33.
- Default valuation is weighted average; FIFO is optional per policy (ADR-008).
- Batch/expiry/serial capabilities are first-class for regulated and healthcare goods.

## Integration notes

| Consumer | Integration |
|----------|-------------|
| MOD-34 | GRN receipt, purchase return, landed-cost value |
| MOD-14 | Healthcare inventory extension |
| MOD-20 | Pharmacy stock adapter |
| MOD-36 | Spare parts issue/return |
| MOD-42 | Raw material issue/return, finished goods receipt, wastage |
| MOD-33 | Inventory valuation, COGS, adjustment, wastage posts |

## Planned screens (documentation only — NOT IMPLEMENTED)

- Item master & item types
- UOM / conversion setup
- Warehouse & store hierarchy
- Stock receipt / transfer / issue / return
- Consumption, wastage, damage
- Physical count & adjustment
- Batch / expiry / serial inquiry
- Barcode label print
- Reorder worklist
- Item ledger & valuation inquiry

Volume 4 UI rules apply when implemented: i18n, RTL, WCAG AA, persistent totals on valued stock grids, status badges (batch/expiry/quarantine), no hardcoded English.

## Reports / print (planned)

- Stock on hand, item ledger, batch/expiry near-expiry
- Valuation report, wastage/damage register
- Physical count variance, reorder list
- Transfer / issue / receipt registers

## Governance

Standing ABSHealthcareLite rule: update module docs, registry, dependencies; run AI QC after implementation; Manual QC/UAT required before approval. This reservation is documentation only.

## Status declaration

This module is PLANNED / ARCHITECTURE APPROVED. It is not implemented, not active for tenants, not AI-QC passed, not Manual-QC passed, and not production ready.
