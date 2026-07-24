# Manual QC Guide — MOD-21 Sample Collection & Lab Workflow v1.0

## Prerequisites

- ABMG tenant seeded with lab rejection reasons
- User with PHLEBOTOMIST or LAB_TECH role
- Completed consultation or prescription with investigations

## Test Cases

1. **Create lab order from consultation** — investigations → draft order → edit → confirm
2. **Create lab order from prescription** — finalized prescription investigations → draft order
3. **Manual lab order** — patient search + tenant service search → save
4. **Collection worklist** — collect pending sample → status COLLECTED
5. **Receipt** — receive collected sample OR reject with reason
6. **Recollection** — rejected sample → request recollection → new accession
7. **Processing** — mark received sample ready for result
8. **Label print** — print/reprint sample label with audit event
9. **RBAC** — verify PHLEBOTOMIST cannot access receipt without permission
10. **Localization** — switch locale; laboratory strings render

## Sign-off

| Role | Name | Date | Result |
|------|------|------|--------|
| QC Engineer | | | |
