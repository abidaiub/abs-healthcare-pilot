# ADR-009 — BDT-First, Multi-Currency-Ready Architecture

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-07-26 |
| **Module** | MOD-33 (primary), all financial modules |
| **Implementation** | NOT STARTED |

## Context

Primary market is Bangladesh (BDT), but SaaS tenants in GCC and APAC need multi-currency readiness.

## Decision

- Base implementation currency: **BDT**
- Architecture must remain **multi-currency ready** (currencyId, exchangeRate on financial documents)
- Day-1 operational UI may focus on BDT; schema and posting contracts must not hard-block multi-currency

## Consequences

- Financial reports show currency clearly.
- Localization (MOD-06) formats amounts; accounting stores numeric precision independently.
