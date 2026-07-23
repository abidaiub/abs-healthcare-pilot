# Manual QC Guide — MOD-15 Patient Registration v1.0

| Field | Value |
|-------|-------|
| **Module** | MOD-15 |
| **Environment** | ABSHealthcareLite pilot (ABMG tenant) |
| **Status** | NOT TESTED |

## Prerequisites

- `npm run db:seed`
- Tenant admin: `laila.hasan` / `Tenant@2026!`
- Reception: `arif.hossain` / `Tenant@2026!`

## Registration

1. Register adult patient with DOB
2. Register child patient with guardian
3. Register patient using estimated age
4. Register patient without personal mobile
5. Register patient with emergency contact
6. Verify generated patient number (`PT-00000n`)
7. Double-submit protection

## Validation

8. Future DOB blocked
9. Negative age blocked
10. Invalid mobile blocked
11. Invalid email blocked
12. Missing required fields blocked
13. Inactive branch registration blocked

## Duplicate detection

14. Same mobile exact match
15. Same mobile with different formatting
16. Same name and DOB
17. Same national ID
18. Similar name only (warning only)
19. Duplicate in another tenant not shown
20. Authorized duplicate-warning override
21. Unauthorized override blocked

## Tenant and branch security

22. Current branch saved as registration branch
23. Cross-tenant patient ID blocked
24. Cross-tenant branch ID blocked
25. Unauthorized patient update blocked
26. Reception permission behaviour
27. Tenant Admin behaviour
28. Inactive patient remains visible
29. Patient reactivation

## Localization and UX

30. English
31. Bangla
32. Arabic RTL
33. Urdu RTL
34. Hindi
35. Mobile patient list
36. Mobile registration form
37. Search by patient number
38. Search by name
39. Search by mobile
40. Status filter
41. Branch filter

## Audit

42. Create audit
43. Update audit
44. Deactivate audit
45. Duplicate-warning override audit

Record results in the result template. Do not mark PASS until all scenarios executed in browser with evidence.
