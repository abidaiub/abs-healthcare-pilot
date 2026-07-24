# Manual QC Guide — MOD-23 Pathologist Verification v1.0

## Prerequisites

- ABMG tenant with MOD-22 result in `READY_FOR_VERIFICATION` status
- Pathologist user (e.g. mahmuda.khatun / PATHOLOGIST role)
- Lab technician user (e.g. tania.sultana / LAB_TECH role)

## Test Cases

1. **Verification worklist** — `/lab/verification` lists ready results (pathologist)
2. **Review screen** — open result; parameter table and critical badges visible
3. **Verify** — approve result; status `VERIFIED`; test `COMPLETED`
4. **Reject for correction** — reject with reason and affected parameters; correction request created
5. **Correction worklist** — `/lab/corrections` shows open request (lab tech)
6. **Start correction** — status moves to `IN_PROGRESS`; editor opens
7. **Edit and resubmit** — save corrected values; resubmit → `READY_FOR_VERIFICATION`
8. **History** — `/lab/verification/[resultId]/history` shows verification attempts
9. **Self-approval** — pathologist who entered result requires override reason
10. **RBAC** — lab tech cannot verify; pathologist cannot resubmit without permission
11. **Localization** — switch locale; laboratoryVerification strings render

## Sign-off

| Role | Name | Date | Result |
|------|------|------|--------|
| QC Engineer | | | |
