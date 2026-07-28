# ADR-004 — MOD-20 Pharmacy Stock Adapter

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-07-26 |
| **Module** | MOD-20 Pharmacy & Medication Catalog |
| **Stock engine** | MOD-35 |
| **Implementation** | Catalog: existing pilot; Stock adapter: NOT STARTED |

## Context

MOD-20 documentation previously described MedicationStock / MedicationStockLedger / GRN as a pharmacy-native design. That would create a second inventory engine.

## Decision

MOD-20 remains the **medication catalog and pharmacy-domain workflow** module. Future pharmacy stock, GRN, stock ledger, valuation, transfer, and adjustments **must use MOD-35**. MOD-20 provides a pharmacy stock **adapter** (item type mappings, dispense/return semantics), not a parallel ledger.

## Consequences

- Update MOD-20 docs to deprecate dual stock-engine design language.
- Pharmacy GRN uses MOD-34 + MOD-35.
- Dispense/return update MOD-35 item ledger; financial effects post via MOD-33 adapters.
