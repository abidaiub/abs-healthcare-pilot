## MODULE 20: Pharmacy & Medication Catalog

### 1. Executive Summary
The Pharmacy & Medication Catalog module establishes the foundation for all medication-related operations within ABSHealthcareLite. It bridges the gap between clinical prescribing (Module 19) and physical inventory management. Doctors prescribe medicines, and pharmacists dispense them, with every action reducing stock through auditable transactions. This module ensures that every dispense action is traceable, supporting OPD dispensing, IPD medication issues, and discharge medications while maintaining strict batch and expiry controls.

### 2. Business Purpose
To provide a robust, generic-first medication architecture that ensures clinical safety, inventory accuracy, and financial integrity. By centralizing the medication catalog and linking it directly to inventory and dispensing workflows, the system minimizes medication errors, prevents stock-outs, and ensures compliance with international pharmacy standards.

### 3. Actors
*   **Doctor**: Prescribes medications using the catalog.
*   **Pharmacist**: Reviews prescriptions, selects batches, and dispenses medications.
*   **Pharmacy Manager**: Oversees catalog setup, stock levels, and expiry management.
*   **Inventory Officer**: Manages GRN, batch entry, and stock transfers.
*   **Finance Officer**: Reconciles pharmacy billing and revenue.
*   **Host Admin**: Manages the global (CompanyId = NULL) generic and brand master catalogs.
*   **Tenant Admin**: Manages tenant-specific brands, pricing, and stock.

### 4. Generic-First Medication Architecture
The system employs a hierarchical, generic-first design:
`Medication Generic` → `Medication Brand` → `Medication Batch` → `Medication Stock`

**Example:**
*   **Generic**: Paracetamol
*   **Brands**: Napa, Ace, Tylenol, Calpol

**Business Justification**: A generic-first architecture is critical for operations in Bangladesh, the Middle East, and Europe. It supports generic prescribing mandates, facilitates brand substitution during stock-outs, and simplifies drug interaction checking (which is based on generic compounds, not brand names).

### 5. Functional Requirements

#### A. Medication Generic Master
Defines the active pharmaceutical ingredient (API).
*   **Fields**: `GenericId`, `CompanyId`, `GenericName`, `GenericCode`, `TherapeuticClass`, `DrugClass`, `ATCCode` (future), `IsControlledDrug`, `IsAntibiotic`, `IsHighRiskDrug`, `IsLASA` (Look-Alike Sound-Alike), `Remarks`.

#### B. Medication Brand Master
Defines the specific marketable product.
*   **Fields**: `BrandId`, `CompanyId`, `GenericId`, `BrandName`, `Strength`, `DosageFormId`, `RouteId`, `ManufacturerId`, `Barcode`, `IsActive`.

#### C. Dosage Form Master
Standardizes the physical form of the medication.
*   **Examples**: Tablet, Capsule, Syrup, Suspension, Injection, IV Fluid, Ointment, Cream, Drops, Inhaler, Sachet, Suppository.

#### D. Route Master
Standardizes the administration route.
*   **Examples**: Oral, IV, IM, SC, Topical, Inhalation, Rectal, Ophthalmic, Nasal.

#### E. Manufacturer Master
Tracks the origin of the medication.
*   **Fields**: `ManufacturerId`, `ManufacturerName`, `Country`, `LicenseNo`, `Remarks`.

#### F. Medication Catalog Features
*   Search by generic, brand, barcode, manufacturer, or therapeutic class.
*   Multilingual display names (EN, BN, AR, UR, HI).
*   Support for "Favorite" and "Frequently Prescribed" lists per doctor/department.

#### G. Pharmacy Inventory Integration (MOD-35)
*   MOD-20 owns medication identity and pharmacy-domain workflow only.
*   Medication identity links to the generic MOD-35 item identity.
*   MOD-35 owns warehouse/store, batch/expiry, availability, stock movement, item ledger, and valuation.
*   MOD-34 owns supplier procurement; MOD-33 owns accounting posting.
*   MOD-20 must not create an independent stock ledger, batch-balance table, or valuation engine.

#### H. Batch Management
*   Enforce batch-wise inventory tracking.
*   Support for FIFO (First-In-First-Out) and FEFO (First-Expired-First-Out) dispensing logic.
*   Automated near-expiry alerts and isolation of expired stock to prevent dispensing.

