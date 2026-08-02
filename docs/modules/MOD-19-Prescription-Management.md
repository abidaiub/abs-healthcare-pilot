# MOD-19 — Prescription Management

| Field | Value |
|-------|-------|
| **Module** | MOD-19 |
| **Display name** | Prescription Management |
| **Depends on** | MOD-07, MOD-15, MOD-17, MOD-18 + platform modules |
| **Verify** | `npm run verify:mod19` |
| **Status** | AI COMPLETE — MANUAL QC PENDING |

## Purpose

Convert clinical encounter medicine advice into controlled, versioned, printable prescriptions (`RX-000001`) with immutable finalized snapshots.

## Scope

Draft, sync from encounter, finalize, cancel, revision, print/reprint audit, history. Out of scope: pharmacy stock, dispensing, billing, lab orders.

## QC

J-01 Part 1 browser UAT (2026-08-01): PASS. `RX-000004` version 1 finalized with CBC, TSH, and Free T4 and all three lines appeared in print preview and downstream billing.

J-01 Part 3 browser UAT (2026-08-02): PASS. The doctor created `RX-000004` version 2 through the revision UI with an auditable reason. Version 1 was preserved as SUPERSEDED; version 2 is FINALIZED/current with fictional Levothyroxine 50 mcg OD, a 42-day follow-up and repeat TSH instruction. History and print preview passed.

Automated: PASS | Manual: NOT TESTED | Production: Pending Manual QC
