# Manual QC Guide — MOD-18 Doctor Consultation v1.0

| Field | Value |
|-------|-------|
| **Module** | MOD-18 |
| **Status** | NOT TESTED |

## Prerequisites

- `npm run db:seed`
- Doctor: `amina.rahman` / `Tenant@2026!`
- Reception: `arif.hossain` / `Tenant@2026!`

## Worklist and start

1. Doctor worklist shows today's queue
2. Start consultation from CALLED appointment
3. Idempotent start returns same encounter
4. Appointment status becomes IN_CONSULTATION
5. Encounter number format EN-00000n

## Workspace

6. Save draft preserves data
7. Record vitals with BMI
8. Invalid vitals blocked
9. Add/remove diagnosis
10. Add/remove medicine advice
11. Add/remove investigation advice
12. Complete consultation
13. Appointment becomes COMPLETED

## Security

14. Reception cannot edit clinical notes
15. Cross-tenant encounter blocked
16. Completed encounter read-only
17. Reopen requires permission and reason
18. Print requires permission

## Regression

19. MOD-17 queue still works
20. MOD-15 patient search still works