#### I. Barcode Foundation
*   Architecture supports Barcode and QR Code scanning for rapid dispensing and GRN entry.
*   GS1 readiness for international supply chain compliance.

#### J. Dispensing Workflow
`Prescription` → `Pharmacy Queue` → `Pharmacist Review` → `Stock Check` → `Batch Selection` → `Dispense` → `Inventory Deduction` → `Billing Integration` → `Patient Receipt`.

#### K. Prescription Fulfillment Tracking
*   Track `Prescribed Qty`, `Dispensed Qty`, and `Remaining Qty`.
*   **Statuses**: `Not Dispensed`, `Partially Dispensed`, `Fully Dispensed`, `Cancelled`.

#### L. Dispense Types
*   Full Dispense, Partial Dispense, Emergency Dispense, Ward Issue (IPD), Discharge Medication.

#### M. Substitution Management
*   Support for Brand or Generic substitution based on stock availability.
*   Requires Pharmacist recommendation and (optional) Doctor approval workflow.
*   Full audit trail of substituted items.

#### N. Controlled Drug Governance
*   Flags for `IsControlledDrug`.
*   Restricted dispensing requiring mandatory justification and dual approval (e.g., Pharmacist + Manager).
*   Dedicated compliance audit log for controlled substances.

#### O. Drug Safety Foundation (Architecture Only)
Future-ready schema to support:
*   Allergy Reference, Drug Interaction Reference, Contraindication Reference, Duplicate Therapy Detection.
*   Risk profiling: Pregnancy, Lactation, Pediatric, Geriatric.

### 6. Pharmacy Billing Integration
*   Dispense actions seamlessly trigger counter billing or post to the patient's unified financial ledger (Module 16).
*   Revenue accounts are updated without redesigning existing finance modules.

### 7. Pharmacy Dashboard
Key metric cards:
*   Total Medicines, Active Medicines
*   Low Stock, Near Expiry, Expired
*   Pending Dispense Queue, Today's Dispense Count

### 8. Reports
*   Generic Catalog Report, Brand Catalog Report
*   Stock Position Report, Batch Report
*   Expiry Report, Near Expiry Report
*   Dispense Report (by Doctor, by Patient)
*   Controlled Drug Report

### 9. Deprecated Historical Concept — Do Not Implement

The tables in this section are retained only to explain the original MOD-20 proposal. `MedicationBatch` and `MedicationStock` are not target-architecture MOD-20 tables. Their intended capabilities map to MOD-35 item, warehouse/store, batch, stock-movement, and item-ledger concepts. The MOD-20 medication catalog links to the MOD-35 item identity; it does not duplicate quantity or valuation state.

#### Historical Database Design

**Table: MedicationGeneric**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| GenericId | INT (PK) | Yes | Identity |
| CompanyId | INT | No | NULL for Host |
| GenericName | NVARCHAR(200) | Yes | Multilingual |
| GenericCode | NVARCHAR(50) | Yes | Unique Code |
| TherapeuticClass | NVARCHAR(100) | No | |
| DrugClass | NVARCHAR(100) | No | |
| ATCCode | NVARCHAR(50) | No | Future GS1/ATC |
| IsControlledDrug | BIT | Yes | |
| IsAntibiotic | BIT | Yes | |
| IsHighRiskDrug | BIT | Yes | |
| IsLASA | BIT | Yes | |
| IsActive | BIT | Yes | |
| CreatedBy | INT | Yes | |
| CreatedDate | DATETIME | Yes | |

**Table: MedicationBrand**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| BrandId | INT (PK) | Yes | Identity |
| CompanyId | INT | No | NULL for Host |
| GenericId | INT (FK) | Yes | |
| BrandName | NVARCHAR(200) | Yes | Multilingual |
| Strength | NVARCHAR(50) | Yes | e.g. 500mg |
| DosageFormId | INT (FK) | Yes | |
| RouteId | INT (FK) | Yes | |
| ManufacturerId | INT (FK) | Yes | |
| Barcode | NVARCHAR(100) | No | |
| IsActive | BIT | Yes | |

