# DPDC Patient Case 3 — Live Browser UAT Log

**Started:** 2026-07-27  
**Last updated:** 2026-07-27  
**Patient profile:** Master Samiul Islam · 12M · Paediatric fever/electrolytes  
**Guardian:** Md. Nurul Islam (Father) · mobile **01712200903**  
**Doctor:** Dr. Farhana Rahman  
**Expected price list:** CBC 500 + ESR 300 + Serum Electrolytes 1200 + RBS 250 = **Gross 2250**  
**Expected billing:** 15% disc → Net **1912.50** · Pay 50% **956.25** · Due **956.25**  
**UAT status:** **PASS** — full diagnostic workflow completed in browser (Steps 1–27)

## Step results

| Step | Result | Evidence |
|------|--------|----------|
| 1 Register minor patient | **PASS** | `/patients/new` → **PT-000008** Master Samiul Islam |
| 2 Record DOB/guardian/address | **PASS** | DOB 2014-03-15 · Guardian Md. Nurul Islam · Father · 01712200903 · Char Fasson, Bhola |
| 3 Adult-only assumptions | **PASS** | DOB used (not estimated age); guardian section populated; patient mobile left empty |
| 4 Book appointment Dr Farhana | **PASS** | AP `cms3g1n1e004lz4vynl4xfu27` · 2026-07-27 10:00 |
| 5 Queue token / arrived | **PASS** | Checked in; doctor worklist shows PT-000008 waiting |
| 6 Consultation + Rx | **PASS** | EN `cms3g2eyi004qz4vye9q1qma0` · RX-000003 finalized (CBC, ESR, Electrolytes, RBS) |
| 7 Billing load from Rx | **PASS** | LAB-000003 / INV-000003 created from RX-000003 |
| 8 15% discount | **PASS** | BDT 337.5 · reason "Management-approved patient support" · dp.billing |
| 9 Collect 50% payment | **PASS** | RCP-000004 · Cash BDT 956.25 |
| 10 Invoice reconciliation | **PASS** | Gross 2250 − Disc 337.5 = Net 1912.5; Paid 956.25; Due 956.25 |
| 11 Sample accession | **PASS** | Order confirmed → ACC-000008 (EDTA), ACC-000009 (Plain), ACC-000010 (Fluoride) |
| 12 Barcode labels | **PASS** | ACC-000008 label: barcode + QR · Dept Haematology Laboratory |
| 13 Sample collection + receipt | **PASS** | All 3 collected (`dp.collection`) and received at `/lab/receipt` |
| 14 Department routing | **PASS** | `dp.tech.haem` marked ACC-000008/009/010 ready on `/lab/processing` |
| 15 LIS fault (one) | **PASS** | API `CASE3-FAULT-001` · barcode `ACC-WRONG-999` → quarantine `UNKNOWN_SAMPLE_BARCODE` |
| 16 Verify quarantine | **PASS** | Filter QUARANTINED · Erba Elite 5 (DP-ELEC-01) · message visible |
| 17 Reconcile LIS | **PASS** | `dp.lis.reconcile` mapped to ACC-000009 · reconciled |
| 18 Import corrected results | **PASS** | Electrolytes via reconcile; `CASE3-CBC-002` HL7; `CASE3-ESR-001` HL7; `CASE3-RBS-001` API |
| 19 Critical K 6.5 | **PASS** | `/lab/result-entry/cms3gym42006fz4vymu3ez3wx` · K+ **6.5** · flag **Critical high** |
| 20 Paediatric ref range | **PASS** | Electrolytes panel shows K ref **3.5–5.1** mmol/L for 12M patient PT-000008 |
| 21 Critical acknowledgement | **PASS** | `dp.verify.doctor` acknowledged K+ 6.5 and RBS Glucose 145 |
| 22 Result entry complete | **PASS** | All 4 results → `READY_FOR_VERIFICATION` (`dp.report.entry`) |
| 22 Verify all results | **PASS** | `dp.verify.doctor` · worklist empty after verify |
| 22 Billing hold blocks release | **PASS** | `dp.report.delivery` · `Release blocked by billing hold` · Due BDT 956.25 |
| 22 Unauthorized hold clear | **PASS** | `dp.collection` + `dp.report.entry` denied `/lab/report-release` |
| 22 Collect balance | **PASS** | RCP-000005 · BDT 956.25 · `dp.billing` |
| 22 Invoice PAID | **PASS** | INV-000003 Status **Paid** · Paid 1912.50 · Due 0 |
| 22 Release all reports | **PASS** | RPT-0000008–11 authorized + published |
| 22 PDF / QR / audit | **PASS** | QR verify valid for RPT-0000008; PDF download triggered |
| 22 Portal enroll | **PASS** | `dp.tenant.admin` enrolled PT-000008 · username **01712200903** |
| 22 Guardian portal scope | **PASS** | Portal shows 4 PT-000008 reports only |
| 22 Cross-patient security | **PASS** | PT-000005 / PT-000006 reports not listed |
| 22 Portal PDF + audit | **PASS** | RPT-0000008 download count incremented |
| 22 Doctor follow-up | **PASS** | EN completed · 14-day follow-up · fever/hydration instructions |
| 22 Rx v2 + versioning | **PASS** | RX-000003 v2 finalized; v1 superseded; follow-up on v2 detail |

