## Pharmacy & Medication Catalog: Screen Flow

### 1. Overview
This flow covers the lifecycle from catalog setup through inventory management to the final dispensing of a prescription.

### 2. Flow Diagram
```
[ Pharmacy Dashboard ]
      |
      +--> [ Catalog Setup ]
      |         |
      |         +--> [ Generic Master ]
      |         +--> [ Brand Master ]
      |
      +--> [ Inventory Setup ]
      |         |
      |         +--> [ GRN / Batch Entry ]
      |         +--> [ Stock Position ]
      |
      +--> [ Prescription Queue ] (From Module 19)
                |
                v
           [ Dispense Screen ]
                |
                +--> [ Pharmacist Review ]
                |
                +--> [ Batch Selection Popup ] (FEFO Suggested)
                |
                +--> [ Substitution ] (If required)
                |
                v
           [ Confirm Dispense ]
                |
                +--> [ Inventory Deduction ]
                |
                +--> [ Billing Integration ] (Module 16)
                |
                v
           [ Patient Receipt / Label Print ]
```
