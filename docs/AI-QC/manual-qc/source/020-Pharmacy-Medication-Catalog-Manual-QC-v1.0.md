# Manual QC Guide — MOD-20 Pharmacy & Medication Catalog v1.0

| Field | Value |
|-------|-------|
| **Module** | MOD-20 |
| **Status** | NOT TESTED |

## Prerequisites

- Tenant admin: `laila.hasan` / `Tenant@2026!`
- Doctor: `amina.rahman` / `Tenant@2026!`

## Test cases

1. Open `/pharmacy/medications` — list loads with demo items after seed
2. Create medication — receives `MED-000001` style code
3. Activate medication — appears in prescription catalog search
4. Doctor prescription editor — search and select catalog item
5. Finalize prescription — snapshot unchanged after catalog rename
6. Branch availability — disable at branch, verify search filter
7. CSV import preview and apply
8. Cross-tenant access denied on manipulated medication ID
