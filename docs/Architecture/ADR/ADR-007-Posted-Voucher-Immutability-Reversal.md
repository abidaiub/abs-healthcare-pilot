# ADR-007 — Posted Voucher Immutability and Reversal

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-07-26 |
| **Module** | MOD-33 |
| **Implementation** | NOT STARTED |

## Context

Editable posted journals destroy auditability and break period close.

## Decision

- Posted vouchers are **immutable** (no direct edit/delete of posted headers or lines).
- Corrections use **controlled reversal** (offsetting posted voucher) and optional **repost** of a new document.
- Accounting periods can be **locked**; posting into locked periods is denied.
- Segregation of duties (create / approve / post / reverse) is **configurable**.

## Consequences

- Source documents store `postedVoucherId` and cannot silently rewrite GL.
- Reversal requires permission, reason, audit, and period openness checks.
