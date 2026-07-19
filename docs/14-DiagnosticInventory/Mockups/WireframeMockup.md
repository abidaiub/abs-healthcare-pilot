## Diagnostic Inventory: Wireframe Mockups

### 1. Desktop Layout (Standard)
```
+------------------------------------------------------------------+
| Sidebar (RTL/LTR) | Header: User, Branch, Notification Bell      |
+-------------------|----------------------------------------------+
| [Menu]            | Diagnostic Inventory > GRN Entry             |
| - Dashboard       |----------------------------------------------|
| - Items           | Vendor: [ Select v ]  Date: [ 2026-06-07 ]   |
| - GRN             | Invoice: [ INV-552 ]  Store: [ Main Store v ]|
| - Issue           |----------------------------------------------|
| - Stock Ledger    | Item: [ Glucose Reagent ] [Add]              |
| - Mapping         | | Item | Batch | Lot | Exp | Qty | Price |   |
| - Reports         | |------|-------|-----|-----|-----|-------|   |
|                   | | Glu  | B1    | L1  | ... | 10  | 500   |   |
|                   |----------------------------------------------|
|                   | [ Save GRN ] [ Clear ] [ Print Label ]       |
+------------------------------------------------------------------+
```

### 2. Tablet Layout
*   Sidebar collapses into a "Hamburger" menu.
*   Grids become scrollable horizontally.
*   Buttons are larger for touch targets.

### 3. Mobile Layout
*   Stacked forms (one field per line).
*   "Cards" instead of tables for stock lists.
*   Floating Action Button (FAB) for "New Transaction".

```
Mobile View: Current Stock
+--------------------------+
| [=] Stock Overview   [S] |
+--------------------------+
| Glucose Reagent          |
| Batch: B-9901 | Exp: Jan |
| Qty: 45 Kit   | [Active] |
+--------------------------+
| CBC Diluent              |
| Batch: D-5520 | Exp: Jul |
| Qty: 12 Cont  | [Low]    |
+--------------------------+
| (+) New GRN              |
+--------------------------+
```
