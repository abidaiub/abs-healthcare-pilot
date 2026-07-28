# ADR-005 — MOD-16 Patient Ledger versus General Ledger

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-07-26 |
| **Module** | MOD-16 Patient Profile & Ledger |
| **Implementation** | NOT STARTED |

## Context

“Ledger” in MOD-16 can be confused with General Ledger / account ledger / financial statements.

## Decision

MOD-16 is a **patient-centric clinical-financial 360° hub and patient subledger UX**. It is **not**:

- General Ledger
- Account Ledger
- Cash Book / Bank Book
- Trial Balance / Profit and Loss / Balance Sheet

Those belong to MOD-33. MOD-16 projects patient AR/dues over MOD-10 operational billing and future MOD-33 patient subledger postings.

## Consequences

- Naming and UI must say “Patient Ledger” / “Patient Account”, never “General Ledger”.
- Corrections remain via refund/adjustment entries at patient level; GL corrections use voucher reversal (ADR-007).
