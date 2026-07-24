# MOD-21 — Sample Collection & Lab Workflow (Architecture Audit)

| Field | Value |
|-------|-------|
| **Module** | MOD-21 |
| **Scope** | Lab orders, specimen grouping, collection, receipt, rejection, processing |
| **Depends on** | MOD-07, MOD-15, MOD-18, MOD-19 + platform modules |
| **Explicitly excludes** | MOD-20 pharmacy catalog dependency |

## Architecture Summary

- **Domain layer:** `src/lib/laboratory/` (constants, numbering, grouping, queries, errors)
- **Server actions:** `src/app/actions/tenant-lab-orders.ts`
- **UI:** `src/components/laboratory/*` + `/lab/*` routes
- **RBAC:** `permission-catalog.ts` routes mapped to MOD-21
- **Registry:** `MODULE_REGISTRY` entry with `verify:mod21`

## Workflow

1. Create lab order (encounter advice, prescription investigation, or manual tenant service)
2. Confirm order → allocate accession numbers and specimen groups
3. Collection worklist → collect samples
4. Receipt worklist → accept or reject with reason
5. Processing worklist → mark ready for result (MOD-22 handoff)

## Governance Checks

- Tenant isolation on all lab entities
- Audit events on create/update/print
- i18n namespace `laboratory` across MOD-06 locales
- PHLEBOTOMIST role for collection; LAB_TECH extended for receipt/processing

## Status

AI COMPLETE — MANUAL QC PENDING
