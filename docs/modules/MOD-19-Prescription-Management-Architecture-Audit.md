# MOD-19 — Prescription Management Architecture Audit

Audit date: 2026-07-24  
Baseline: MOD-18 (`893f413`)

## Module ID decision

| Candidate | Evidence | Verdict |
|-----------|----------|---------|
| **MOD-19** | Product/Architecture books Module 19; `docs/19-PrescriptionManagement/`; dependency MOD-18 → MOD-19 → MOD-20 | **Authoritative** |
| MOD-40 | AI Prescription Capture | Separate AI module |

**Confirmed: MOD-19 — Prescription Management**  
Verify: `npm run verify:mod19` | QC prefix: `019`

## Source-of-truth design

| Layer | Rule |
|-------|------|
| MOD-18 encounter rows | Editable while encounter open |
| Prescription DRAFT | Syncable from encounter; editable |
| Prescription FINALIZED | Immutable snapshot in `Prescription*` child tables |
| Revision | New version copies finalized snapshot; old → SUPERSEDED on new finalize |
| Print | Reads prescription snapshot only, never live encounter rows |

## Reused assets

- `ClinicalEncounter` + child advice rows (sync source only)
- `Patient`, `Doctor`, `Branch`, `Appointment` references
- No medicine master — free-text with structured frequency codes
- No pharmacy inventory or billing

## Deferred

- Pharmacy dispensing (MOD-20)
- Lab order creation
- Drug interaction engine
- E-prescription external submission
