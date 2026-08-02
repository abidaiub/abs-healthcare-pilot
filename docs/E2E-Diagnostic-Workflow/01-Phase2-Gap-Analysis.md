# Doctors Point Diagnostic Center — Phase 2 Gap Analysis

**Document:** `01-Phase2-Gap-Analysis.md`  
**Status:** Complete  
**Depends on:** `00-Phase1-Discovery-and-Coverage-Matrix.md`  
**Date:** 26 July 2026

---

## Decision record (recommended path — accepted)

| Gap | Decision |
|-----|----------|
| Billing / invoice / discount | Implement real schema + workflow |
| MOD-05 notifications | Minimal outbox + provider abstraction (console/HTTP gateway) |
| LIS quarantine / idempotency | Implement message log + reconcile |
| Patient portal auth | Implement real auth + ownership + explicit guardian delegation |
| Overall scope | Sequential completion of documented gaps |

---

## Workflow-step classification

See §5 of `00-Phase1-Discovery-and-Coverage-Matrix.md` for the 38-step table.

After implementation in the working tree, the previously blocking steps are reclassified:

| # | Step | Updated classification |
|---|------|------------------------|
| 6 | Doctor schedules published | Already working (`DoctorSchedule` + publish) |
| 14–17 | Bill / discount / payment / cash memo | Already working (`Invoice*` models + billing actions/UI) |
| 19 | Barcode labels printed | Already working (Code 128 + QR images) |
| 24 | LIS results imported | Already working (ingest + quarantine + reconcile) |
| 33 | Notification sent | Already working (outbox + console/HTTP provider) |
| 34–35 | Portal access / download | Already working (portal auth + ownership; Case 3 via explicit delegation) |

Document-only gaps (unchanged):

- Guardian/minor **policy** beyond explicit delegation — never invent silent access.
- Serum Ferritin — catalog gap; omit from Case 2.

---

## Implementation maturity (post Phase 3)

| Area | Maturity |
|------|----------|
| Diagnostic billing | DONE |
| Notification outbox | MOSTLY DONE (no full inbox UI; dispatch path real) |
| LIS quarantine | DONE |
| Patient portal auth | DONE (staff admin page + UAT enrollment) |
| Doctor schedules | DONE |
| Sample barcode images | DONE |
| Department setup | MOSTLY DONE (seed path) |
| Doctors Point UAT seed | DONE (includes portal accounts + Case 3 delegation) |
