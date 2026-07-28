# ADR-003 — MOD-14 as Healthcare Inventory Extension

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-07-26 |
| **Module** | MOD-14 Diagnostic Inventory (existing) |
| **Depends on** | MOD-35, MOD-34 |
| **Implementation** | NOT STARTED (extension redesign) |

## Context

MOD-14 is already documented as Diagnostic Inventory with PO/GRN/stock concepts. Replacing or renumbering it would break Product Books and docs.

## Decision

MOD-14 **remains** the healthcare-specific diagnostic inventory module and becomes an **extension/consumer** of MOD-35 (stock) and MOD-34 (procurement).

MOD-14 owns: reagent tracking, open-bottle, open-expiry, test-wise / analyzer-wise / patient-service-wise consumption, X-ray film usage, surgical/operating consumables, healthcare expiry blocking, lab quality/compliance rules.

## Consequences

- Do not silently replace MOD-14.
- Preserve `docs/14-DiagnosticInventory/**` identity and future routes/data contracts.
- Procurement orchestration for reagents uses MOD-34; stock ledger uses MOD-35.
