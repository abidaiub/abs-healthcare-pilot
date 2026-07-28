# ADR-002 — One Enterprise Inventory Engine

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-07-26 |
| **Module** | MOD-35 Enterprise Inventory, Store & Consumption |
| **Implementation** | NOT STARTED |

## Context

Diagnostic, pharmacy, trading, distribution, and manufacturing all need stock, batch/expiry, warehouses, valuation, and item ledgers. Multiple stock engines would diverge and break costing.

## Decision

MOD-35 is the **single generic inventory engine** for healthcare, diagnostic, laboratory, hospital, pharmacy, trading, distribution, and manufacturing.

## Consequences

- No second pharmacy stock engine (ADR-004).
- MOD-14 consumes MOD-35 for physical stock; owns healthcare-specific consumption rules (ADR-003).
- Default valuation is weighted average; FIFO optional per tenant (ADR-008).
- Inventory system is perpetual.
