# MOD-20 — Pharmacy & Medication Catalog

| Field | Value |
|-------|-------|
| **Module** | MOD-20 |
| **Display name** | Pharmacy & Medication Catalog |
| **Depends on** | MOD-07, MOD-18, MOD-19 + platform modules |
| **Verify** | `npm run verify:mod20` |
| **Status** | AI COMPLETE — MANUAL QC PENDING |

## Purpose

Establish tenant-safe medication catalog masters for prescription selection and future pharmacy operations.

## Scope (Pilot)

Catalog foundation (Scope A): generics, brands, manufacturers, reference data, branch availability, prescription lookup, CSV import.

Out of scope: dispensing, inventory, batch/expiry, pharmacy sales, billing.

## Integration notes (Business Operations Suite — Architecture Approved)

- MOD-20 remains the medication/catalog and pharmacy-domain module.
- Future pharmacy stock, GRN, stock ledger, valuation, transfer, and adjustments use **MOD-35** (pharmacy stock adapter). No second pharmacy stock engine (ADR-004).
- Procurement path uses **MOD-34**; financial posting uses **MOD-33**.
- These integrations are **NOT STARTED**.

### Approved integration mapping

| Pharmacy concept | Approved owner / mapping |
| :--- | :--- |
| Medication identity | MOD-20 catalog linked to MOD-35 item identity |
| Store | MOD-35 warehouse/store |
| Batch and expiry | MOD-35 batch |
| Procurement | MOD-34 |
| GRN stock movement | MOD-35 |
| Stock ledger | MOD-35 item ledger |
| Valuation | MOD-35 valuation engine |
| Dispense or sale | MOD-20 workflow producing an idempotent MOD-35 stock movement |
| Accounting posting | MOD-33 adapter |

MOD-20 must not create `MedicationStock`, `MedicationStockLedger`, or any independent quantity-balance or valuation engine.

## QC

Automated: PASS | Manual: NOT TESTED | Production: Pending Manual QC