**Table: MedicationBatch**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| BatchId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| BrandId | INT (FK) | Yes | |
| BatchNo | NVARCHAR(50) | Yes | |
| ManufactureDate | DATE | No | |
| ExpiryDate | DATE | Yes | |
| PurchasePrice | DECIMAL(18,2)| Yes | |
| SalePrice | DECIMAL(18,2)| Yes | |
| QtyReceived | DECIMAL(18,2)| Yes | |
| QtyAvailable | DECIMAL(18,2)| Yes | |

**Table: MedicationStock**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| StockId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| BranchId | INT | Yes | |
| BatchId | BIGINT (FK)| Yes | |
| CurrentQty | DECIMAL(18,2)| Yes | |
| ReorderLevel | DECIMAL(18,2)| Yes | |

**Table: MedicationDispense**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| DispenseId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| BranchId | INT | Yes | |
| PrescriptionId | BIGINT (FK)| Yes | Link to Mod 19 |
| PatientId | BIGINT (FK)| Yes | Link to Mod 15 |
| DispenseDate | DATETIME | Yes | |
| DispenseType | NVARCHAR(20) | Yes | Full, Partial, Ward |
| Status | NVARCHAR(20) | Yes | Completed, Cancelled |
| DispensedBy | INT | Yes | Pharmacist UserId |

**Table: MedicationDispenseItem**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| DispenseItemId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| DispenseId | BIGINT (FK)| Yes | |
| PrescriptionItemId| BIGINT (FK)| Yes | Link to Mod 19 Item |
| BatchId | BIGINT (FK)| Yes | Source of stock |
| DispensedQty | DECIMAL(18,2)| Yes | |
| SubstitutedBrandId| INT (FK) | No | If brand changed |
| Remarks | NVARCHAR(200) | No | Justification |

*Note: All tables include `CreatedBy`, `CreatedDate`, `UpdatedBy`, `UpdatedDate`.*
*Index Recommendations: Non-clustered indexes on `CompanyId`, `GenericId`, `BrandId`, `BatchNo`, and `ExpiryDate`.*

### 10. Acceptance Criteria
*   **Catalog Management**: Host Admin can create global generics; Company Admin can create tenant-specific brands.
*   **Inventory Integrity**: Dispensing creates an idempotent MOD-35 stock-movement request; only MOD-35 changes stock availability and batch quantities.
*   **Batch Traceability**: Every dispensed item can be traced back to a specific `BatchNo` and `ExpiryDate`.
*   **Dispensing Workflow**: Pharmacist can pull a finalized prescription, select batches (FEFO suggested), and dispense partially or fully.
*   **Auditability**: Substitutions and controlled drug dispensing require justification and are fully logged.
*   **Multilingual Readiness**: Generic and Brand names support EN, BN, AR, UR, HI, with RTL rendering for Arabic/Urdu.
*   **SaaS Tenant Isolation**: All queries and transactions are strictly scoped by `CompanyId`.
*   **Future Scalability**: Schema supports future integration with FHIR, e-prescriptions, and advanced clinical decision support engines.

---

## Appendix A – Enterprise Pharmacy Enhancements

### 1. Functional Requirements

#### 1.1 MedicationUom Master
*   **Purpose**: Define the Unit of Measure (UoM) for prescribing versus dispensing (e.g., Box, Strip, Tablet, Ampoule).
*   **Conversion**: Support conversion factors (e.g., 1 Box = 10 Strips = 100 Tablets) to ensure inventory is deducted accurately even if prescribed in a different unit.

#### 1.2 Multi Warehouse / Store Architecture
*   **Store Hierarchy**: Define multiple physical or logical stores within a branch (e.g., Main Pharmacy, IPD Sub-store, OT Pharmacy, Cold Storage).
*   **Inter-Store Transfers**: Workflow for requesting and transferring stock between stores, ensuring full traceability of internal movements.

#### 1.3 Dispense Return Workflow
*   **Return Process**: Workflow for patients returning unused/unopened medications (Full or Partial return).
*   **Quality Check**: Pharmacist must verify the physical condition, Batch No, and Expiry before accepting the return.
*   **Return integration**: An approved return requests a MOD-35 reversing stock movement and, where money changes, the MOD-10 operational billing reversal/refund workflow. Any accounting effect posts through MOD-33; MOD-16 only displays the patient-centric ledger view.

