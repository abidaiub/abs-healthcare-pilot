<div style="text-align: center; padding-top: 30%; page-break-after: always;">
  <h1 style="font-size: 4em; margin-bottom: 0;">ABSHealthcareLite</h1>
  <h2 style="font-size: 2.5em; color: #555; margin-top: 10px;">Architecture Book</h2>
  <div style="margin-top: 100px; font-size: 1.5em; color: #777;">
    <p>Prepared by:</p>
    <p><strong>Al Baraka Soft</strong></p>
  </div>
</div>

## Table of Contents

- [ABSHealthcareLite Master Module Dependency Guide](#abshealthcarelite-master-module-dependency-guide)
  - [1. Executive Summary](#1-executive-summary)
  - [2. System Architecture Layers](#2-system-architecture-layers)
  - [3. Module Dependency Matrix](#3-module-dependency-matrix)
  - [4. Foundation Modules](#4-foundation-modules)
  - [5. Patient Journey Modules](#5-patient-journey-modules)
  - [6. Clinical Modules](#6-clinical-modules)
  - [7. Laboratory Modules](#7-laboratory-modules)
  - [8. Radiology Modules](#8-radiology-modules)
  - [9. Nursing & IPD Modules](#9-nursing-ipd-modules)
  - [10. Billing & Financial Modules](#10-billing-financial-modules)
  - [11. Patient Engagement Modules](#11-patient-engagement-modules)
  - [12. Telemedicine Modules](#12-telemedicine-modules)
  - [13. AI Modules](#13-ai-modules)
  - [14. Future Modules](#14-future-modules)
  - [15. Recommended Development Dependency Flow](#15-recommended-development-dependency-flow)
    - [Cross-Module Relationship Rules](#cross-module-relationship-rules)
- [ABSHealthcareLite Development Sequence Guide](#abshealthcarelite-development-sequence-guide)
  - [1. Executive Summary](#1-executive-summary)
  - [2. Development Principles](#2-development-principles)
  - [3. MVP Development Path (Minimum Viable Hospital)](#3-mvp-development-path-minimum-viable-hospital)
  - [4. Standard Hospital Development Path](#4-standard-hospital-development-path)
  - [5. Enterprise Hospital Development Path](#5-enterprise-hospital-development-path)
  - [6. Diagnostic Center Only Path](#6-diagnostic-center-only-path)
  - [7. Development Dependency Table](#7-development-dependency-table)
  - [8. Suggested Sprint Planning](#8-suggested-sprint-planning)
  - [9. Database Build Sequence](#9-database-build-sequence)
  - [10. UI Development Sequence](#10-ui-development-sequence)
  - [11. Reporting Development Sequence](#11-reporting-development-sequence)
  - [12. Mobile App Readiness Sequence](#12-mobile-app-readiness-sequence)
  - [13. AI Development Sequence](#13-ai-development-sequence)
  - [14. Recommended Team Structure](#14-recommended-team-structure)
  - [15. Final Recommended Roadmap](#15-final-recommended-roadmap)
- [ABSHealthcareLite System Layer Architecture](#abshealthcarelite-system-layer-architecture)
  - [1. Executive Summary](#1-executive-summary)
  - [2. Architectural Principles](#2-architectural-principles)
  - [3. Platform Foundation Layer](#3-platform-foundation-layer)
  - [4. Security Layer](#4-security-layer)
  - [5. Master Data Layer](#5-master-data-layer)
  - [6. Patient Management Layer](#6-patient-management-layer)
  - [7. Appointment Layer](#7-appointment-layer)
  - [8. Clinical Layer](#8-clinical-layer)
  - [9. Diagnostic Layer](#9-diagnostic-layer)
  - [10. Pharmacy Layer](#10-pharmacy-layer)
  - [11. IPD Layer](#11-ipd-layer)
  - [12. Finance Layer](#12-finance-layer)
  - [13. Patient Engagement Layer](#13-patient-engagement-layer)
  - [14. Telemedicine Layer](#14-telemedicine-layer)
  - [15. AI Layer](#15-ai-layer)
  - [16. Analytics Layer](#16-analytics-layer)
  - [17. Integration Layer](#17-integration-layer)
  - [18. Mobile Layer](#18-mobile-layer)
  - [19. Future Expansion Layer](#19-future-expansion-layer)
  - [20. Layer Dependency Diagram](#20-layer-dependency-diagram)
  - [21. Cross Layer Data Flow](#21-cross-layer-data-flow)
  - [22. Database Architecture Mapping](#22-database-architecture-mapping)
  - [23. API Architecture Mapping](#23-api-architecture-mapping)
  - [24. Final Architecture Roadmap](#24-final-architecture-roadmap)

<div style="page-break-after: always;"></div>

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

<div style="page-break-after: always;"></div>

# ABSHealthcareLite Development Sequence Guide

## 1. Executive Summary
The **ABSHealthcareLite Development Sequence Guide** is the official implementation roadmap for engineering teams, architects, project managers, and AI coding agents. 

While the system modules are numbered logically by business domain (e.g., 01 to 40), **development order differs significantly from module numbering**. A hospital ERP is a highly relational system. For example, you cannot build Patient Registration (Module 15) without first building Branch/Location (Module 07), and you cannot build the Medication Administration Record (Module 26) without first building the Pharmacy Catalog (Module 20) and Bed Occupancy (Module 28). 

This document defines the critical path to ensure development is never blocked by missing dependencies.

## 2. Development Principles
All development must adhere to the following core principles:
*   **Database First**: Schema design, indexing, and relationships must be finalized before UI development.
*   **Stored Procedure First**: Business logic should be encapsulated in SQL Server Stored Procedures (for current ASP.NET WebForms compatibility) while keeping logic modular for future ORM/API migration.
*   **Multi-Tenant First**: Every single business table MUST include `CompanyId`. Queries must always filter by `CompanyId`.
*   **Security First**: RBAC (Role-Based Access Control) must be enforced at the API/Code-behind level, not just UI hiding.
*   **Audit First**: `CreatedBy`, `CreatedOn`, `ModifiedBy`, `ModifiedOn`, and `IsActive` are mandatory. Historical data is never physically deleted.
*   **Localization First**: No hardcoded UI text. All labels, alerts, and dropdowns must map to resource files supporting English, Bangla, Hindi (LTR) and Arabic, Urdu (RTL).
*   **API Ready Design**: Backend logic must be decoupled from WebForms UI events to allow seamless transition to MVC/Core and Mobile APIs.
*   **AI Ready Design**: Data must be structured, normalized, and cleanly typed to support future machine learning and LLM integrations.

## 3. MVP Development Path (Minimum Viable Hospital)
This path delivers a functional OPD and basic Laboratory system.
*   **Phase 1 (Foundation)**: Company (01), Users (02), Roles (03), Audit (04), Localization (06).
*   **Phase 2 (Master Data)**: Branch (07), Dept (08), Category (09), Service Catalog (10), Doctor (11).
*   **Phase 3 (Patient & OPD)**: Patient Reg (15), Appointment (17).
*   **Phase 4 (Clinical)**: Doctor Worklist (18), Pharmacy Catalog (20), Prescription (19).
*   **Phase 5 (Billing)**: *Core Billing (Future Module)*.
*   **Phase 6 (Lab Core)**: Sample Collection (21), Result Entry (22), Report Release (24).

## 4. Standard Hospital Development Path
This path adds Inpatient Department (IPD) capabilities to the MVP.
*   **Phase 1-6**: Same as MVP.
*   **Phase 7 (IPD Setup)**: Ward/Bed Setup (13), Bed Occupancy (28).
*   **Phase 8 (Nursing)**: Patient Profile (16), Nursing Station (27).
*   **Phase 9 (IPD Clinical)**: MAR (26), Discharge Management (29).

## 5. Enterprise Hospital Development Path
This path adds advanced clinical governance, patient engagement, and AI.
*   **Phase 1-9**: Same as Standard Hospital.
*   **Phase 10 (Advanced Diagnostics)**: Result Verification (23), Radiology Workflow (25).
*   **Phase 11 (Patient Engagement)**: Patient Portal (30), Appt & Follow-Up (31).
*   **Phase 12 (Virtual Care & AI)**: Telemedicine (32), AI Prescription Capture (40).

## 6. Diagnostic Center Only Path
Optimized for standalone pathology labs and imaging centers (skips IPD/Nursing).
*   **Phase 1 (Foundation)**: 01, 02, 03, 04, 06.
*   **Phase 2 (Master Data)**: 07, 08, 09, 10, 11, 12 (Referral Doctor), 14 (Diag Inventory).
*   **Phase 3 (Patient)**: 15, 17.
*   **Phase 4 (Billing)**: *Core Billing*.
*   **Phase 5 (Laboratory)**: 21, 22, 23, 24.
*   **Phase 6 (Radiology)**: 25.
*   **Phase 7 (Portal)**: 30.

## 7. Development Dependency Table

| Module | Name | Build Priority | Depends On | Recommended Sprint |
|:---|:---|:---|:---|:---|
| 01 | Company/Tenant Mgmt | 1 - Highest | None | Sprint 1 |
| 02 | User Management | 1 - Highest | 01, 03 | Sprint 1 |
| 03 | Role & Permission | 1 - Highest | 01 | Sprint 1 |
| 04 | Audit Center | 1 - Highest | 01, 02 | Sprint 1 |
| 06 | Localization | 1 - Highest | 01 | Sprint 1 |
| 07 | Branch/Location | 2 - High | 01 | Sprint 2 |
| 08 | Department Mgmt | 2 - High | 01, 07 | Sprint 2 |
| 09 | Category Mgmt | 2 - High | 01 | Sprint 2 |
| 10 | Master Service Catalog| 2 - High | 01, 08, 09 | Sprint 2 |
| 11 | Doctor Management | 2 - High | 01, 02, 08 | Sprint 2 |
| 12 | Referral Doctor | 2 - High | 01 | Sprint 2 |
| 13 | Ward/Cabin/Bed Setup | 2 - High | 01, 07 | Sprint 2 |
| 14 | Diagnostic Inventory | 2 - High | 01, 09 | Sprint 2 |
| 20 | Pharmacy Catalog | 2 - High | 01, 09 | Sprint 2 |
| 05 | Notification Center | 3 - Medium | 01 | Sprint 3 |
| 15 | Patient Reg & MPI | 3 - Medium | 01, 06, 07 | Sprint 3 |
| 16 | Patient Profile | 3 - Medium | 15 | Sprint 3 |
| 17 | Appt & Queue Mgmt | 3 - Medium | 11, 15 | Sprint 3 |
| 18 | Doctor Worklist | 4 - Medium | 11, 15, 17 | Sprint 4 |
| 19 | Prescription Mgmt | 4 - Medium | 18, 20 | Sprint 4 |
| 21 | Sample Collection | 5 - Medium | 10, 15, 18 | Sprint 5 |
| 22 | Result Entry | 5 - Medium | 21, 10 | Sprint 5 |
| 23 | Result Verification | 5 - Medium | 22, 02, 03 | Sprint 5 |
| 24 | Report Release | 5 - Medium | 23, 15 | Sprint 5 |
| 25 | Radiology Workflow | 6 - Low | 10, 15, 18 | Sprint 6 |
| 28 | Bed & Occupancy | 7 - Low | 13, 15 | Sprint 7 |
| 27 | Nursing Station | 7 - Low | 16, 28 | Sprint 7 |
| 26 | MAR | 8 - Low | 19, 20, 27, 28 | Sprint 8 |
| 29 | Discharge Mgmt | 8 - Low | 18, 20, 24, 28 | Sprint 8 |
| 30 | Patient Portal | 9 - Lowest | 15, 16, 24, 31 | Sprint 9 |
| 31 | Appt & Follow-Up | 9 - Lowest | 11, 15, 17, 30 | Sprint 9 |
| 32 | Telemedicine | 10 - Lowest | 18, 19, 30, 31 | Sprint 10 |
| 40 | AI Prescription | 11 - AI | 10, 15, 20 | Sprint 11 |

## 8. Suggested Sprint Planning
*Assumes 2-week sprints with a standard full-stack team.*

*   **Sprint 1**: Foundation & Security (01, 02, 03, 04, 06)
*   **Sprint 2**: Master Data Catalogs (07, 08, 09, 10, 11, 12, 13, 14, 20)
*   **Sprint 3**: Patient Identity & Basic Scheduling (15, 16, 17, 05)
*   **Sprint 4**: Clinical OPD (18, 19)
*   **Sprint 5**: Laboratory LIS (21, 22, 23, 24)
*   **Sprint 6**: Radiology RIS (25)
*   **Sprint 7**: IPD Core (28, 27)
*   **Sprint 8**: IPD Clinical & Discharge (26, 29)
*   **Sprint 9**: Patient Engagement (30, 31)
*   **Sprint 10**: Virtual Care (32)
*   **Sprint 11**: AI Integrations (40)
*   **Sprint 12**: End-to-End UAT, Load Testing, and Localization Verification.

## 9. Database Build Sequence
Database schemas must be created in the following strict order to satisfy Foreign Key constraints:
1.  **Security & Tenant Tables**: `Company`, `Role`, `User`, `UserRole`.
2.  **Location Tables**: `Branch`, `Building`, `Floor`, `Ward`, `Room`, `Bed`.
3.  **Master Catalogs**: `Department`, `Category`, `ServiceMaster`, `PharmacyItem`, `Doctor`.
4.  **Patient Tables**: `Patient`, `PatientProfile`, `PatientAllergy`.
5.  **Encounter Tables**: `Appointment`, `Encounter`, `Prescription`, `PrescriptionItem`.
6.  **Lab/Rad Tables**: `SampleCollection`, `LabResult`, `RadiologyStudy`.
7.  **IPD Tables**: `BedOccupancy`, `NursingTask`, `MAR`, `DischargeRequest`.
8.  **Portal & Telemed Tables**: `PortalAccount`, `TelemedicineSession`.
9.  **AI Tables**: `AIPrescriptionCapture`, `AIMapping`.

## 10. UI Development Sequence
UI development should follow the user's operational flow:
1.  **Host Admin Screens**: Tenant creation, global settings.
2.  **Tenant Admin Screens**: Masters, users, catalogs.
3.  **Front Desk Screens**: Registration, Appointments, Billing.
4.  **Doctor Screens**: Worklist, Encounter, Prescription.
5.  **Lab Tech Screens**: Sample Collection, Result Entry.
6.  **Nursing Screens**: Ward Dashboard, Vitals, MAR.
7.  **Patient Screens**: Portal, Telemedicine waiting room.

## 11. Reporting Development Sequence
Reports should be developed in phases:
1.  **Operational Reports**: Daily Registers, Appointment Lists, Pending Lab Queues.
2.  **Financial Reports**: Revenue summaries, Collection reports (tied to future billing modules).
3.  **Clinical Reports**: Discharge Summaries, Prescriptions, Lab Results.
4.  **Analytical/KPI Reports**: Turnaround Times (TAT), Occupancy Rates, AI Accuracy.

## 12. Mobile App Readiness Sequence
APIs should be developed and exposed in this order:
1.  **Patient APIs**: Registration, Login, Book Appointment, View Reports (Supports Module 30).
2.  **Doctor APIs**: View Schedule, View Patient Profile, Telemedicine Join (Supports Module 32).
3.  **Nursing APIs**: Bedside Vitals Entry, BCMA (Barcode Admin), Task Completion (Supports Modules 26, 27).

## 13. AI Development Sequence
**Module 40 (AI Prescription Capture)** should NOT be developed until Sprint 11. 
*Why?* The AI requires a robust, fully populated `MasterServiceCatalog` (Module 10) and `PharmacyCatalog` (Module 20) to map extracted text against. Furthermore, the downstream billing and lab order generation relies on Modules 21-24 being stable.

## 14. Recommended Team Structure
For optimal velocity, the engineering team should be structured as follows:
*   **1x Solutions Architect**: Database schema design, API contracts, multi-tenant enforcement.
*   **2x Backend Developers (C# / SQL)**: Stored procedures, business logic, API endpoints.
*   **2x Frontend Developers (ASP.NET / JS / CSS)**: UI/UX, localization implementation, responsive design.
*   **1x QA Engineer**: End-to-end testing, RTL layout verification, role-based access testing.
*   **1x AI/Integration Engineer (Phase 2)**: OCR models, WebRTC, PACS/DICOM architecture.

## 15. Final Recommended Roadmap

```text
===================================================================================
                       ABSHealthcareLite Implementation Roadmap
===================================================================================

[ SPRINT 1-2: PLATFORM & MASTERS ]
  +-------------+    +-------------+    +-------------+
  | 01 Company  |--->| 02 Users    |--->| 07 Branches |
  +-------------+    +-------------+    +-------------+
                            |                  |
                            v                  v
                     +-------------+    +-------------+
                     | 03 Roles    |    | 08 Depts    |
                     +-------------+    +-------------+
                                               |
                                               v
                                        +-------------+
                                        | 10 Services |
                                        | 20 Pharmacy |
                                        +-------------+

[ SPRINT 3-4: OPD & CLINICAL ]
  +-------------+    +-------------+    +-------------+
  | 15 Patient  |--->| 17 Appt     |--->| 18 Encounter|
  +-------------+    +-------------+    +-------------+
                                               |
                                               v
                                        +-------------+
                                        | 19 Prescript|
                                        +-------------+

[ SPRINT 5-6: DIAGNOSTICS ]
  +-------------+    +-------------+    +-------------+    +-------------+
  | 21 Sample   |--->| 22 Results  |--->| 23 Verify   |--->| 24 Release  |
  +-------------+    +-------------+    +-------------+    +-------------+
  | 25 Radiology|----------------------------------------->| (To Portal) |
  +-------------+                                          +-------------+

[ SPRINT 7-8: IPD & NURSING ]
  +-------------+    +-------------+    +-------------+    +-------------+
  | 28 Bed Occ. |--->| 27 Nursing  |--->| 26 MAR      |--->| 29 Discharge|
  +-------------+    +-------------+    +-------------+    +-------------+

[ SPRINT 9-11: ENGAGEMENT, VIRTUAL CARE & AI ]
  +-------------+    +-------------+    +-------------+
  | 30 Portal   |<-->| 31 Follow-Up|<-->| 32 Telemed  |
  +-------------+    +-------------+    +-------------+
         ^
         |
  +-------------+
  | 40 AI Presc | (Feeds structured data into Billing & Diagnostics)
  +-------------+

===================================================================================
```

<div style="page-break-after: always;"></div>

# ABSHealthcareLite System Layer Architecture

## 1. Executive Summary
The **ABSHealthcareLite System Layer Architecture** defines the complete structural blueprint of the platform. By adopting a strict layered architecture philosophy, the system decouples presentation, business logic, and data access. This ensures that the current ASP.NET WebForms implementation can seamlessly transition to future MVC/Core/API frameworks without rewriting the underlying business rules or database schemas. 

This document serves as the master technical blueprint, ensuring that all modules (01-32, 40) adhere to the multi-tenant SaaS model, maintain rigorous data isolation, and provide a scalable foundation for a modern, AI-driven healthcare enterprise.

## 2. Architectural Principles
*   **Multi-Tenant First**: Every architectural layer must respect the `CompanyId` boundary. Data bleeding between tenants is structurally impossible.
*   **Security First**: Role-Based Access Control (RBAC) is enforced at the business logic layer, not just the UI. 
*   **Audit First**: The architecture mandates immutable audit trails (`CreatedBy`, `ModifiedBy`, `IsActive`) across all transactional layers.
*   **Localization First**: The UI layer dynamically binds to resource files, supporting LTR (English, Bangla, Hindi) and RTL (Arabic, Urdu) without hardcoded text.
*   **API First (Readiness)**: Business logic is encapsulated to allow future RESTful APIs to consume the exact same rules as the WebForms UI.
*   **Database Independence**: SQL Server is used now, but schema design avoids proprietary triggers where possible to ensure future PostgreSQL/Supabase portability.
*   **AI Ready**: Data is structured and normalized to feed machine learning models (e.g., Module 40).
*   **Mobile Ready**: The architecture separates the client layer to support future native iOS/Android applications.

---

## 3. Platform Foundation Layer
The absolute base of the SaaS application.
*   **Organization & Company**: Manages the multi-tenant boundaries (Module 01).
*   **Branch**: Manages physical locations within a tenant.
*   **Configuration**: Global system settings and localization engines (Module 06).
*   **Licensing**: Controls feature toggles and tenant subscription limits.

## 4. Security Layer
Cross-cutting layer protecting all access.
*   **Users**: Identity management (Module 02).
*   **Roles & Permissions**: RBAC matrix (Module 03).
*   **Authentication & Authorization**: Login, session management, and future MFA.
*   **Audit**: Centralized tracking of all system actions (Module 04).

## 5. Master Data Layer
The dictionaries that drive clinical and operational workflows.
*   **Departments & Categories**: Organizational taxonomy (Modules 08, 09).
*   **Services**: The Master Service Catalog for billing and clinical orders (Module 10).
*   **Doctors & Masters**: Provider profiles and referral networks (Modules 11, 12).
*   **Inventory/Pharmacy Masters**: Diagnostic and medication catalogs (Modules 14, 20).

## 6. Patient Management Layer
The core demographic and identity engine.
*   **Patient Registration**: Master Patient Index (MPI) generation (Module 15).
*   **Patient Identity**: Deduplication and demographic tracking.
*   **Patient Profile**: The 360-degree clinical ledger (Module 16).

## 7. Appointment Layer
The scheduling and patient flow engine.
*   **Scheduling**: Doctor rosters, slot management, and waitlists (Modules 17, 31).
*   **Follow-Up**: Continuity of care tracking.
*   **Queue**: Token generation and waiting area management.

## 8. Clinical Layer
The physician's workspace.
*   **Encounter**: Chief complaints, vitals, and diagnoses (Module 18).
*   **Prescription**: Medication plans and e-prescribing (Module 19).
*   **Clinical Notes**: Progress notes and structured templates.

## 9. Diagnostic Layer
The LIS and RIS engines.
*   **Laboratory**: Sample collection, result entry, and verification (Modules 21, 22, 23).
*   **Radiology**: Imaging workflows, acquisition, and reporting (Module 25).
*   **Report Release**: Secure delivery and QR authenticity (Module 24).

## 10. Pharmacy Layer
Medication dispensing and tracking.
*   **Medication Catalog**: Generic/Brand master data (Module 20).
*   **Medication Administration**: The nursing MAR execution (Module 26).

## 11. IPD Layer
Inpatient operations and logistics.
*   **Admission & Bed Management**: Occupancy, transfers, and housekeeping (Module 28).
*   **Nursing**: Vitals, clinical tasks, and shift handovers (Module 27).
*   **Discharge**: Multi-department clearance and continuity of care (Module 29).

## 12. Finance Layer
The revenue cycle engine (Touchpoints across modules).
*   **Billing**: Invoicing for OPD, IPD, Diagnostics, and Pharmacy.
*   **Payments**: Cash, credit, and future online gateways.
*   **Revenue**: Corporate and insurance tracking.

## 13. Patient Engagement Layer
The digital front door.
*   **Patient Portal**: Self-service booking, report access, and vault (Module 30).
*   **Notifications**: SMS, Email, and WhatsApp alerts (Module 05).
*   **Messaging**: Secure patient-provider communication.

## 14. Telemedicine Layer
Virtual care delivery.
*   **Virtual Consultation**: Video/Audio integration (Module 32).
*   **Virtual Waiting Room**: Remote triage and queue management.
*   **Remote Follow-Up**: Digital continuity of care.

## 15. AI Layer
Intelligent automation.
*   **OCR & AI Prescription Capture**: Digitizing unstructured data (Module 40).
*   **Smart Mapping**: NLP to map text to the Service Catalog.
*   **Recommendation Engine**: Smart billing and duplicate detection.

## 16. Analytics Layer
Data visualization and KPIs.
*   **Dashboards**: Real-time operational views (e.g., Bed Occupancy, Nursing Station).
*   **KPIs**: Turnaround times, readmission rates, and revenue metrics.
*   **Reporting**: Standardized PDF/Excel exports across all modules.

## 17. Integration Layer
Future-ready interoperability.
*   **APIs**: RESTful endpoints for internal and external consumption.
*   **HL7 / FHIR Readiness**: Standardized healthcare data exchange.
*   **External Labs & Devices**: Integration with analyzers and smart pumps.

## 18. Mobile Layer
Client applications.
*   **Patient App**: Native extension of the Patient Portal.
*   **Doctor App**: Mobile EMR and schedule management.
*   **Nursing App**: Bedside vitals and BCMA (Barcode Medication Administration).

## 19. Future Expansion Layer
Reserved architectural space for specialized modules.
*   **Blood Bank**, **ICU**, **OT (Operating Theater)**, **Emergency (ER)**, **Infection Control**, **Public Health**.

---

## 20. Layer Dependency Diagram

```text
+-----------------------------------------------------------------------+
|                       [18] MOBILE LAYER (Apps)                        |
+-----------------------------------------------------------------------+
| [13] PATIENT ENGAGEMENT  | [14] TELEMEDICINE    | [15] AI LAYER       |
+-----------------------------------------------------------------------+
| [07] APPOINTMENT | [08] CLINICAL | [09] DIAGNOSTIC | [11] IPD LAYER   |
+-----------------------------------------------------------------------+
| [06] PATIENT MGMT| [10] PHARMACY | [12] FINANCE    | [16] ANALYTICS   |
+-----------------------------------------------------------------------+
| [17] INTEGRATION LAYER (APIs, HL7, FHIR)                              |
+-----------------------------------------------------------------------+
| [05] MASTER DATA LAYER (Catalogs, Doctors, Services)                  |
+-----------------------------------------------------------------------+
| [04] SECURITY LAYER (Users, Roles, Audit)                             |
+-----------------------------------------------------------------------+
| [03] PLATFORM FOUNDATION LAYER (Company, Branch, Localization)        |
+-----------------------------------------------------------------------+
```

---

## 21. Cross Layer Data Flow

```text
[ PATIENT JOURNEY DATA FLOW ]

(Layer 6: Patient)      [ Registration / MPI ]
                                  |
(Layer 7: Appointment)  [ Schedule / Waitlist ]
                                  |
(Layer 8: Clinical)     [ Encounter / Vitals ]
                                  |
                                  +------------> (Layer 10: Pharmacy) [ Prescription ]
                                  |
(Layer 9: Diagnostic)   [ Lab / Rad Orders ]
                                  |
(Layer 15: AI)          [ OCR / Smart Mapping ] <--- (External Rx Upload)
                                  |
(Layer 12: Finance)     [ Billing / Invoicing ]
                                  |
(Layer 11: IPD)         [ Admission / Bed / MAR / Discharge ]
                                  |
(Layer 13: Engagement)  [ Portal Access / Reports / Follow-up ]
```

---

## 22. Database Architecture Mapping

| Layer | Primary Database Tables (Examples) |
|:---|:---|
| **Foundation** | `Company`, `Branch`, `AppConfiguration`, `LocalizationResource` |
| **Security** | `User`, `Role`, `UserRole`, `AuditLog` |
| **Master Data** | `Department`, `ServiceMaster`, `Doctor`, `WardMaster` |
| **Patient** | `Patient`, `PatientProfile`, `PatientAllergy` |
| **Appointment** | `Appointment`, `DoctorSchedule`, `FollowUpPlan` |
| **Clinical** | `Encounter`, `ClinicalNote`, `Prescription` |
| **Diagnostic** | `LabResult`, `SampleCollection`, `RadiologyStudy` |
| **Pharmacy** | `PharmacyItem`, `MedicationAdministrationRecord (MAR)` |
| **IPD** | `BedOccupancy`, `NursingTask`, `DischargeRequest` |
| **Finance** | `Invoice`, `Payment`, `PatientLedger` |
| **Engagement** | `PortalAccount`, `PortalMessage`, `NotificationLog` |
| **Telemedicine** | `TelemedicineSession`, `TelemedicineConsent` |
| **AI** | `AIPrescriptionCapture`, `AIInvestigationMapping` |

---

## 23. API Architecture Mapping
*(Future RESTful API Structure)*

| Layer | Future API Route (Example) | Purpose |
|:---|:---|:---|
| **Security** | `/api/v1/auth/login` | JWT Token generation |
| **Master Data** | `/api/v1/masters/services` | Fetch service catalog |
| **Patient** | `/api/v1/patients/{id}` | Fetch patient demographics |
| **Appointment** | `/api/v1/appointments/book` | Portal/Mobile booking endpoint |
| **Clinical** | `/api/v1/clinical/prescriptions` | Fetch active prescriptions |
| **Diagnostic** | `/api/v1/diagnostics/reports/{id}`| Download PDF report |
| **IPD** | `/api/v1/ipd/vitals` | Bedside mobile vitals entry |
| **Telemedicine**| `/api/v1/telemed/session/{id}` | Fetch WebRTC connection token |
| **AI** | `/api/v1/ai/ocr/upload` | Submit image for prescription parsing |

---

## 24. Final Architecture Roadmap

```text
=========================================================================================
                      ABSHealthcareLite Master Architecture Stack
=========================================================================================

[ CLIENT PRESENTATION TIER ]
   +----------------+   +----------------+   +----------------+   +----------------+
   | ASP.NET Web UI |   | Patient Portal |   | Mobile App API |   | B2B Integrations|
   | (Current)      |   | (Web/Responsive|   | (Future Native)|   | (HL7 / FHIR)   |
   +----------------+   +----------------+   +----------------+   +----------------+

[ BUSINESS LOGIC TIER (C# / Future .NET Core) ]
   +-------------------------------------------------------------------------------+
   | + AI Prescription Engine (Mod 40)       + Telemedicine Engine (Mod 32)        |
   | + Clinical Rules Engine (Mod 18,19,26)  + LIS/RIS Engine (Mod 21-25)          |
   | + IPD & Bed Management (Mod 27,28,29)   + Billing & Finance Engine            |
   | + Appointment & Queue (Mod 17,31)       + Notification Engine (Mod 05)        |
   +-------------------------------------------------------------------------------+

[ SECURITY & GOVERNANCE TIER ]
   +-------------------------------------------------------------------------------+
   | + Multi-Tenant Context (CompanyId)      + RBAC Authorization (Mod 03)         |
   | + Audit Logging (Mod 04)                + Localization Engine (Mod 06)        |
   +-------------------------------------------------------------------------------+

[ DATA ACCESS TIER (ADO.NET / Future EF Core) ]
   +-------------------------------------------------------------------------------+
   | + Stored Procedures (Current)           + ORM Mappings (Future)               |
   | + Connection Resiliency                 + Read/Write Segregation Readiness    |
   +-------------------------------------------------------------------------------+

[ DATABASE TIER (SQL Server / Future PostgreSQL) ]
   +----------------+   +----------------+   +----------------+   +----------------+
   | Master Data DB |   | Patient/Cln DB |   | Diagnostics DB |   | Portal/AI DB   |
   | (Isolated by   |   | (Isolated by   |   | (Isolated by   |   | (Isolated by   |
   |  CompanyId)    |   |  CompanyId)    |   |  CompanyId)    |   |  CompanyId)    |
   +----------------+   +----------------+   +----------------+   +----------------+

=========================================================================================
```

<div style="page-break-after: always;"></div>

