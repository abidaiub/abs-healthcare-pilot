# MOD-22 Laboratory Result Entry — Architecture Audit

| Field | Value |
|-------|-------|
| **Module** | MOD-22 |
| **Audit date** | 24-Jul-2026 |
| **Status** | Implemented (pilot) |

## Layer Map

| Layer | Path | Notes |
|-------|------|-------|
| Schema | `prisma/schema.prisma` | `LabResult`, `LabResultItem`, `LabCriticalValueEvent` |
| Domain | `src/lib/laboratory-result/` | Constants, validation, ranges, flags, queries |
| Actions | `src/app/actions/tenant-lab-results.ts` | Tenant-scoped server actions |
| Pages | `src/app/(app)/lab/result-entry/` | Worklist, detail, edit |
| UI | `src/components/laboratory-result/` | Worklist, detail, editor panels |
| RBAC | `src/lib/rbac/permission-catalog.ts` | Result entry routes + granular actions |
| Registry | `src/lib/saas-foundation-data.ts` | MOD-22 governance metadata |
| Verify | `scripts/verify-mod22-laboratory-result-entry.ts` | Automated compliance |

## Dependencies

- **MOD-07** — Branch context for worklist scoping
- **MOD-15** — Patient demographics for age/gender range selection
- **MOD-21** — Lab orders/tests/samples in READY_FOR_RESULT status
- **Platform** — MOD-01/01A/02/03/04/06 auth, RBAC, audit, i18n

**Explicit exclusion:** MOD-20 (Pharmacy) — not a dependency.

## Status Transitions

```
LabOrderTest: READY_FOR_RESULT → RESULT_IN_PROGRESS → READY_FOR_VERIFICATION
LabResult: DRAFT → IN_PROGRESS → READY_FOR_VERIFICATION
```

Reopen returns result to IN_PROGRESS and test to RESULT_IN_PROGRESS. Cancel sets result CANCELLED and test back to READY_FOR_RESULT.

## Critical Value Flow

1. Numeric parameter saved with value outside critical limits
2. `LabCriticalValueEvent` created (unacknowledged)
3. Complete blocked until all critical events acknowledged
4. Acknowledgement audited with optional communication note

## Open Items (Post-Pilot)

- LIS/analyzer result import queue (`/lab/lis-worklist` remains stub)
- MOD-23 verification handoff integration
- Calculated parameter formulas
