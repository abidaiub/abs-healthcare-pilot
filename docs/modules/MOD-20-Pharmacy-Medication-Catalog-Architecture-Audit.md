# MOD-20 — Pharmacy & Medication Catalog Architecture Audit

Audit date: 2026-07-24  
Baseline: MOD-19 (`62b916b`)

## Module ID decision

| Candidate | Evidence | Verdict |
|-----------|----------|---------|
| **MOD-20** | Product book Module 20; `docs/20-PharmacyMedicationCatalog/`; registry stub; MOD-19 → MOD-20 chain | **Authoritative** |

**Confirmed: MOD-20 — Pharmacy & Medication Catalog**  
Verify: `npm run verify:mod20` | QC prefix: `020`

## Confirmed scope: Scope A (Catalog foundation)

Product documentation describes dispensing, batch, stock, and billing (Scope B). The pilot implements **Scope A** only:

- Medication generic, brand/catalog item, manufacturer, reference masters
- Branch availability mapping
- Prescription catalog lookup
- CSV import foundation

**Deferred (Scope B):** batch, expiry, stock ledger, dispensing, pharmacy sale, purchase, billing, GL.

## Audit classification

| Item | Status | Action |
|------|--------|--------|
| Medicine/product master | NOT FOUND | **NEW** tenant catalog |
| Pharmaceutical generic | NOT FOUND | **NEW** `MedicationGeneric` |
| Brand model | NOT FOUND | **NEW** `MedicationCatalogItem` |
| Manufacturer | NOT FOUND | **NEW** |
| Dosage form | NOT FOUND | **NEW** tenant reference seed |
| Strength | Partial free-text in MOD-18/19 | **EXTEND** structured + snapshot |
| Route/frequency | MOD-19 frequency codes | **REUSE** codes; **NEW** route master |
| Category | NOT FOUND | **NEW** |
| Unit of measure | NOT FOUND | **NEW** |
| Barcode | NOT FOUND | **NEW** optional field |
| Batch/expiry | NOT FOUND | **DEFER** |
| Inventory/store | NOT FOUND | **DEFER** |
| Pharmacy billing | NOT FOUND | **DEFER** |
| MOD-19 `PrescriptionMedicine` | EXISTS | **EXTEND** `medicationCatalogItemId` |
| MOD-18 `EncounterMedicineAdvice` | EXISTS free-text | **REUSE** unchanged |
| Tenant/branch | MOD-07 | **REUSE** |
| RBAC/Audit/Localization | Platform | **REUSE** |
| Import/export | NOT FOUND | **NEW** CSV import only |

## Source-of-truth design

| Layer | Rule |
|-------|------|
| Medication catalog | Authoritative for new selection and future dispensing lookup |
| MOD-19 finalized prescription | Immutable snapshot — catalog rename does not alter print |
| Branch availability | Operational mapping only — not stock quantity |

## Ownership

- Generic, manufacturer, catalog item: **TENANT-OWNED**
- Branch mapping: **BRANCH OPERATIONAL**
- Global platform reference: **NOT USED** in pilot (tenant-scoped seed defaults)
