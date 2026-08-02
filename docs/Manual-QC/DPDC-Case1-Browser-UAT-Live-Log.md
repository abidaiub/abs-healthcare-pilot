# DPDC Patient Case 1 — Live Browser UAT Log

**Started:** 2026-07-26  
**Patient:** Md. Rahim Uddin · `PT-000005` (UI-registered; not seed `DP-000001`)  
**Appointment:** `AP-000001` · Dr. Farhana Rahman · Queue token `1` · Status after check-in: `Waiting`  
**Encounter:** `cms1d93f2000azovyjc94k0qh` · **Rx:** `RX-000001` · **Lab:** `LAB-000001` · **Invoice:** `INV-000001` · **Receipt:** `RCP-000001`

## Step results

| Step | Result | Evidence |
|------|--------|----------|
| 1 Reception register | **PASS** | `case-1/01-patient-registered.png`; DB active `PT-000005` |
| 2 Appointment + check-in | **PASS** | `case-1/02-appointment-booked.png`, `02-checked-in.png` |
| 3 Doctor consultation + Rx | **PASS after fixes** | `case-1/03-prescription-print.png` |
| 4 Billing | **PASS after fixes** | Financial: Gross 1950 / Disc 195 / Net 1755 / Paid 1000 / Due 755 |
| 5 Sample collection | **PASS after fixes** | Order confirmed; ACC-000001–004; all COLLECTED |
| 6 Laboratory receive | **PASS** | All ACC RECEIVED; BioChem×3 + ClinPath×1; Haem N/A |
| 7 LIS import | **PASS after processing** | FBS/HbA1c/CREAT SUCCESS; HIGH flags; Urine no analyzer (manual) |
| 8 Report entry | **IN PROGRESS** | — |
| 9–12 | **NOT YET** | — |

## Open defects (Case 1 baseline)

| ID | Severity | Step | Summary | Status |
|----|----------|------|---------|--------|
| **DPDC-C1-D001** | **Major** | 19 Follow-up Rx | **Follow-up interval and follow-up instructions did not persist after prescription finalization.** Values entered during consultation/Rx draft were lost or not shown on finalized prescription detail, print view, or prescription history. | **OPEN** — logged 2026-07-26 before Case 2 start; Case 2 baseline assumes this defect remains unfixed. |

### Step 7 note
First LIS attempt quarantined (`LAB_RESULT_SOURCE_NOT_READY`) until samples marked ready on `/lab/processing`. Retry with new message control ids succeeded.

### Step 5 failures fixed during run

1. **Order stuck DRAFT / no accession** — confirm creates samples; DPDC seed lacked `/lab/orders/confirm`; detail page redirected DRAFT → edit (Confirm unreachable).  
   Files: `src/app/(app)/lab/orders/[orderId]/page.tsx`, `LabCollectionPanel.tsx`, seed `DP_COLLECTION` + live grant.
2. **Decimal props to client** — `sampleContainer.volumeMl` broke detail/label pages. Serialized plain props.

### Step 3 failures fixed during run

1. **`APPOINTMENT_INVALID_STATUS`** — `WAITING → IN_CONSULTATION` missing from transitions.  
   Files: `src/lib/appointment/constants.ts`, `src/app/actions/tenant-consultations.ts`
2. **`e.currentTarget.reset()` null** after async diagnosis/investigation submit.  
   File: `src/components/consultations/ConsultationWorkspace.tsx`
3. **`revalidatePath` during RSC render** on `/prescriptions/new`.  
   File: `src/app/actions/tenant-prescriptions.ts`
4. **Prescription detail redirected** — `findPrescriptionLabOrderDraftAction` required `/lab/orders` (doctor lacks it).  
   Files: `src/app/(app)/prescriptions/[prescriptionId]/page.tsx`, consultations detail page

### Step 4 failures fixed during run

1. **No auto-load of doctor investigations** — billing searched lab orders only; no lab order existed; free-text Rx investigations had null `tenantServiceId`.  
   Fix: catalog name resolve + `createInvoiceFromPrescriptionAction` + billing UI “Load doctor's investigations”.  
   Files: `src/app/actions/tenant-lab-orders.ts`, `src/app/actions/tenant-billing.ts`, `src/lib/billing/queries.ts`, `src/components/billing/BillingWorklistPanel.tsx`, seed `DP_BILLING` resources
2. **Payment UI blocked** — `DP_BILLING` lacked `/diagnostic/billing/payment`. Granted in seed + live role.

### Step 4 financial reconciliation (executed)

| Item | Amount (BDT) |
|------|--------------|
| FBS | 250 |
| HbA1c | 900 |
| Serum Creatinine | 500 |
| Urine R/E | 300 |
| **Gross** | **1950** |
| **Discount 10%** | **195** |
| **Net** | **1755** |
| **Paid (cash)** | **1000** |
| **Due** | **755** |

Status: `PARTIALLY_PAID` · Cash memo `RCP-000001`
