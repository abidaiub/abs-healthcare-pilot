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