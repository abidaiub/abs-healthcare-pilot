# ADR-008 — Weighted-Average Default with Optional FIFO

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-07-26 |
| **Module** | MOD-35 |
| **Implementation** | NOT STARTED |

## Context

Tenants need a predictable default valuation while some require FIFO for compliance or costing.

## Decision

- Inventory system: **perpetual**
- Default valuation: **weighted average**
- Optional tenant valuation: **FIFO**
- Architecture must support switching policy only under controlled migration rules (future design; not implemented here)

## Consequences

- Item ledger and costing reports must disclose active valuation method.
- Manufacturing (MOD-42) and healthcare consumption (MOD-14) consume the same valuation engine.
