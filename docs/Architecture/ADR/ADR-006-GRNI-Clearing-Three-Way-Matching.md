# ADR-006 — GRNI Clearing and Three-Way Matching

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-07-26 |
| **Modules** | MOD-34 Procurement, MOD-35 Inventory, MOD-33 Finance |
| **Implementation** | NOT STARTED |

## Context

Crediting Accounts Payable at GRN overstates liabilities before supplier invoice validation.

## Decision — baseline purchase accounting

**At GRN:**

```text
Inventory Dr
    GRNI Clearing Cr
```

**At supplier invoice (with three-way match PO–GRN–Invoice):**

```text
GRNI Clearing Dr
Input VAT Dr          (where applicable)
Purchase Variance Dr/Cr (where applicable)
    Accounts Payable Cr
```

Do **not** credit Accounts Payable at GRN unless a tenant explicitly enables a future simplified purchase-accounting policy.

## Consequences

- MOD-34 owns matching workflow; MOD-33 owns journal posting; MOD-35 owns stock quantity/value.
- Landed cost / freight may update inventory valuation through controlled MOD-35/MOD-33 adapters.
