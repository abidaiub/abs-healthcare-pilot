# ADR-001 — One Central Accounting Posting Engine

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-07-26 |
| **Module** | MOD-33 Finance & General Accounting |
| **Implementation** | NOT STARTED |

## Context

Healthcare and enterprise source documents (invoices, GRNs, payroll, asset capitalization, dividends) must update financial books without each module writing arbitrary GL rows.

## Decision

MOD-33 owns a single reusable double-entry **Posting Engine**. Every approved source transaction posts through this engine via adapters that emit balanced journal intents.

## Consequences

- Operational modules (including MOD-10) never write GL lines directly.
- Postings are tenant-isolated, branch-scoped, balanced, idempotent, source-traceable, reversible, concurrency-protected, permission-checked, and audited.
- Posted vouchers are immutable; corrections use reversal and reposting (ADR-007).
