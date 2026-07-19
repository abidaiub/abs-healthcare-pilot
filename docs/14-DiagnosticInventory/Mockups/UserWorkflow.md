## Diagnostic Inventory: User Workflow

### 1. Receiving Reagents (Store Keeper)
1.  Navigate to `GRN Entry`.
2.  Select `Vendor` and enter `Invoice Number`.
3.  Scan or select `Item`.
4.  Enter `Batch No`, `Lot No`, and `Expiry Date`.
5.  Enter `Quantity` and `Unit Price`.
6.  Click `Save`.
7.  System updates `InventoryBatch` and `InventoryStockLedger`.

### 2. Issuing to Lab (Inventory Manager)
1.  Navigate to `Issue / Transfer`.
2.  Select `Source Store` (Main) and `Destination Dept` (Pathology).
3.  Select `Item` and `Batch`.
4.  Enter `Quantity`.
5.  Click `Save`.
6.  System reduces Main Store stock and increases Dept stock.

### 3. Opening a Bottle (Lab Technician)
1.  Navigate to `Reagent Open Log`.
2.  Scan the reagent barcode.
3.  System records `OpenDate`.
4.  System calculates `OpenExpiryDate` (e.g., 30 days from today).
5.  Technician applies a physical "Opened" sticker.

### 4. Automatic Consumption (Phase 2)
1.  Technician completes a "CBC" test in LIS.
2.  System checks `ReagentMachineMapping`.
3.  System auto-deducts 1 unit of "CBC Reagent" from the department's stock.
4.  If stock < `MinStockLevel`, an alert is sent to the `Inventory Manager`.
