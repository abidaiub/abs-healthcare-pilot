# MOD-33 — Finance & General Accounting

| Field | Value |
|-------|-------|
| **Module** | MOD-33 |
| **Numeric ID** | 33 |
| **Display name** | Finance & General Accounting |
| **Category** | Business Operations / Finance |
| **Depends on** | MOD-01, MOD-01A, MOD-02, MOD-03, MOD-04, MOD-06, MOD-07 |
| **Consumed by** | All posting adapters, including future MOD-10, MOD-34, MOD-35, MOD-36, MOD-38, MOD-39, MOD-41, MOD-42 |
| **Documentation status** | ARCHITECTURE APPROVED |
| **Implementation status** | NOT STARTED |
| **AI-QC** | NOT RUN |
| **Manual QC/UAT** | NOT RUN |
| **Production** | NOT APPROVED |
| **Edition availability** | Diagnostic: Optional→Recommended; Clinic/Hospital: Recommended; Trading/Distribution, Manufacturing, Enterprise: Required |
| **Scope document** | this file |
| **Suite overview** | docs/Architecture/05-Business-Operations-Suite.md |
| **ADRs** | ADR-001, ADR-007, ADR-009, ADR-010 (also related: ADR-005, ADR-006) |

Detailed design:

- [Detailed architecture](./MOD-33-Finance-General-Accounting-Detailed-Architecture.md)
- [Technology-neutral logical data model](./MOD-33-Finance-General-Accounting-Logical-Data-Model.md)
- [Owner Decision Register](../Architecture/MOD-33-Owner-Decision-Register.md)

## Purpose

Provide the central, reusable double-entry accounting engine for ABSHealthcareLite. MOD-33 owns fiscal calendar, chart of accounts, voucher lifecycle, the posting engine, general ledger, cash/bank books, bank reconciliation, statutory financial statements, and the generic party/subledger model. Source modules never write arbitrary GL rows; they post only through this engine.

## In scope

- Fiscal year and accounting period master; period open/close and period lock
- Chart of Accounts (COA), account types, hierarchy, and system/control account roles
- Opening balances and opening balance control
- Voucher types: journal, receipt, payment, contra, adjustment
- Voucher workflow (draft → submit → approve → post) with configurable segregation of duties
- Central posting engine (idempotent, balanced, tenant/branch scoped, source-traceable)
- Posted-voucher immutability; correction via reversal + repost only
- General Ledger, account ledger, Cash Book, Bank Book
- Bank reconciliation
- Financial statements: Trial Balance, Profit & Loss, Balance Sheet, Cash Flow, Changes in Equity
- Generic party / subledger model (customer, supplier, employee, shareholder, and other party roles)
- Accrual accounting basis; BDT-first with multi-currency-ready architecture
- Tenant isolation, branch scoping, optimistic concurrency, full audit

## Out of scope

- Procurement, GRN, three-way matching (MOD-34)
- Inventory valuation movements as operational stock (MOD-35 posts valuation via this engine)
- Fixed asset register and depreciation schedules (MOD-36)
- HR/employee master and attendance (MOD-37)
- Payroll run, payslips, loan installments (MOD-38 posts via this engine)
- Shareholder register and dividend workflows (MOD-39)
- Budget masters and commitment control UI (MOD-41)
- Manufacturing BOM / WIP (MOD-42)
- Operational diagnostic billing UI (MOD-10); patient 360 / patient ledger UX (MOD-16)
- **This reservation phase:** no UI, no API/routes, no Prisma schema, no tenant enablement

## Architectural boundaries

- MOD-33 is the **only** writer of posted GL / journal lines for enterprise accounting.
- Adapters in other modules call the posting engine; they do not insert ledger rows directly.
- Posted vouchers are immutable (ADR-007). Corrections create reversing vouchers and optional repost.
- Party subledgers project from the generic party model (ADR-010); MOD-16 remains patient UX / AR projection, not GL statements (ADR-005).
- Base currency is BDT; multi-currency structures are reserved for readiness without requiring FX implementation in P1 (ADR-009).
- Period lock blocks new posts into locked periods except authorized reopen/override workflows (future implementation).

## Integration notes

| Consumer | Integration |
|----------|-------------|
| MOD-10 (future) | Diagnostic invoice/payment posting adapter |
| MOD-34 | Supplier invoice, advance, payment, GRNI clearing posts |
| MOD-35 | Inventory valuation, adjustment, and COGS-related posts |
| MOD-36 | Capitalization, depreciation, disposal/sale/write-off posts |
| MOD-38 | Payroll and final settlement accounting posts |
| MOD-39 | Capital, dividend payable/payment, reserve posts |
| MOD-41 | Reads actuals from GL / posted vouchers for budget vs actual |
| MOD-42 | Material, labor, overhead, WIP, finished-goods costing posts |

## Policies (approved baseline)

| Policy | Value |
|--------|-------|
| Accounting basis | Accrual |
| Posted vouchers | Immutable |
| Corrections | Reversal + repost |
| Currency | BDT-first; multi-currency-ready |
| Double-entry balance | Mandatory |
| Idempotency / source traceability | Mandatory |
| Tenant + branch isolation | Mandatory |

## Planned screens (documentation only — NOT IMPLEMENTED)

- Fiscal Year & Periods; Period Lock console
- Chart of Accounts; Account Type / Control Account setup
- Opening Balances
- Voucher entry (Journal / Receipt / Payment / Contra / Adjustment)
- Voucher approval worklist
- Account Ledger; Cash Book; Bank Book
- Bank Reconciliation
- Party / Subledger inquiry
- Financial statement viewers (TB, P&L, BS, Cash Flow, Equity)

Volume 4 UI rules apply when implemented: i18n, RTL, WCAG AA, persistent totals where monetary grids apply, status badges for voucher/period state, no hardcoded English in user-facing strings.

## Reports / print (planned)

- Trial Balance, Profit & Loss, Balance Sheet, Cash Flow, Changes in Equity
- Account ledger, Cash Book, Bank Book, bank reconciliation statement
- Voucher print / PDF and party statement (generic)

## Governance

Standing ABSHealthcareLite rule: update module docs, registry, dependencies; run AI QC after implementation; Manual QC/UAT required before approval. This reservation is documentation only.

## Status declaration

This module is PLANNED / ARCHITECTURE APPROVED. It is not implemented, not active for tenants, not AI-QC passed, not Manual-QC passed, and not production ready.
