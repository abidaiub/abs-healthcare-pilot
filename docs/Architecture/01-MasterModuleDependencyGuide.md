# ABSHealthcareLite Master Module Dependency Guide

## 1. Executive Summary
The **ABSHealthcareLite Master Module Dependency Guide** serves as the architectural blueprint for the entire healthcare ERP platform. It defines the structural relationships, data flow, and implementation sequence for Modules 01 through 40. 

The platform is designed as a **Multi-tenant SaaS** application. Every business entity is strictly scoped by `CompanyId`. The architecture currently supports **ASP.NET WebForms** and **SQL Server**, with a deliberate, decoupled database design to ensure future portability to **PostgreSQL/Supabase** and application migration to **MVC/Core/Mobile/API** frameworks. The system is inherently multilingual, supporting English, Bangla, Hindi (LTR), and Arabic, Urdu (RTL).

This document ensures that development teams understand which modules must be built first (Foundation), how clinical data flows across departments (Dependencies), and how advanced features (AI, Telemedicine) plug into the core engine.

---

## 2. System Architecture Layers

```text
+-----------------------------------------------------------------------------------+
| LAYER 7: AI & AUTOMATION (Enterprise / AI)                                        |
| [40] AI Prescription Capture & Smart Investigation Billing                        |
+-----------------------------------------------------------------------------------+
| LAYER 6: PATIENT ENGAGEMENT & VIRTUAL CARE (Advanced)                             |
| [30] Patient Portal    [31] Appt & Follow-Up    [32] Telemedicine                 |
+-----------------------------------------------------------------------------------+
| LAYER 5: INPATIENT & NURSING OPERATIONS (Core)                                    |
| [28] Bed/Occupancy     [27] Nursing Station     [26] MAR       [29] Discharge     |
+-----------------------------------------------------------------------------------+
| LAYER 4: CLINICAL & DIAGNOSTICS (Core)                                            |
| [18] Encounter         [19] Prescription        [20] Pharmacy Catalog             |
| [21] Sample Collection [22] Result Entry        [23] Verification  [24] Release   |
| [25] Radiology Workflow                                                           |
+-----------------------------------------------------------------------------------+
| LAYER 3: PATIENT IDENTITY & JOURNEY (Foundation / Core)                           |
| [15] Patient Reg (MPI) [16] Patient Profile     [17] Queue Management             |
+-----------------------------------------------------------------------------------+
| LAYER 2: MASTER DATA & CATALOGS (Foundation)                                      |
| [07] Branch   [08] Dept   [09] Category   [10] Service Catalog   [11] Doctor      |
| [12] Referral [13] Ward/Bed Setup         [14] Diagnostic Inventory               |
+-----------------------------------------------------------------------------------+
| LAYER 1: PLATFORM SECURITY & GOVERNANCE (Foundation)                              |
| [01] Company/Tenant    [02] User Management     [03] Role & Permission            |
| [04] Audit Center      [05] Notification        [06] Localization                 |
+-----------------------------------------------------------------------------------+
```

---

## 3. Module Dependency Matrix

