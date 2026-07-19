## Patient Profile & Ledger: User Workflow

### 1. Viewing a Clinical History (Doctor)
1.  Search for patient by MRN.
2.  Open `Patient 360`.
3.  Check `Alerts` section immediately (highlighted in red).
4.  Navigate to `Clinical Ledger` tab.
5.  Filter by `Category: Prescription` to see past medications.
6.  Click `View Report` on a recent `Investigation` entry.

### 2. Settling a Due (Cashier)
1.  Open `Patient 360`.
2.  Observe `Current Due` in the summary header.
3.  Navigate to `Financial Ledger` tab.
4.  Review the `DEBIT` entries causing the due.
5.  Click `Pay Now` or `Collect Payment`.
6.  Enter amount and payment mode.
7.  System creates a `CREDIT` entry in `PatientLedgerItem`.
8.  System updates `TotalCredit` and `CurrentDue` in `PatientLedger`.
9.  Print the updated `Patient Statement`.

### 3. Tracking the Patient Journey (Receptionist)
1.  Open `Patient 360`.
2.  Navigate to `Timeline` tab.
3.  Verify if the patient has completed their `Consultation` before directing them to the `Lab`.
4.  Observe the time elapsed between each stage to monitor service quality.

### 4. Linking Family Members (Admin)
1.  Open `Patient 360` for the primary patient (e.g., Father).
2.  Navigate to `Family` tab.
3.  Search for the secondary patient (e.g., Child) by MRN.
4.  Select `Relationship: Child`.
5.  Click `Link`.
6.  System creates a record in `PatientRelationship`.
7.  Both profiles now show a "Family" shortcut to each other.
