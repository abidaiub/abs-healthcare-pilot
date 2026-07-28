# ABSHealthcareLite Business Operations Suite

| Field | Value |
|-------|-------|
| **Status** | ARCHITECTURE APPROVED / PLANNED |
| **Implementation** | NOT STARTED |
| **AI-QC** | NOT RUN |
| **Manual QC/UAT** | NOT RUN |
| **Production** | NOT APPROVED |
| **Date** | 2026-07-26 |

This document reserves the Business Operations Suite. It does **not** mark any module implemented or production-ready.

## 1. Approved module IDs

| ID | Name | Numeric |
|----|------|---------|
| MOD-33 | Finance & General Accounting | 33 |
| MOD-34 | Procurement & Supplier Management | 34 |
| MOD-35 | Enterprise Inventory, Store & Consumption | 35 |
| MOD-36 | Fixed Asset, Device Maintenance & Calibration | 36 |
| MOD-37 | HR & Employee Management | 37 |
| MOD-38 | Payroll, Benefits, Loans & Final Settlement | 38 |
| MOD-39 | Shareholder, Investment & Profit Distribution | 39 |
| MOD-40 | AI Prescription Capture *(unchanged)* | 40 |
| MOD-41 | Budgeting, Cost Center & Financial Control | 41 |
| MOD-42 | Manufacturing, BOM, Production & Costing | 42 |

MOD-25 remains Radiology. No existing module ID was renumbered.

## 2. Architectural decisions (summary)

1. MOD-33 is the central reusable double-entry accounting engine.
2. MOD-35 is the single generic inventory engine for all verticals.
3. MOD-14 remains healthcare-specific and becomes an extension of MOD-35/MOD-34.
4. MOD-20 remains catalog/pharmacy domain; stock uses MOD-35 adapter.
5. MOD-16 is patient 360 / patient subledger UX — not GL or statements.
6. MOD-10 remains operational diagnostic billing; later posts via MOD-33 adapter.
7. Source modules never write arbitrary GL rows.
8. All approved source transactions post through one MOD-33 posting engine.

Full ADRs: `docs/Architecture/ADR/`.

## 3. Accounting policy baseline

| Policy | Value |
|--------|-------|
| Accounting basis | Accrual |
| Inventory system | Perpetual |
| Default valuation | Weighted average |
| Optional valuation | FIFO |
| Base currency | BDT |
| Multi-currency | Architecture ready |
| Posted vouchers | Immutable |
| Corrections | Reversal + repost |
| Tenant isolation | Mandatory |
| Branch scoping | Mandatory |
| Double-entry balance | Mandatory |
| Idempotency | Mandatory |
| Source traceability | Mandatory |
| Optimistic concurrency | Mandatory |
| Full audit | Mandatory |
| Period lock | Supported |
| Segregation of duties | Configurable |

**Purchase accounting (ADR-006):** GRN → Inventory Dr / GRNI Cr; Supplier invoice → clear GRNI, VAT/variance, AP Cr. No AP credit at GRN by default.

## 4. Dependency model

```text
Platform: MOD-01, MOD-01A, MOD-02, MOD-03, MOD-04, MOD-06, MOD-07

Core business sequence:
  MOD-33 → MOD-35 → MOD-34

Healthcare extension:
  MOD-34 + MOD-35 → MOD-14
  MOD-35 → MOD-20 pharmacy stock adapter

Other:
  MOD-36 → MOD-33
  MOD-37 → MOD-38 → MOD-33
  MOD-39 → MOD-33
  MOD-41 reads MOD-33 actuals and MOD-34 commitments
  MOD-42 uses MOD-35 materials and MOD-33 costing

Existing healthcare:
  MOD-10 invoice/payment → future MOD-33 posting adapter
  MOD-16 → patient subledger / AR projection
  MOD-24 → billing hold (operational; not bypassed by accounting)
  MOD-28 / MOD-29 → future charges/clearance with MOD-10 / MOD-16 / MOD-33
```

