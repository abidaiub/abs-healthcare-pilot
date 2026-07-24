# Manual QC Guide — MOD-22 Laboratory Result Entry v1.0

## Prerequisites

- ABMG tenant seeded with CBC service parameters and reference ranges
- Lab order with sample marked ready for result (MOD-21)
- User with LAB_TECH role (e.g. tania.sultana)

## Test Cases

1. **Worklist** — `/lab/result-entry` shows tests in READY_FOR_RESULT / RESULT_IN_PROGRESS / READY_FOR_VERIFICATION
2. **Start entry** — create draft from worklist; redirects to editor with parameter lines
3. **Save draft** — enter numeric values; save; status moves to IN_PROGRESS
4. **Abnormal flags** — enter value outside normal range; flag shows LOW/HIGH
5. **Critical value** — enter critical value; event appears; complete blocked until acknowledged
6. **Acknowledge critical** — acknowledge event; complete succeeds
7. **Complete entry** — submit for verification; result and test status READY_FOR_VERIFICATION
8. **Detail view** — read-only parameter table with flags and notes
9. **Reopen** — reopen completed entry with reason; returns to editor
10. **Cancel** — cancel in-progress result; test returns to READY_FOR_RESULT
11. **RBAC** — verify unauthorized roles cannot complete/reopen/acknowledge
12. **Localization** — switch locale; laboratoryResult strings render

## Sign-off

| Role | Name | Date | Result |
|------|------|------|--------|
| QC Engineer | | | |