## Key IDs (Case 3 runtime)

| Entity | ID / Number |
|--------|-------------|
| Patient | `PT-000008` |
| Guardian mobile (portal) | `01712200903` / `Portal@2026!` |
| Appointment | `cms3g1n1e004lz4vynl4xfu27` |
| Encounter | `cms3g2eyi004qz4vye9q1qma0` (COMPLETED) |
| Prescription v1 | `RX-000003` / `cms3g693l0050z4vy4jxg7prt` (SUPERSEDED) |
| Prescription v2 | `RX-000003` v2 / `cms3zra6c009rz4vyku86fa6u` (FINALIZED) |
| Lab order | `LAB-000003` / `cms3g7m300058z4vy5ga76bl1` |
| Invoice | `INV-000003` / `cms3g7mdq005ez4vyyz92366y` (PAID) |
| Receipts | RCP-000004 (956.25) + RCP-000005 (956.25) |
| Reports | RPT-0000008 (Electrolytes), RPT-0000009 (CBC), RPT-0000010 (ESR), RPT-0000011 (RBS) |
| Results | Electrolytes `cms3gym42006fz4vymu3ez3wx`, CBC `cms3h0a0w006pz4vym3b7r74h`, ESR `cms3h0iak006vz4vy8y4vt0xl`, RBS `cms3h0qn8006zz4vykvpqjx0v` |

## Billing reconciliation (verified)

| Field | Value (BDT) |
|-------|-------------|
| Gross | 2250.00 |
| Discount (15%) | −337.50 |
| Net | 1912.50 |
| Paid (RCP-000004 + RCP-000005) | 1912.50 |
| Due | **0.00** |

## Defects

| ID | Status | Summary |
|----|--------|---------|
| — | — | **No blocking defects** for Case 3 |

## Observations (non-blocking)

| ID | Severity | Summary |
|----|----------|---------|
| DPDC-C3-OBS-001 | UX | Billing hold display stale on release detail until Authorize release sync |
| DPDC-C3-OBS-002 | i18n | Missing `screens.reportRelease.*` / `screens.diagnosticInvoice.*` keys |
| DPDC-C3-OBS-003 | UX | Portal session expired on first PDF attempt; succeeded after re-login |
| DPDC-C1-D001 (partial) | Major (known) | Rx v2 draft did not auto-copy follow-up from encounter until **Sync from encounter** |

## Final verdict

**Patient Case 3 — PASS**

Full browser UAT from registration through portal download and prescription versioning completed without a blocking failure.