## 5. Implementation phases (approved)

| Phase | Scope | Status |
|-------|-------|--------|
| **P0** | Documentation, ADRs, registry reservation, Product Books | **This task** |
| **P1** | MOD-33 foundation (FY, periods, COA, posting, GL, TB) | NOT STARTED |
| **P2** | MOD-33 cash/bank/recon/P&L/BS + MOD-10 adapter | NOT STARTED |
| **P3** | MOD-35 inventory foundation | NOT STARTED |
| **P4** | MOD-34 procurement | NOT STARTED |
| **P5** | MOD-14 extension + MOD-20 pharmacy stock adapter | NOT STARTED |
| **P6** | MOD-16 patient ledger / AR projection | NOT STARTED |
| **P7** | MOD-36 fixed assets | NOT STARTED |
| **P8** | MOD-37 HR + MOD-38 Payroll | NOT STARTED |
| **P9** | MOD-41 budgeting | NOT STARTED |
| **P10** | MOD-39 shareholder | NOT STARTED |
| **P11** | MOD-42 manufacturing | NOT STARTED |

## 6. Edition mapping (planned)

| Module | Diagnostic | Clinic/Hospital | Trading/Distribution | Manufacturing | Enterprise |
|--------|:---:|:---:|:---:|:---:|:---:|
| MOD-33 | Optional→Rec. | Recommended | Required | Required | Required |
| MOD-34 | Optional | Recommended | Required | Required | Required |
| MOD-35 | Recommended | Recommended | Required | Required | Required |
| MOD-14 | Recommended | Recommended | — | — | Healthcare packs |
| MOD-36 | Optional | Recommended | Optional | Recommended | Required |
| MOD-37/38 | Optional | Recommended | Optional | Optional | Required |
| MOD-39 | Optional | Optional | Optional | Optional | Recommended |
| MOD-41 | Optional | Optional | Recommended | Recommended | Required |
| MOD-42 | — | — | — | Required | Optional |

## 7. Registry note

Planned modules are registered in `MODULE_REGISTRY` with:

- `status: "Inactive"` (not tenant-enabled)
- `implementationStatus: "Planned"`
- `documentationStatus: "ARCHITECTURE APPROVED"`
- QC statuses `NOT RUN`
- `productionApprovalStatus: "Not Approved"`

**Safety behavior in current code:**

- `prisma/seed/tenant-diagnostic-masters.ts` `seedModuleRegistry` maps `status === "Active"` → DB `isActive`. Planned modules seed as **`isActive: false`**.
- `src/app/actions/host-tenant.ts` tenant provisioning loads only `moduleRegistry` rows with `isActive: true`, so planned modules are **not** auto-assigned to new tenants.
- Planned modules are **not** added to sample tenant `ABMG_MODULES` enabled lists.
- No application routes / SCREENS entries were added in `src/lib/module-registry.ts` for these modules.

**Limitation:** The host Module Registry UI may display Inactive catalog rows after seed. That is intentional reservation visibility, not tenant enablement. Do not flip `status` to `"Active"` until implementation + QC gates pass.

## 8. Module scope documents

| Module | Document |
|--------|----------|
| MOD-33 | `docs/modules/MOD-33-Finance-General-Accounting.md` |
| MOD-34 | `docs/modules/MOD-34-Procurement-Supplier-Management.md` |
| MOD-35 | `docs/modules/MOD-35-Enterprise-Inventory.md` |
| MOD-36 | `docs/modules/MOD-36-Fixed-Asset-Maintenance.md` |
| MOD-37 | `docs/modules/MOD-37-HR-Employee-Management.md` |
| MOD-38 | `docs/modules/MOD-38-Payroll-Benefits-Settlement.md` |
| MOD-39 | `docs/modules/MOD-39-Shareholder-Profit-Distribution.md` |
| MOD-41 | `docs/modules/MOD-41-Budgeting-Financial-Control.md` |
| MOD-42 | `docs/modules/MOD-42-Manufacturing-Costing.md` |
