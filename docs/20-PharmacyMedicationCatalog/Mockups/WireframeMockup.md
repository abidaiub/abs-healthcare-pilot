## Pharmacy & Medication Catalog: Wireframe Mockups

### 1. Generic Master
```
--------------------------------------------------------------------------------
Pharmacy > Generic Master
--------------------------------------------------------------------------------
[Search Generic...                ] [Class: All v] [Search]

| Code  | Generic Name       | Therapeutic Class | High Risk | Action |
|-------|--------------------|-------------------|-----------|--------|
| G001  | Paracetamol        | Analgesic         | No        | [Edit] |
| G002  | Amoxicillin        | Antibiotic        | No        | [Edit] |
| G003  | Morphine           | Opioid Analgesic  | Yes (Ctrl)| [Edit] |

[+ Add Generic]
--------------------------------------------------------------------------------
```

### 2. Brand Master
```
--------------------------------------------------------------------------------
Pharmacy > Brand Master
--------------------------------------------------------------------------------
[Search Brand/Barcode...          ] [Generic: All v] [Search]

| Brand Name | Generic     | Strength | Form   | Manufacturer | Action |
|------------|-------------|----------|--------|--------------|--------|
| Napa       | Paracetamol | 500mg    | Tablet | Beximco      | [Edit] |
| Ace        | Paracetamol | 500mg    | Tablet | Square       | [Edit] |
| Moxacil    | Amoxicillin | 250mg    | Capsule| Square       | [Edit] |

[+ Add Brand]
--------------------------------------------------------------------------------
```

### 3. Pharmacy Dashboard
```
--------------------------------------------------------------------------------
Pharmacy Dashboard | Branch: Main
--------------------------------------------------------------------------------
[ Total Brands: 1,250 ]  [ Low Stock: 15 ]  [ Near Expiry: 5 ]  [ Expired: 2 ]

Pending Prescriptions:
| Presc No | Patient Name | Doctor         | Time  | Action     |
|----------|--------------|----------------|-------|------------|
| RX-9901  | John Doe     | Dr. Ahmed Khan | 10:15 | [Dispense] |
| RX-9902  | Jane Smith   | Dr. Sarah Evans| 10:30 | [Dispense] |

[ View All Queue ] [ Inventory Reports ]
--------------------------------------------------------------------------------
```

### 4. Prescription Dispense Screen
```
--------------------------------------------------------------------------------
Dispense: RX-9901 | Patient: John Doe (P-10001)
--------------------------------------------------------------------------------
Prescribed Items:

1. Tab. Napa 500mg | Dose: 1+1+1 | 5 Days | Qty Needed: 15
   [ Select Batch ] -> Selected: B-101 (Exp: 2027-01) | Qty: [ 15 ]

2. Cap. Moxacil 250mg | Dose: 1+0+1 | 7 Days | Qty Needed: 14
   [ Select Batch ] -> Selected: B-205 (Exp: 2026-12) | Qty: [ 14 ]

[ Substitute Item ] [ Mark Partial Dispense ]

Total Amount: $25.00
[ Confirm & Dispense ] [ Cancel ]
--------------------------------------------------------------------------------
```

### 5. Batch Selection Popup
```
--------------------------------------------------------
Select Batch for: Tab. Napa 500mg
--------------------------------------------------------
| Batch No | Expiry Date | Available Qty | Select Qty |
|----------|-------------|---------------|------------|
| B-101    | 2027-01-15  | 500           | [ 15 ]     | <- (FEFO Suggested)
| B-099    | 2028-05-20  | 1000          | [    ]     |

[ Confirm Selection ] [ Cancel ]
--------------------------------------------------------
```

### 6. Mobile Dispensing View
```
+--------------------------+
| [=] Dispense Queue   [S] |
+--------------------------+
| RX-9901                  |
| John Doe                 |
| Items: 2 | [ Dispense ]  |
+--------------------------+
| RX-9902                  |
| Jane Smith               |
| Items: 4 | [ Dispense ]  |
+--------------------------+
| [ Scan Barcode ]         |
+--------------------------+
```
