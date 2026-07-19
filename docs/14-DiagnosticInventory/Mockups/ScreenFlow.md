## Diagnostic Inventory: Screen Flow

### 1. Overview
The screen flow follows the physical movement of items from the loading dock to the laboratory workbench.

### 2. Flow Diagram
```
[ Dashboard ] 
      |
      +--> [ Item Master ] --> [ Machine/Test Mapping ]
      |
      +--> [ GRN Entry ] (Stock In)
      |         |
      |         v
      +--> [ Stock Ledger ] <--- [ Issue / Transfer ] (Internal movement)
      |         |
      |         v
      +--> [ Reagent Open Log ] (Unsealing)
      |         |
      |         v
      +--> [ Wastage / Adjustment ] (Losses)
```

### 3. Navigation Logic
*   **Procurement**: Focused on `GRN Entry` and `Vendor` management.
*   **Operations**: Focused on `Issue`, `Open Log`, and `Current Stock`.
*   **Management**: Focused on `Dashboard`, `Mapping`, and `Reports`.