| Mod | Module Name | Category | Depends On | Used By | Type | Criticality |
|:---|:---|:---|:---|:---|:---|:---|
| **01** | Company/Tenant Mgmt | Foundation | None | ALL | Independent | Foundation |
| **02** | User Management | Foundation | 01, 03 | ALL | Dependent | Foundation |
| **03** | Role & Permission | Foundation | 01 | 02 | Dependent | Foundation |
| **04** | Audit Center | Foundation | 01, 02 | ALL | Dependent | Foundation |
| **05** | Notification Center | Foundation | 01 | 17, 23, 27, 30, 31 | Dependent | Foundation |
| **06** | Localization | Foundation | 01 | ALL | Dependent | Foundation |
| **07** | Branch/Location | Master Data | 01 | 08, 13, 15, 28 | Dependent | Foundation |
| **08** | Department Mgmt | Master Data | 01, 07 | 10, 11, 17, 21, 28 | Dependent | Foundation |
| **09** | Category Mgmt | Master Data | 01 | 10, 14, 20 | Dependent | Foundation |
| **10** | Master Service Catalog | Master Data | 01, 08, 09 | 18, 21, 22, 40 | Dependent | Foundation |
| **11** | Doctor Management | Master Data | 01, 02, 08 | 17, 18, 31, 32 | Dependent | Foundation |
| **12** | Referral Doctor | Master Data | 01 | 15, 24 | Dependent | Foundation |
| **13** | Ward/Cabin/Bed Setup | Master Data | 01, 07 | 28 | Dependent | Foundation |
| **14** | Diagnostic Inventory | Master Data | 01, 09 | 21, 22 | Dependent | Foundation |
| **15** | Patient Reg & MPI | Patient Journey| 01, 06, 07 | 16, 17, 28, 30 | Dependent | Core |
| **16** | Patient Profile/Ledger | Patient Journey| 15 | 18, 27, 29, 30 | Dependent | Core |
| **17** | Appt & Queue Mgmt | Patient Journey| 11, 15 | 18, 31 | Dependent | Core |
| **18** | Doctor Worklist | Clinical | 11, 15, 17 | 19, 21, 25, 29 | Dependent | Core |
| **19** | Prescription Mgmt | Clinical | 18, 20 | 26, 30, 32 | Dependent | Core |
| **20** | Pharmacy Catalog | Clinical | 01, 09 | 19, 26, 29 | Dependent | Core |
| **21** | Sample Collection | Laboratory | 10, 15, 18 | 22 | Dependent | Core |
| **22** | Result Entry & Analyzer| Laboratory | 21, 10 | 23 | Dependent | Advanced |
| **23** | Result Verification | Laboratory | 22, 02, 03 | 24, 29 | Dependent | Advanced |
| **24** | Report Release | Laboratory | 23, 15 | 30 | Dependent | Advanced |
| **25** | Radiology Workflow | Radiology | 10, 15, 18 | 24, 30 | Dependent | Advanced |
| **26** | MAR | Nursing & IPD | 19, 20, 27, 28| 29 | Dependent | Enterprise |
| **27** | Nursing Station | Nursing & IPD | 16, 28 | 26, 29 | Dependent | Enterprise |
| **28** | Bed & Occupancy | Nursing & IPD | 13, 15 | 27, 29 | Dependent | Enterprise |
| **29** | Discharge Mgmt | Nursing & IPD | 18, 20, 24, 28| 30, 31 | Dependent | Enterprise |
| **30** | Patient Portal | Engagement | 15, 16, 24, 31| 32 | Dependent | Advanced |
| **31** | Appt & Follow-Up | Engagement | 11, 15, 17, 30| 32 | Dependent | Advanced |
| **32** | Telemedicine | Telemedicine | 18, 19, 30, 31| None | Dependent | Enterprise |
| **40** | AI Prescription Capture| AI | 10, 15, 20 | 21, 25 | Dependent | AI |

---

## 4. Foundation Modules
**Criticality: Foundation**
These modules form the absolute bedrock of the SaaS platform. No other module can function without them.
*   **[01] Company/Tenant Management**: Defines the `CompanyId` boundary.
*   **[02] User Management & [03] Role Permission**: Controls access.
*   **[04] Audit Center & [05] Notification Center**: Global system utilities.
*   **[06] Localization**: Ensures UI and data support EN, BN, AR, UR, HI.
*   **[07-14] Master Data**: Branch, Department, Category, Service Catalog, Doctor, Ward Setup, and Inventory. These must be populated before any patient transactions occur.

## 5. Patient Journey Modules
**Criticality: Core**
These modules handle the entry of the patient into the hospital ecosystem.
*   **[15] Patient Registration (MPI)**: Generates the unique Patient ID.
*   **[16] Patient Profile Ledger**: The 360-degree view of the patient.
*   **[17] Appointment & Queue**: Basic OPD scheduling and token generation.
*   **[31] Appointment & Follow-Up**: Advanced scheduling, waitlists, and post-discharge continuity tracking.

## 6. Clinical Modules
**Criticality: Core**
These modules represent the doctor's interaction with the patient.
*   **[18] Doctor Worklist & Encounter**: The core EMR screen for complaints and diagnoses.
*   **[19] Prescription Management**: Generates the medication plan.
*   **[20] Pharmacy & Medication Catalog**: The master drug database driving the prescription.

## 7. Laboratory Modules
**Criticality: Core to Advanced**
A strict, linear dependency chain governing the LIS (Laboratory Information System).
*   **[21] Sample Collection**: Depends on Investigation Orders. Generates Barcodes.
*   **[22] Result Entry & Analyzer**: Depends on Sample Receiving.
*   **[23] Result Verification & Approval**: Depends on Result Entry. Enforces clinical governance.
*   **[24] Report Release & Delivery**: Depends on Approval. Delivers to Patient Portal.

## 8. Radiology Modules
**Criticality: Advanced**
*   **[25] Radiology Workflow & Imaging**: Parallel to the Lab workflow but specific to imaging modalities (X-Ray, CT, MRI). Depends on Orders and drives Scheduling, Acquisition, Dictation, and Release.

