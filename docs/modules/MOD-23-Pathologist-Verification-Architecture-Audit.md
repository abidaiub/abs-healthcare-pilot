# MOD-23 Architecture Audit — Pathologist Verification

## Routes

| Route | Screen key | Permission |
|-------|------------|------------|
| `/lab/verification` | verification | `/lab/verification` |
| `/lab/verification/[resultId]` | verificationReview | `/lab/verification` + verify/reject sub-resources |
| `/lab/verification/[resultId]/history` | verificationHistory | `/lab/verification/history` |
| `/lab/corrections` | correctionWorklist | `/lab/corrections` |

## Server actions

`src/app/actions/tenant-lab-verification.ts` — worklist, review, verify, reject, correction start/resubmit.

## Data model

- `LabResultVerification` — verification attempts with decision, verifier snapshot, rejection metadata
- `LabResultCorrectionRequest` — open/in-progress/resubmitted correction lifecycle

## RBAC

- **PATHOLOGIST** role: verification sub-routes with `canApprove` on verify/reject
- **LAB_TECH**: view verification worklist (no approve), corrections + resubmit
- **TENANT_ADMIN**: full access via seed

## Dependencies

MOD-22 result entry must complete to `READY_FOR_VERIFICATION` before MOD-23 review.

## Verification

`npm run verify:mod23` — registry, RBAC, i18n, status guards, schema delegate.
