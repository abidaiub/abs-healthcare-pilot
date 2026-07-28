# ADR-010 — Generic Party / Subledger Model

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-07-26 |
| **Module** | MOD-33 |
| **Implementation** | NOT STARTED |

## Context

GL control accounts need party detail for patients, customers, suppliers, employees, shareholders, bank accounts, and fixed assets without hard-coding healthcare-only GL structure.

## Decision

MOD-33 supports a **generic party/subledger** model with typed parties at minimum:

- patient
- customer
- supplier
- employee
- shareholder
- bank account
- fixed asset

Control accounts on the Chart of Accounts map to party types. Healthcare patient AR UX is delivered by MOD-16 over the patient subledger; trading customer AR uses the same engine with customer party type.

## Consequences

- Source adapters must supply party type + party id when posting to control accounts.
- No healthcare-specific hard-coding inside the core posting engine.
