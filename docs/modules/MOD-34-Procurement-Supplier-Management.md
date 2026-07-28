# MOD-34 — Procurement & Supplier Management

| Field | Value |
|-------|-------|
| **Module** | MOD-34 |
| **Numeric ID** | 34 |
| **Display name** | Procurement & Supplier Management |
| **Category** | Business Operations / Procurement |
| **Depends on** | MOD-01, MOD-01A, MOD-02, MOD-03, MOD-04, MOD-06, MOD-07, MOD-33, MOD-35 |
| **Consumed by** | MOD-14 (healthcare extension), MOD-20 adapter (indirect via stock), MOD-42 (materials procurement), MOD-41 (commitments) |
| **Documentation status** | ARCHITECTURE APPROVED |
| **Implementation status** | NOT STARTED |
| **AI-QC** | NOT RUN |
| **Manual QC/UAT** | NOT RUN |
| **Production** | NOT APPROVED |
| **Edition availability** | Diagnostic: Optional; Clinic/Hospital: Recommended; Trading/Distribution, Manufacturing, Enterprise: Required |
| **Scope document** | this file |
| **Suite overview** | docs/Architecture/05-Business-Operations-Suite.md |
| **ADRs** | ADR-006 (primary); posting via ADR-001 / ADR-007; inventory receipt via ADR-002 |

## Purpose

Own the enterprise procure-to-pay chain: supplier master, requisition through purchase order, receiving/GRN orchestration, inspection, supplier invoice with three-way matching, returns, advances, payments, and landed-cost elements. Accounting posts only through MOD-33; stock receipts/issues orchestrate through MOD-35.

## In scope

- Supplier master (party role; tax profile; payment terms)
- Purchase Requisition (PR) and approval workflow
- Quotation and comparative statement
- Purchase Order (PO), amendments, and partial receiving
- GRN orchestration and inspection
- Supplier invoice and **three-way matching** (PO–GRN–Invoice)
- Purchase return
- Supplier advance, supplier payment
- Tax/VAT, freight, and landed cost capture
- Commitment exposure for MOD-41 (open PO / approved PR commitments)
- GRNI clearing policy per ADR-006

## Out of scope

- Chart of Accounts, vouchers, GL statements (MOD-33)
- Item master, warehouse, batch/serial, valuation engine (MOD-35)
- Healthcare-specific inventory policies and clinical consumable rules (MOD-14 extension)
- Pharmacy medication catalog (MOD-20)
- Fixed asset capitalization UI (MOD-36 may capitalize from procurement outcomes)
- Budget master and approval limits setup (MOD-41)
- Manufacturing BOM / production orders (MOD-42)
- **This reservation phase:** no UI, no API/routes, no Prisma schema, no tenant enablement

## Architectural boundaries

- Default purchase accounting (ADR-006): GRN → Inventory Dr / GRNI Cr; Supplier invoice → clear GRNI, apply VAT/variance, AP Cr. **No AP credit at GRN by default.**
- MOD-34 does not write GL lines; it invokes MOD-33 posting adapters.
- Stock quantity/value updates on receive/return go through MOD-35 (single inventory engine).
- MOD-14 becomes a healthcare extension of MOD-34/MOD-35; it does not become a second procurement engine.
- Commitment data is readable by MOD-41; budget override policy lives in MOD-41.

## Integration notes

| System | Role |
|--------|------|
| MOD-33 | AP, GRNI, VAT, advances, payments, landed-cost capitalization posts |
| MOD-35 | GRN stock receipt, purchase return stock, landed-cost value adjustments |
| MOD-14 | Healthcare inventory extension consuming procurement outcomes |
| MOD-41 | Reads PO/PR commitments for commitment control |
| MOD-42 | Materials procurement for production |

## Planned screens (documentation only — NOT IMPLEMENTED)

- Supplier master list / detail
- Purchase Requisition entry & approval
- Quotation / comparative statement
- Purchase Order entry, amend, print
- GRN / partial receive & inspection
- Supplier invoice & three-way match worklist
- Purchase return
- Supplier advance & payment
- Landed cost / freight allocation

Volume 4 UI rules apply when implemented: i18n, RTL, WCAG AA, persistent totals on monetary documents, status badges (PR/PO/GRN/invoice states), no hardcoded English.

## Reports / print (planned)

- PO print, GRN print, supplier invoice register
- Comparative statement, outstanding PO, GRNI aging
- Supplier ledger (via MOD-33 party subledger), purchase return register
- Tax/VAT purchase summary

## Governance

Standing ABSHealthcareLite rule: update module docs, registry, dependencies; run AI QC after implementation; Manual QC/UAT required before approval. This reservation is documentation only.

## Status declaration

This module is PLANNED / ARCHITECTURE APPROVED. It is not implemented, not active for tenants, not AI-QC passed, not Manual-QC passed, and not production ready.
