# Manual QC Guide — MOD-17 Appointment & Queue Management v1.0

| Field | Value |
|-------|-------|
| **Module** | MOD-17 |
| **Environment** | ABSHealthcareLite pilot (ABMG tenant) |
| **Status** | NOT TESTED |

## Prerequisites

- `npm run db:seed`
- Tenant admin: `laila.hasan` / `Tenant@2026!`
- Reception: `arif.hossain` / `Tenant@2026!`

## Appointment booking

1. Book scheduled appointment for existing patient
2. Book walk-in appointment (auto check-in + queue token)
3. Verify appointment number format (`AP-00000n`)
4. Select doctor at current branch
5. Optional department and reason for visit
6. Double-submit protection

## Validation

7. Past appointment date blocked
8. Invalid time slot blocked
9. Duplicate slot for same doctor blocked
10. Inactive patient blocked
11. Doctor not at branch blocked
12. Inactive branch blocked

## Appointment lifecycle

13. Check in scheduled appointment → Waiting
14. Call patient → Called
15. Start consultation → In Consultation
16. Complete appointment → Completed
17. Cancel appointment → Cancelled
18. Mark no show → No Show
19. Edit appointment (allowed statuses only)

## Queue operator

20. Queue dashboard shows waiting count per doctor
21. Next token displayed correctly
22. Call next patient
23. Skip patient (requeued to end)
24. Recall called patient
25. Complete from queue
26. Daily token reset (next calendar day)

## Security

27. Cross-tenant appointment ID blocked
28. Cross-tenant branch blocked
29. Unauthorized queue manipulation blocked
30. Reception permission behaviour
31. Tenant Admin behaviour

## Patient integration (MOD-15)

32. Patient search by number
33. Patient search by name
34. Patient search by mobile
35. No duplicate demographics stored on appointment

## Localization and UX

36. English
37. Bangla
38. Arabic RTL
39. Urdu RTL
40. Hindi
41. Responsive list and operator screens

## Regression

42. MOD-07 branch switch still works
43. MOD-15 patient registration still works

## Sign-off

| Role | Name | Date | Result |
|------|------|------|--------|
| QC Engineer | | | NOT TESTED |
| Product Owner | | | NOT TESTED |
