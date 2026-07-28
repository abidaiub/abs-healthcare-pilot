# MOD-38 — Payroll, Benefits, Loans & Final Settlement

| Field | Value |
|-------|-------|
| **Module** | MOD-38 |
| **Numeric ID** | 38 |
| **Display name** | Payroll, Benefits, Loans & Final Settlement |
| **Category** | Business Operations / Payroll |
| **Depends on** | MOD-37, MOD-33, platform (MOD-01, MOD-01A, MOD-02, MOD-03, MOD-04, MOD-06, MOD-07) |
| **Consumed by** | Finance reporting via MOD-33; employee self-serve payslip (future) |
| **Documentation status** | ARCHITECTURE APPROVED |
| **Implementation status** | NOT STARTED |
| **AI-QC** | NOT RUN |
| **Manual QC/UAT** | NOT RUN |
| **Production** | NOT APPROVED |
| **Edition availability** | Diagnostic: Optional; Clinic/Hospital: Recommended; Trading/Distribution, Manufacturing: Optional; Enterprise: Required |
| **Scope document** | this file |
| **Suite overview** | docs/Architecture/05-Business-Operations-Suite.md |
| **ADRs** | ADR-001, ADR-007, ADR-009, ADR-010 (employee as party / payroll posts) |

## Purpose

Run payroll and related monetary employee settlements: salary structures, earnings/deductions, overtime, loans/advances/installments, tax and PF, payroll validation/approval, salary payment, payslips, and final settlement. **All accounting posts only via MOD-33.**

## In scope

- Salary structure, earnings, and deductions
- Overtime pay calculation (inputs from MOD-37)
- Loan, advance, and installment schedules
- Tax and Provident Fund (PF) handling (jurisdiction-configurable design)
- Payroll run, validation, and approval
- Accounting posting through MOD-33 adapters
- Salary payment
- Payslip generation / print
- Final settlement on separation

## Out of scope

- Employee master, attendance, leave, roster ownership (MOD-37)
- Manual journal UI and COA (MOD-33)
- Shareholder dividends (MOD-39)
- Budgeting of payroll cost centers beyond reading actuals (MOD-41)
- Manufacturing labor costing standards ownership (MOD-42 may consume payroll cost allocations later)
- **This reservation phase:** no UI, no API/routes, no Prisma schema, no tenant enablement

## Architectural boundaries

- MOD-38 never writes GL rows directly; payroll and settlement use the central posting engine (ADR-001).
- Posted payroll vouchers are immutable; corrections use reversal + repost (ADR-007).
- Employee appears as a party/subledger role where needed (ADR-010).
- BDT-first amounts; multi-currency-ready structures reserved (ADR-009).
- Payroll period locking should align with MOD-33 accounting period policy where posts occur.

## Integration notes

| System | Role |
|--------|------|
| MOD-37 | Employee, attendance, OT, leave, separation inputs |
| MOD-33 | Salary expense, liabilities, PF/tax, loan, payment, final settlement posts |
| MOD-02 | Approver identity via User / RBAC |
| MOD-07 | Branch-scoped payroll runs where required |

## Planned screens (documentation only — NOT IMPLEMENTED)

- Salary structure & component setup
- Employee salary assignment
- Loan / advance / installment
- Payroll run wizard & validation
- Payroll approval worklist
- Salary payment
- Payslip viewer / print
- Final settlement worksheet

Volume 4 UI rules apply when implemented: i18n, RTL, WCAG AA, persistent totals on payroll grids, status badges (draft/validated/approved/posted/paid), no hardcoded English.

## Reports / print (planned)

- Payslip, payroll register, bank payment advice
- Loan / advance outstanding, PF / tax summaries
- Final settlement statement
- Earnings & deductions analysis

## Governance

Standing ABSHealthcareLite rule: update module docs, registry, dependencies; run AI QC after implementation; Manual QC/UAT required before approval. This reservation is documentation only.

## Status declaration

This module is PLANNED / ARCHITECTURE APPROVED. It is not implemented, not active for tenants, not AI-QC passed, not Manual-QC passed, and not production ready.
