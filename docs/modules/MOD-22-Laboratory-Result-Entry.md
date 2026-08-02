# MOD-22 — Laboratory Result Entry

| Field | Value |
|-------|-------|
| **Module** | MOD-22 |
| **Display name** | Laboratory Result Entry |
| **Depends on** | MOD-07, MOD-15, MOD-21 + platform modules |
| **Verify** | `npm run verify:mod22` |
| **Status** | AI COMPLETE — MANUAL QC PENDING |

## Purpose

Provide tenant-safe manual laboratory result entry with parameter validation, reference range selection, abnormal flag computation, and critical value acknowledgement before verification handoff (MOD-23).

## Scope (Pilot)

- Result entry worklist from MOD-21 ready-for-result tests
- Draft result creation with service parameter lines
- Parameter value validation by result type
- Age/gender-aware reference range snapshots (`ServiceParameterReferenceRange`; tenant-scoped)
- Age in days from `dateOfBirth`, or from `estimatedAge` × 365 when DOB is absent
- Abnormal and critical flag computation (`LOW` / `NORMAL` / `HIGH` / `CRITICAL_*`; unit mismatch or missing range → `UNDETERMINED`)
- Critical value event acknowledgement
- Complete entry → ready for verification
- Reopen and cancel workflows

Schema does **not** currently scope ranges by branch, analyzer/method, or effective dates.

Out of scope: branch/method-specific ranges, verification (MOD-23), report release (MOD-24). LIS import is covered under MOD-22 analyzer path + MOD-21 sample readiness.

DPDC UAT ranges: `prisma/seed/uat/doctors-point-reference-ranges.ts` (see E2E doc `04-DPDC-Reference-Ranges-and-Section-Routing.md`).

## QC

### J-01 Part 2 browser UAT (2026-08-01)

PASS for `LAB-000004`: accession-keyed LIS import, duplicate-control-id protection, reference-range flagging, LIS override denial, completion, and versioned downstream verification were exercised. `J01-P2-D001` was a UAT payload scale mismatch: WBC `7.2` and PLT `250` were initially sent as `/cumm` and correctly flagged critical-low. A second audited LIS message corrected them to `7200` and `250000`; both recalculated NORMAL. Regression state is asserted by `scripts/verify-j01-part2-state.ts`.

Automated: PASS | Manual: NOT TESTED | Production: Pending Manual QC
