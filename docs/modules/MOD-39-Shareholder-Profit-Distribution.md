# MOD-39 — Shareholder, Investment & Profit Distribution

| Field | Value |
|-------|-------|
| **Module** | MOD-39 |
| **Numeric ID** | 39 |
| **Display name** | Shareholder, Investment & Profit Distribution |
| **Category** | Business Operations / Corporate Finance |
| **Depends on** | MOD-33, platform (MOD-01, MOD-01A, MOD-02, MOD-03, MOD-04, MOD-06, MOD-07) |
| **Consumed by** | Equity / statutory reporting consumers via MOD-33; board/finance workflows (future) |
| **Documentation status** | ARCHITECTURE APPROVED |
| **Implementation status** | NOT STARTED |
| **AI-QC** | NOT RUN |
| **Manual QC/UAT** | NOT RUN |
| **Production** | NOT APPROVED |
| **Edition availability** | Diagnostic, Clinic/Hospital, Trading/Distribution, Manufacturing: Optional; Enterprise: Recommended |
| **Scope document** | this file |
| **Suite overview** | docs/Architecture/05-Business-Operations-Suite.md |
| **ADRs** | ADR-001, ADR-007, ADR-009, ADR-010 |

## Purpose

Manage shareholder register, capital movements, ownership snapshots, retained earnings / distributable profit inputs, statutory reserve, and dividend declaration through payment (including tax deduction, unpaid dividend, and reversal). All equity and dividend accounting posts through MOD-33.

## In scope

- Shareholder register
- Share class, shares, and ownership percentage
- Capital contribution and additional investment
- Share transfer
- Shareholder loan
- Capital withdrawal
- Retained earnings and distributable profit views (from MOD-33 actuals / closing)
- Statutory reserve
- Dividend declaration, ownership snapshot at declaration
- Tax deduction on dividend
- Dividend payable, payment, unpaid dividend
- Reversal of dividend / related equity adjustments via posting rules

## Out of scope

- General ledger design, COA, and voucher UI ownership (MOD-33)
- Payroll and employee loans (MOD-38)
- Procurement and inventory
- Budget masters (MOD-41)
- Legal company secretarial filing automation outside declared scope
- **This reservation phase:** no UI, no API/routes, no Prisma schema, no tenant enablement

## Architectural boundaries

- Shareholder is a party/subledger role (ADR-010); equity and payable posts go through MOD-33 only (ADR-001).
- Posted equity/dividend vouchers are immutable; corrections use reversal + repost (ADR-007).
- Ownership % and share counts must reconcile to share class totals at snapshot points.
- Distributable profit and retained earnings are derived from approved accounting results in MOD-33, not a parallel shadow ledger.
- BDT-first; multi-currency-ready for foreign investor scenarios (ADR-009).

## Integration notes

| System | Role |
|--------|------|
| MOD-33 | Capital, reserves, retained earnings, dividend payable/payment, tax withholding posts; Changes in Equity statement |
| Platform RBAC | Authorization for declaration and payment approvals |
| MOD-07 | Branch/company scoping as applicable to legal entity model |

## Planned screens (documentation only — NOT IMPLEMENTED)

- Shareholder register
- Share class & capital structure
- Capital contribution / additional investment
- Share transfer
- Shareholder loan & capital withdrawal
- Ownership snapshot
- Dividend declaration & approval
- Dividend payment / unpaid dividend
- Statutory reserve maintenance

Volume 4 UI rules apply when implemented: i18n, RTL, WCAG AA, persistent totals on capital/dividend grids, status badges (declared/payable/paid/unpaid/reversed), no hardcoded English.

## Reports / print (planned)

- Shareholder register, ownership snapshot
- Capital movement register
- Dividend declaration & payment register
- Unpaid dividend aging
- Changes in Equity (via MOD-33 statement with MOD-39 detail)

## Governance

Standing ABSHealthcareLite rule: update module docs, registry, dependencies; run AI QC after implementation; Manual QC/UAT required before approval. This reservation is documentation only.

## Status declaration

This module is PLANNED / ARCHITECTURE APPROVED. It is not implemented, not active for tenants, not AI-QC passed, not Manual-QC passed, and not production ready.
