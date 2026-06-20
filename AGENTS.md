<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ABSHealthcareLite Pilot — Diagnostic-First MVP

## Priority

**Diagnostic-First MVP** — do not extend general OPD UI (appointments, doctor worklist, reception dashboard) unless explicitly requested.

Build **production foundation UI** from approved module documentation. UI first → DB → CRUD.

## Source of truth

- Module specs: `docs/{NN-ModuleName}/*_v1.md`
- Product Book V4: `docs/ProductBook/ABSHealthcareLite_Product_Master_Book_v4_UIUXBlueprint.md`
- Sample Data Dictionary: `docs/UIUXMockups/00-ABSHealthcareLite_SampleDataDictionary.md`
- Screen registry: `src/lib/module-registry.ts`
- Sample data (UI layer): `src/lib/diagnostic-data.ts`

## Diagnostic MVP screens

| Route | Screen |
|-------|--------|
| `/host/catalog` | Host Master Service/Test Catalog (Module 10) |
| `/tenant/test-setup` | Tenant-wise Service/Test Setup (Module 10) |
| `/patients/new` | Patient Registration (Module 15) |
| `/patients` | Patient Search (Module 15) |
| `/diagnostic/billing` | Diagnostic Billing / Test Order |
| `/lab/sample-collection` | Sample Collection Queue (Module 21) |
| `/lab/label-print` | Barcode / Tube Label Print (Module 21) |
| `/lab/lis-worklist` | LIS Worklist (Module 22) |
| `/lab/result-entry` | Manual Result Entry (Module 22) |
| `/lab/verification` | Result Verification (Module 23) |
| `/lab/report-release` | Report Generate / Print (Module 24) |
| `/portal/reports` | Patient Portal My Reports (Module 30) |

Module 40 (AI Prescription Capture) — future readiness only; do not build UI unless requested.

## Rules

1. Match documented fields, workflows, and screen lists from module specs.
2. No temporary mockup-only UI or throwaway layouts.
3. No Prisma CRUD until UI foundation is approved.
4. Interim session: `src/lib/mock-session.ts` — `TODO: Replace mock session with real authentication before production.`
5. Register new screens in `src/lib/module-registry.ts` and use `ModulePageHeader`.

## Navigation

Role-based Diagnostic MVP menu in `src/lib/navigation.ts`:

- **Host Admin** → Host Test Catalog
- **Tenant Admin** → Tenant Test Setup
- **Reception** → Patient Registration, Diagnostic Billing
- **Lab** → Sample Collection through Report Release
- **Patient Portal** → My Reports