## 9. Nursing & IPD Modules
**Criticality: Enterprise**
Highly interdependent modules managing inpatient care.
*   **[28] Bed, Ward, Room & Occupancy**: The physical location and billing clock of the patient.
*   **[27] Nursing Station & Task Mgmt**: The operational hub. Depends on Bed Occupancy.
*   **[26] Medication Administration Record (MAR)**: The execution of the Prescription [19]. Depends heavily on Nursing Station [27] and Pharmacy [20].
*   **[29] Discharge Management**: The complex exit workflow. Depends on clearances from Nursing [27], Pharmacy [20], Billing, and triggers Bed Release in [28].

## 10. Billing & Financial Modules
*(Note: Dedicated Finance modules are slated for future documentation, but billing touchpoints are heavily integrated into [10] Service Catalog, [28] Occupancy, and [29] Discharge).*

## 11. Patient Engagement Modules
**Criticality: Advanced**
*   **[30] Patient Portal & Self Service**: The digital front door. Depends on almost all core modules to display Reports [24], Prescriptions [19], and Appointments [31].

## 12. Telemedicine Modules
**Criticality: Enterprise**
*   **[32] Telemedicine & Virtual Consultation**: The culmination of the outpatient journey. Depends on Portal [30] for access, Appointments [31] for scheduling, and Encounter [18]/Prescription [19] for clinical execution.

## 13. AI Modules
**Criticality: AI**
*   **[40] AI Prescription Capture**: An intelligent overlay. Depends on the Master Service Catalog [10] and Pharmacy Catalog [20] to map unstructured image data into structured orders.

## 14. Future Modules
To complete the ERP, future modules will include:
*   Finance & Accounts (Vouchers, Ledgers, P&L)
*   HR & Payroll
*   Fixed Asset Management
*   CRM & Marketing
*   Advanced Pharmacy POS & Procurement

---

## 15. Recommended Development Dependency Flow

To prevent development blockers, the engineering team MUST build the modules in the following phased sequence:

```text
PHASE 1: PLATFORM FOUNDATION (The Bedrock)
[01 Company] ---> [02 User] ---> [03 Roles] ---> [04 Audit] ---> [06 Localization]
      |
      v
PHASE 2: MASTER DATA (The Dictionaries)
[07 Branch] ----> [08 Dept] ---> [11 Doctor]
      |               |
      +-> [13 Wards]  +-> [10 Service Catalog]
      |
      +-> [09 Category] -> [20 Pharmacy Catalog] & [14 Diag Inventory]

===================================================================================

PHASE 3: PATIENT IDENTITY & OPD (The Front Desk)
[15 Patient Reg] ---> [16 Patient Profile]
      |
      v
[17/31 Appointments] ---> [18 Doctor Encounter] ---> [19 Prescription]

===================================================================================

PHASE 4: DIAGNOSTICS (The Lab & Rad Engines)
[18 Encounter Orders]
      |
      +---> [21 Sample Collection] -> [22 Result Entry] -> [23 Verification]
      |                                                           |
      +---> [25 Radiology Workflow] ------------------------------+
                                                                  |
                                                                  v
                                                        [24 Report Release]

===================================================================================

PHASE 5: INPATIENT OPERATIONS (The Ward)
[15 Patient Reg] ---> [28 Bed Occupancy]
                           |
                           v
                 [27 Nursing Station] <---> [19 Prescription]
                           |                      |
                           v                      v
                  [26 MAR (Admin Record)] <-------+
                           |
                           v
                 [29 Discharge Management] ---> (Releases Bed in [28])

===================================================================================

PHASE 6: DIGITAL HEALTH & AI (The Edge)
[24 Reports] & [19 Prescriptions] & [31 Appointments]
                           |
                           v
                 [30 Patient Portal] <======> [32 Telemedicine]
                           ^
                           |
                 [40 AI Prescription Capture] (Feeds orders back to Phase 4)
```

### Cross-Module Relationship Rules
1. **No Circular Dependencies**: Data flows downstream. For example, Lab Result Entry [22] depends on Sample Collection [21], never the reverse.
2. **CompanyId Enforcement**: Every module in Phases 2-6 must filter all database queries by the `CompanyId` established in Phase 1.
3. **Soft Delete Only**: Modules in Phase 4 and 5 (Clinical/IPD) rely on historical data. Master data (Phase 2) cannot be physically deleted (`IsActive = 0` only) to prevent breaking clinical audit trails.