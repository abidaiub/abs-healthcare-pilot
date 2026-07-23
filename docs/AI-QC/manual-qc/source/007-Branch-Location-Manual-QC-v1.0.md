# Manual QC Guide — MOD-07 Branch / Location Management v1.0

| Field | Value |
|-------|-------|
| **Module** | MOD-07 |
| **Environment** | ABSHealthcareLite pilot (ABMG tenant) |
| **Status** | NOT TESTED |

## Prerequisites

- `npm run db:seed`
- Tenant admin: `laila.hasan` / `Tenant@2026!`
- Reception: `arif.hossain` / `Tenant@2026!`

## Scenarios

1. Create first/default branch
2. Create additional branch (Mirpur)
3. Duplicate code in same tenant blocked
4. Edit branch profile
5. Set new default branch
6. Deactivate non-default branch
7. Default branch deactivation blocked
8. Assign user to branch
9. Multiple branch assignments
10. Set default working branch
11. Remove assignment
12. Branch switcher — authorized switch
13. Branch switcher — inactive branch hidden
14. Bangla UI on branch screens
15. Arabic RTL layout
16. Urdu RTL layout
17. Hindi UI
18. Mobile layout
19. Audit record verification
20. Session persistence after refresh
21. Logout/login branch context

Record results in the result template. Do not mark PASS until all scenarios executed in browser.
