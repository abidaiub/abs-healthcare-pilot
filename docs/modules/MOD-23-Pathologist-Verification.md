# MOD-23 — Pathologist Verification

| Field | Value |
|-------|-------|
| **Module** | MOD-23 |
| **Display name** | Pathologist Verification |
| **Depends on** | MOD-07, MOD-15, MOD-21, MOD-22 + platform modules |
| **Verify** | `npm run verify:mod23` |
| **Status** | AI COMPLETE — MANUAL QC PENDING |

## Purpose

Provide pathologist verification and approval of laboratory results entered in MOD-22, with rejection-for-correction workflow and technician resubmit loop.

## Scope (Pilot)

- Verification worklist for `READY_FOR_VERIFICATION` results
- Pathologist review screen with parameter table
- Verify → `VERIFIED` with verifier snapshot
- Reject for correction → correction request + `REJECTED_FOR_CORRECTION`
- Correction worklist for lab technicians
- Start correction → edit result → resubmit for verification
- Verification history audit trail
- Self-verification override governance
- RBAC separation: pathologist verify/reject vs lab tech corrections

Out of scope: report release (MOD-24), digital signatures on reports.

## QC

Automated: PASS | Manual: NOT TESTED | Production: Pending Manual QC
