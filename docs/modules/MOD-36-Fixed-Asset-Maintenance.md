# MOD-36 — Fixed Asset, Device Maintenance & Calibration

| Field | Value |
|-------|-------|
| **Module** | MOD-36 |
| **Numeric ID** | 36 |
| **Display name** | Fixed Asset, Device Maintenance & Calibration |
| **Category** | Business Operations / Fixed Assets |
| **Depends on** | Platform (MOD-01, MOD-01A, MOD-02, MOD-03, MOD-04, MOD-06, MOD-07), MOD-33; optional MOD-35 for spare parts |
| **Consumed by** | Future facility / biomedical reporting; capitalization may link from MOD-34 procurement outcomes |
| **Documentation status** | ARCHITECTURE APPROVED |
| **Implementation status** | NOT STARTED |
| **AI-QC** | NOT RUN |
| **Manual QC/UAT** | NOT RUN |
| **Production** | NOT APPROVED |
| **Edition availability** | Diagnostic: Optional; Clinic/Hospital: Recommended; Trading/Distribution: Optional; Manufacturing: Recommended; Enterprise: Required |
| **Scope document** | this file |
| **Suite overview** | docs/Architecture/05-Business-Operations-Suite.md |
| **ADRs** | ADR-001, ADR-007 (posting); optional stock via ADR-002 |

## Purpose

Manage the fixed asset register and the maintenance/calibration lifecycle for devices and equipment. MOD-36 covers capitalization, tagging, custody, depreciation, transfers, warranty/AMC, breakdowns, spare parts consumption, downtime, and disposal/sale/write-off. Accounting posts only through MOD-33.

## In scope

- Asset register and capitalization
- Asset tagging, assignment, location, custodian
- Depreciation methods and periodic depreciation run
- Asset transfer between branches/locations/custodians
- Maintenance scheduling and work orders
- Calibration records and due tracking
- Warranty and AMC contracts
- Breakdown logging, spare parts usage, downtime
- Disposal, sale, and write-off
- Optional link from procurement capitalization; optional spare-parts stock via MOD-35

## Out of scope

- LIS analyzer **operational** masters, worklists, and result pipelines (remain in laboratory modules)
- General procurement PR/PO/GRN ownership (MOD-34)
- Generic inventory item master as the asset register (MOD-35 is stock; assets are capitalized here)
- GL voucher design and financial statements (MOD-33)
- Employee HR master beyond custodian identity link (MOD-37)
- **This reservation phase:** no UI, no API/routes, no Prisma schema, no tenant enablement

## Architectural boundaries

- LIS analyzers stay operational masters in lab modules; MOD-36 may optionally link capitalization/maintenance records to those devices without replacing lab configuration.
- Depreciation, capitalization, disposal, and sale post exclusively via MOD-33 (immutable posted vouchers; reversal + repost for corrections).
- Spare parts quantity tracking, when enabled, uses MOD-35; MOD-36 records maintenance context and cost linkage.
- Asset identity is distinct from inventory SKU; capitalization bridges procurement/inventory outcomes into the asset register.

## Integration notes

| System | Role |
|--------|------|
| MOD-33 | Capitalization, depreciation, disposal/sale/write-off posts |
| MOD-34 | Optional source for asset purchase / capitalization |
| MOD-35 | Optional spare-parts issue/return |
| Lab modules | Operational analyzer masters; optional capitalization link only |
| MOD-07 | Branch / location scoping for custody and transfer |

## Planned screens (documentation only — NOT IMPLEMENTED)

- Asset register list / detail
- Capitalization & tagging
- Assignment / location / custodian
- Depreciation setup & run
- Transfer
- Maintenance & calibration schedules
- Warranty / AMC
- Breakdown / downtime / spare parts
- Disposal / sale / write-off

Volume 4 UI rules apply when implemented: i18n, RTL, WCAG AA, persistent totals on cost/NBV grids, status badges (active, under maintenance, disposed), no hardcoded English.

## Reports / print (planned)

- Asset register, depreciation schedule, NBV report
- Maintenance / calibration due lists
- Downtime and breakdown register
- Disposal / sale / write-off register
- Warranty / AMC expiry

## Governance

Standing ABSHealthcareLite rule: update module docs, registry, dependencies; run AI QC after implementation; Manual QC/UAT required before approval. This reservation is documentation only.

## Status declaration

This module is PLANNED / ARCHITECTURE APPROVED. It is not implemented, not active for tenants, not AI-QC passed, not Manual-QC passed, and not production ready.