#### 1.4 Purchase / GRN Integration Roadmap *(revised — Architecture Approved 2026-07-26)*
*   **MOD-20 remains** the medication catalog and pharmacy-domain workflow module.
*   **Single stock engine:** Future pharmacy stock, GRN, stock ledger, valuation, transfer, and adjustments **must use MOD-35** via a pharmacy stock adapter. Do **not** design a second pharmacy-native stock engine.
*   **Procurement:** Purchase Order / GRN orchestration uses **MOD-34** (with MOD-35 stock updates).
*   **Finance posting:** GRN and AP effects post through the **MOD-33** posting engine (GRNI clearing baseline — ADR-006), not by writing arbitrary GL rows.
*   Legacy table names below (`MedicationStock`, `MedicationStockLedger`) are deprecated historical concepts and must not be implemented.
*   See ADR-004 and `docs/modules/MOD-20-Pharmacy-Medication-Catalog.md`.

### 2. Deprecated Historical Concept — Do Not Implement

The following additional-table proposal is preserved for traceability only. `MedicationStore` maps to a MOD-35 warehouse/store, and `MedicationStockLedger` maps to the MOD-35 item ledger. MOD-20 may retain medication-specific dispense/return workflow records, but it must not own stock balances or valuation.

#### Historical Additional Table Proposal

**Table: MedicationUom**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| UomId | INT (PK) | Yes | Identity |
| CompanyId | INT | No | NULL for Host |
| UomName | NVARCHAR(50) | Yes | e.g., Tablet, Strip, Box |
| ConversionFactor| DECIMAL(18,4)| Yes | Multiplier to base unit |

**Table: MedicationStore**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| StoreId | INT (PK) | Yes | Identity |
| CompanyId | INT | Yes | Tenant Context |
| BranchId | INT (FK) | Yes | Link to Branch |
| StoreName | NVARCHAR(100) | Yes | e.g., Main OPD Pharmacy |
| StoreType | NVARCHAR(50) | Yes | MAIN, SUB, WARD |

**Table: MedicationStockLedger**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| LedgerId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | Tenant Context |
| StoreId | INT (FK) | Yes | Link to MedicationStore |
| BatchId | BIGINT (FK)| Yes | Link to MedicationBatch |
| TransType | NVARCHAR(20) | Yes | GRN, DISPENSE, RETURN, TRANSFER |
| Qty | DECIMAL(18,2)| Yes | Positive (In) or Negative (Out) |
| RunningBalance | DECIMAL(18,2)| Yes | Balance after transaction |
| RefId | BIGINT | Yes | FK to DispenseId, GRNId, etc. |
| TransDate | DATETIME | Yes | Timestamp |

**Table: MedicationReturn** & **MedicationReturnItem**
*   **MedicationReturn**: `ReturnId`, `CompanyId`, `DispenseId`, `PatientId`, `ReturnDate`, `Status`, `ReturnedBy`.
*   **MedicationReturnItem**: `ReturnItemId`, `ReturnId`, `DispenseItemId`, `BatchId`, `ReturnQty`, `RefundAmount`, `ConditionStatus`, `Reason`.

### 3. Updated Business Rules
*   **Ledger Immutability**: MOD-35's item ledger is append-only; corrections use an authorized MOD-35 reversing adjustment.
*   **Return Constraints**: Medications cannot be returned if they are marked as "Temperature Sensitive" or if the batch has expired.
*   **Store Scoping**: A pharmacist is assigned to a specific `StoreId` and can only dispense stock available in that store.

### 4. Approved Integration Mapping

| Pharmacy concept | Approved owner / mapping |
| :--- | :--- |
| Pharmacy medication identity | MOD-20 catalog linked to MOD-35 item identity |
| Pharmacy store | MOD-35 warehouse/store |
| Pharmacy batch and expiry | MOD-35 batch |
| Pharmacy procurement | MOD-34 |
| Pharmacy GRN stock movement | MOD-35 |
| Pharmacy stock ledger | MOD-35 item ledger |
| Pharmacy valuation | MOD-35 valuation engine |
| Pharmacy dispense or sale | MOD-20 workflow producing MOD-35 stock movement |
| Accounting posting | MOD-33 adapter |
