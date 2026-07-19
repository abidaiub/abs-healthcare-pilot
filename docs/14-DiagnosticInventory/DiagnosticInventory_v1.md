## MODULE 14: Diagnostic Inventory / Reagent & Consumable Management

### 1. Executive Summary
The Diagnostic Inventory module is a specialized Laboratory Information System (LIS) extension for ABSHealthcareLite. It manages the lifecycle of reagents, consumables, tools, and equipment parts. It features batch/lot tracking, expiry management, and "open bottle" tracking, ensuring lab operational efficiency and cost control.

### 2. Business Purpose
To eliminate reagent wastage, prevent testing delays due to stock-outs, and provide accurate cost-per-test analysis. This module ensures that high-value lab assets are tracked from procurement to consumption, maintaining compliance with laboratory quality standards (ISO 15189).

### 3. Actors
*   **Host Admin**: Global oversight of inventory standards.
*   **Company Admin**: Manages tenant-wide inventory policies.
*   **Inventory Manager**: Oversees stock levels, reorder rules, and vendor relations.
*   **Store Keeper**: Handles physical GRN (Goods Received Note) and issuance.
*   **Lab Manager**: Maps reagents to machines and tests; approves wastage.
*   **Lab Technician**: Records consumption and "open bottle" events.
*   **Purchase Officer**: Generates POs based on reorder alerts.
*   **Auditor**: Reviews stock ledgers and wastage logs.

### 4. Functional Requirements
*   **Item Management**: CRUD for Reagents, Consumables, Tools, etc.
*   **Hierarchy Support**: Company -> Branch -> Store -> Department -> Item.
*   **Procurement Flow**: Purchase Order -> GRN -> Store Entry.
*   **Inventory Issuance**: Transfer from main store to lab departments.
*   **Reagent Specifics**: Tracking Batch, Lot, Expiry, and Storage Temperature.
*   **Open Bottle Tracking**: Monitor the "Open Expiry" of reagents once unsealed.
*   **Wastage/Adjustment**: Record and approve stock losses or corrections.
*   **Reorder Alerts**: Automated notifications for low stock or near-expiry.
*   **Mapping**: Link reagents to specific LIS Services and Lab Machines.

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: Strict `CompanyId` scoping for all transactions.
*   **Auditability**: 100% immutable stock ledger; no physical deletes.
*   **Localization**: Support for EN, BN, AR, UR, HI with RTL layout mirroring.
*   **Portability**: SQL Server today, PostgreSQL/Supabase ready.

### 6. Screen List
1.  **Inventory Dashboard**: Real-time stock, expiry, and reorder alerts.
2.  **Item Master**: Registry of all reagents and consumables.
3.  **GRN Entry**: Recording incoming stock with batch/lot details.
4.  **Issue/Transfer**: Moving stock between stores and departments.
5.  **Reagent Open Log**: Tracking unsealed bottles and their reduced shelf life.
6.  **Machine/Test Mapping**: Configuring consumption rules.
7.  **Stock Ledger**: Chronological history of all stock movements.
8.  **Wastage/Adjustment**: Reporting damaged or expired items.

### 7. Detailed ASCII Mockups

**Stock Overview (Desktop)**
```
--------------------------------------------------------------------------------
Diagnostic Inventory > Current Stock
--------------------------------------------------------------------------------
Store: [ Main Lab Store v ]  Category: [ Reagent v ]  [ Search ]

| Item Name          | Batch/Lot | Expiry     | On Hand | Unit | Status      |
|--------------------|-----------|------------|---------|------|-------------|
| Glucose Reagent    | B-9901/L1 | 2027-01-15 | 45      | Kit  | [Active]    |
| CBC Diluent        | D-5520/L4 | 2026-07-10 | 12      | Cont | [Near Exp]  |
| Nitrile Gloves (M) | N/A       | 2029-12-31 | 500     | Pcs  | [Active]    |

[+ New GRN] [Issue Stock] [Wastage Report]
--------------------------------------------------------------------------------
```

### 8. Workflow Diagrams
`Purchase Order` -> `GRN (Batch/Lot/Exp)` -> `Main Store` -> `Issue to Dept` -> `Lab Consumption (Manual/Auto)` -> `Stock Ledger Update`.

### 9. Business Rules
*   **CompanyId Mandatory**: No transaction exists without a tenant link.
*   **No Physical Delete**: Items and logs are archived via `IsActive` flags.
*   **Expiry Block**: Expired reagents cannot be issued to departments.
*   **Open Bottle Rule**: Opening a reagent triggers a secondary "Open Expiry" timer.
*   **Wastage Approval**: All stock adjustments require Lab Manager approval.

### 10. Database Design (Core Tables)

**Table: InventoryItem**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ItemId | INT (Identity) | Yes | Primary Key |
| CompanyId | INT | Yes | FK to Company |
| CategoryId | INT | Yes | FK to InventoryCategory |
| ItemCode | NVARCHAR(50) | Yes | Unique Code |
| ItemName | NVARCHAR(200) | Yes | Display Name |
| UOM | NVARCHAR(20) | Yes | Unit of Measure |
| MinStockLevel | DECIMAL(18,2) | Yes | Reorder Trigger |

**Table: InventoryBatch**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| BatchId | INT (Identity) | Yes | Primary Key |
| ItemId | INT | Yes | FK to InventoryItem |
| BatchNo | NVARCHAR(50) | Yes | Manufacturer Batch |
| LotNo | NVARCHAR(50) | No | Production Lot |
| ExpiryDate | DATETIME | Yes | Physical Expiry |
| StorageTemp | NVARCHAR(50) | No | e.g. 2-8 C |

### 11. Stock Ledger Design
The `InventoryStockLedger` table records every `In` and `Out` transaction with a running balance per `StoreId`, `ItemId`, and `BatchId`.

### 12. Reagent Management
Includes "Open Bottle" tracking. When a technician unseals a kit, the `ReagentOpenLog` records the `OpenDate`. The system calculates `OpenExpiryDate` based on the item's stability profile.

### 13. Security Design
*   **Row-Level Security**: Enforced by `CompanyId`.
*   **Role-Based Access**: Technicians can consume; only Managers can adjust.

### 14. Audit Design
*   **Stock Audit**: Every change in quantity creates a ledger entry.
*   **Metadata Audit**: Changes to reorder rules or machine mappings are logged.

### 15. Localization Requirements
*   **RTL Support**: Arabic and Urdu layouts flip the navigation and grids.
*   **No Hardcoding**: All labels fetched from Module 06 (Localization).

### 16. Future Expansion Plan
*   **Phase 2**: Automatic consumption triggered by LIS "Result Entry" or "Verification".
*   **IoT Integration**: Real-time temperature monitoring for reagent fridges.

### 17. Acceptance Criteria
*   GRN correctly populates batch-wise stock.
*   Expired items are highlighted in red and blocked from issuance.
*   Stock ledger balance matches physical count after every transaction.
*   Reorder alerts trigger when stock falls below `MinStockLevel`.
