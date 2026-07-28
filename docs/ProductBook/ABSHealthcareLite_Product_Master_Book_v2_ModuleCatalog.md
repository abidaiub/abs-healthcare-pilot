# ABSHealthcareLite Product Master Book
## Volume 2 – Functional Module Catalog

---

## SECTION 1: EXECUTIVE SUMMARY

The **ABSHealthcareLite Product Master Book Volume 2 – Functional Module Catalog** provides a comprehensive, functional breakdown of the documented modules within the ABSHealthcareLite ecosystem: clinical/diagnostic modules **01–32** and **40**, plus the **Business Operations Suite** modules **33–39** and **41–42** (PLANNED / ARCHITECTURE APPROVED — not implemented).

Designed for Product Managers, Sales Teams, Implementation Specialists, and Healthcare Executives, this document translates the technical architecture into business capabilities. It works in tandem with **Volume 1 (Product Master Book)** and the **System Architecture Blueprints (01-03)** to provide a complete understanding of what the system does, who uses it, and how it is deployed. 

This catalog reinforces our commitment to a Multi-tenant SaaS architecture, localized for global markets (English, Bangla, Arabic, Urdu, Hindi), and built on a future-proof technology stack (SQL Server to PostgreSQL, WebForms to MVC/Core/Mobile APIs).

---

## SECTION 2: MODULE CATALOG OVERVIEW

| Module | Name | Category | Criticality | Status |
| :--- | :--- | :--- | :--- | :--- |
| **01** | Company/Tenant Management | Foundation | Foundation | Documented |
| **02** | User Management | Security | Foundation | Documented |
| **03** | Role & Permission | Security | Foundation | Documented |
| **04** | Audit Center | Foundation | Foundation | Documented |
| **05** | Notification Center | Foundation | Foundation | Documented |
| **06** | Localization | Foundation | Foundation | Documented |
| **07** | Branch / Location | Master Data | Foundation | Documented |
| **08** | Department Management | Master Data | Foundation | Documented |
| **09** | Category Management | Master Data | Foundation | Documented |
| **10** | Master Service Catalog | Master Data | Foundation | Documented |
| **11** | Doctor Management | Master Data | Foundation | Documented |
| **12** | Referral Doctor | Master Data | Foundation | Documented |
| **13** | Ward / Cabin / Bed Setup | Master Data | Foundation | Documented |
| **14** | Diagnostic Inventory | Master Data | Foundation | Documented |
| **15** | Patient Registration & MPI | Patient | Core | Documented |
| **16** | Patient Profile & Ledger | Patient | Core | Documented |
| **17** | Appointment & Queue | Patient | Core | Documented |
| **18** | Doctor Worklist & Encounter | Clinical | Core | Documented |
| **19** | Prescription Management | Clinical | Core | Documented |
| **20** | Pharmacy Catalog | Clinical | Core | Documented |
| **21** | Sample Collection | Laboratory | Core | Documented |
| **22** | Result Entry & Analyzer | Laboratory | Advanced | Documented |
| **23** | Result Verification | Laboratory | Advanced | Documented |
| **24** | Report Release & Delivery | Laboratory | Advanced | Documented |
| **25** | Radiology Workflow | Radiology | Advanced | Documented |
| **26** | Medication Admin Record (MAR)| Nursing | Enterprise | Documented |
| **27** | Nursing Station & Tasks | Nursing | Enterprise | Documented |
| **28** | Bed & Occupancy Management | IPD | Enterprise | Documented |
| **29** | Discharge Management | IPD | Enterprise | Documented |
| **30** | Patient Portal & Self Service| Engagement | Advanced | Documented |
| **31** | Appointment & Follow-Up | Engagement | Advanced | Documented |
| **32** | Telemedicine & Virtual Care | Telemedicine | Enterprise | Documented |
| **33** | Finance & General Accounting | Business Operations | Foundation (ERP) | PLANNED / ARCHITECTURE APPROVED |
| **34** | Procurement & Supplier Management | Business Operations | Foundation (ERP) | PLANNED / ARCHITECTURE APPROVED |
| **35** | Enterprise Inventory, Store & Consumption | Business Operations | Foundation (ERP) | PLANNED / ARCHITECTURE APPROVED |
| **36** | Fixed Asset, Device Maintenance & Calibration | Business Operations | Advanced (ERP) | PLANNED / ARCHITECTURE APPROVED |
| **37** | HR & Employee Management | Business Operations | Advanced (ERP) | PLANNED / ARCHITECTURE APPROVED |
| **38** | Payroll, Benefits, Loans & Final Settlement | Business Operations | Advanced (ERP) | PLANNED / ARCHITECTURE APPROVED |
| **39** | Shareholder, Investment & Profit Distribution | Business Operations | Enterprise (ERP) | PLANNED / ARCHITECTURE APPROVED |
| **40** | AI Prescription Capture | AI | AI | Documented |
| **41** | Budgeting, Cost Center & Financial Control | Business Operations | Advanced (ERP) | PLANNED / ARCHITECTURE APPROVED |
| **42** | Manufacturing, BOM, Production & Costing | Business Operations | Enterprise (ERP) | PLANNED / ARCHITECTURE APPROVED |

> **Status note:** PLANNED / ARCHITECTURE APPROVED means documentation and registry reservation only. Implementation, AI-QC, Manual QC/UAT, and production approval have **not** started. MOD-40 remains AI Prescription Capture and was not renumbered.

---

## SECTION 3: DETAILED MODULE CATALOG

### Module 01 – Company/Tenant Management
1. **Purpose**: Establishes the SaaS multi-tenant boundaries.
2. **Business Objectives**: Isolate data per hospital/clinic to ensure privacy and enable scalable cloud hosting.
3. **Primary Actors**: Host Admin.
4. **Secondary Actors**: Tenant Admin.
5. **Key Features**: Tenant onboarding, global settings, subscription limits, data isolation.
6. **Major Screens**: Host Dashboard, Tenant Setup.
7. **Major Reports**: Tenant List, Subscription Status.
8. **Major Database Entities**: `Company`, `TenantConfig`.
9. **Dependencies**: None.
10. **Used By**: All Modules.
11. **Security Considerations**: Absolute isolation via `CompanyId`.
12. **Audit Requirements**: Track tenant creation and status changes.
13. **Mobile Readiness**: Low.
14. **API Readiness**: High (Provisioning APIs).
15. **AI Readiness**: Low.
16. **Future Expansion**: Multi-region data residency routing.
17. **Criticality Level**: Foundation.
18. **Deployment Edition**: All Editions.

### Module 02 – User Management
1. **Purpose**: Manages staff identities and authentication.
2. **Business Objectives**: Secure system access and track employee activity.
3. **Primary Actors**: Tenant Admin, HR.
4. **Secondary Actors**: All Staff.
5. **Key Features**: User creation, credential management, status toggling.
6. **Major Screens**: User Directory, User Profile.
7. **Major Reports**: Active Users, Login History.
8. **Major Database Entities**: `User`, `UserLoginHistory`.
9. **Dependencies**: Mod 01, 03.
10. **Used By**: All Modules.
11. **Security Considerations**: Password hashing, session timeouts.
12. **Audit Requirements**: Track user creation, suspension, and failed logins.
13. **Mobile Readiness**: High (Mobile login).
14. **API Readiness**: High (Auth endpoints).
15. **AI Readiness**: Low.
16. **Future Expansion**: SSO, Active Directory integration, Biometrics.
17. **Criticality Level**: Foundation.
18. **Deployment Edition**: All Editions.

### Module 03 – Role & Permission
1. **Purpose**: Enforces Role-Based Access Control (RBAC).
2. **Business Objectives**: Ensure users only access data necessary for their job.
3. **Primary Actors**: Tenant Admin.
4. **Secondary Actors**: None.
5. **Key Features**: Role creation, granular permission matrix, menu visibility control.
6. **Major Screens**: Role Manager, Permission Matrix.
7. **Major Reports**: Role Assignment Report.
8. **Major Database Entities**: `Role`, `Permission`, `RolePermission`.
9. **Dependencies**: Mod 01.
10. **Used By**: Mod 02.
11. **Security Considerations**: Prevents unauthorized API/URL access.
12. **Audit Requirements**: Track permission changes.
13. **Mobile Readiness**: Medium.
14. **API Readiness**: High (Middleware validation).
15. **AI Readiness**: Low.
16. **Future Expansion**: Attribute-based access control (ABAC).
17. **Criticality Level**: Foundation.
18. **Deployment Edition**: All Editions.

### Module 04 – Audit Center
1. **Purpose**: Centralized tracking of all system data changes.
2. **Business Objectives**: Ensure medico-legal compliance and operational transparency.
3. **Primary Actors**: System Admin, Auditor.
4. **Secondary Actors**: Tenant Admin.
5. **Key Features**: Record-level tracking (Created, Modified, Deleted).
6. **Major Screens**: Global Audit Viewer.
7. **Major Reports**: System Audit Trail, Security Exceptions.
8. **Major Database Entities**: `AuditLog`.
9. **Dependencies**: Mod 01, 02.
10. **Used By**: All Modules.
11. **Security Considerations**: Audit logs must be immutable.
12. **Audit Requirements**: Self-auditing.
13. **Mobile Readiness**: Low.
14. **API Readiness**: High.
15. **AI Readiness**: Low.
16. **Future Expansion**: Blockchain-backed audit trails.
17. **Criticality Level**: Foundation.
18. **Deployment Edition**: All Editions.

### Module 05 – Notification Center
1. **Purpose**: Manages outbound and internal communications.
2. **Business Objectives**: Improve patient engagement and staff responsiveness.
3. **Primary Actors**: System Admin.
4. **Secondary Actors**: All Users, Patients.
5. **Key Features**: SMS, Email, WhatsApp, and internal push notifications.
6. **Major Screens**: Notification Templates, Dispatch Log.
7. **Major Reports**: Delivery Success/Failure Report.
8. **Major Database Entities**: `NotificationTemplate`, `NotificationLog`.
9. **Dependencies**: Mod 01.
10. **Used By**: Mod 17, 23, 27, 30, 31.
11. **Security Considerations**: PHI masking in external messages.
12. **Audit Requirements**: Track message dispatch and delivery status.
13. **Mobile Readiness**: High (Push notifications).
14. **API Readiness**: High (Webhook integrations).
15. **AI Readiness**: Medium (Smart delivery timing).
16. **Future Expansion**: Conversational AI chatbots.
17. **Criticality Level**: Foundation.
18. **Deployment Edition**: All Editions.

### Module 06 – Localization
1. **Purpose**: Drives the multilingual, RTL/LTR user interface.
2. **Business Objectives**: Enable global deployment across diverse linguistic regions.
3. **Primary Actors**: Host Admin, Translators.
4. **Secondary Actors**: All Users.
5. **Key Features**: Dynamic language switching, RTL mirroring, resource file management.
6. **Major Screens**: Language Setup, Translation Dictionary.
7. **Major Reports**: Translation Coverage Report.
8. **Major Database Entities**: `Language`, `TranslationKey`.
9. **Dependencies**: Mod 01.
10. **Used By**: All Modules.
11. **Security Considerations**: Sanitization of translated inputs.
12. **Audit Requirements**: Track dictionary updates.
13. **Mobile Readiness**: High.
14. **API Readiness**: High.
15. **AI Readiness**: Medium (Auto-translation).
16. **Future Expansion**: Real-time clinical translation.
17. **Criticality Level**: Foundation.
18. **Deployment Edition**: All Editions.

### Module 07 – Branch / Location
1. **Purpose**: Manages physical hospital locations within a tenant.
2. **Business Objectives**: Support multi-facility hospital chains under one corporate umbrella.
3. **Primary Actors**: Tenant Admin.
4. **Secondary Actors**: None.
5. **Key Features**: Branch creation, address tracking, facility settings.
6. **Major Screens**: Branch Setup.
7. **Major Reports**: Branch List.
8. **Major Database Entities**: `Branch`.
9. **Dependencies**: Mod 01.
10. **Used By**: Mod 08, 13, 15, 28.
11. **Security Considerations**: Branch-level data filtering.
12. **Audit Requirements**: Track branch creation/closure.
13. **Mobile Readiness**: Low.
14. **API Readiness**: High.
15. **AI Readiness**: Low.
16. **Future Expansion**: Geofencing.
17. **Criticality Level**: Foundation.
18. **Deployment Edition**: Hospital, Enterprise, AI Editions.

### Module 08 – Department Management
1. **Purpose**: Configures clinical and operational departments.
2. **Business Objectives**: Organize staff, services, and workflows logically.
3. **Primary Actors**: Tenant Admin.
4. **Secondary Actors**: None.
5. **Key Features**: Clinical vs. Non-clinical classification, branch mapping.
6. **Major Screens**: Department Setup.
7. **Major Reports**: Department List.
8. **Major Database Entities**: `Department`.
9. **Dependencies**: Mod 01, 07.
10. **Used By**: Mod 10, 11, 17, 21, 28.
11. **Security Considerations**: Department-level access restrictions.
12. **Audit Requirements**: Track department changes.
13. **Mobile Readiness**: Low.
14. **API Readiness**: High.
15. **AI Readiness**: Low.
16. **Future Expansion**: Departmental budget mapping.
17. **Criticality Level**: Foundation.
18. **Deployment Edition**: All Editions.

### Module 09 – Category Management
1. **Purpose**: Hierarchical grouping for services and inventory.
2. **Business Objectives**: Standardize reporting and billing classifications.
3. **Primary Actors**: Tenant Admin.
4. **Secondary Actors**: None.
5. **Key Features**: Parent/Child categories, tax mappings.
6. **Major Screens**: Category Tree Setup.
7. **Major Reports**: Category Hierarchy.
8. **Major Database Entities**: `Category`.
9. **Dependencies**: Mod 01.
10. **Used By**: Mod 10, 14, 20.
11. **Security Considerations**: None specific.
12. **Audit Requirements**: Track category changes.
13. **Mobile Readiness**: Low.
14. **API Readiness**: High.
15. **AI Readiness**: Low.
16. **Future Expansion**: Global standard mappings (UNSPSC).
17. **Criticality Level**: Foundation.
18. **Deployment Edition**: All Editions.

### Module 10 – Master Service Catalog
1. **Purpose**: The central repository for all billable hospital services.
2. **Business Objectives**: Ensure accurate billing and standardized clinical ordering.
3. **Primary Actors**: Billing Admin, Lab Admin.
4. **Secondary Actors**: Doctors.
5. **Key Features**: Service pricing, department mapping, lab test definitions.
6. **Major Screens**: Service Master Setup, Pricing Matrix.
7. **Major Reports**: Service Price List.
8. **Major Database Entities**: `ServiceMaster`, `ServicePrice`.
9. **Dependencies**: Mod 01, 08, 09.
10. **Used By**: Mod 18, 21, 22, 40.
11. **Security Considerations**: Price modification tracking.
12. **Audit Requirements**: Strict audit on price changes.
13. **Mobile Readiness**: Low.
14. **API Readiness**: High.
15. **AI Readiness**: High (Target for Module 40 NLP mapping).
16. **Future Expansion**: Dynamic pricing algorithms.
17. **Criticality Level**: Foundation.
18. **Deployment Edition**: All Editions.

### Module 11 – Doctor Management
1. **Purpose**: Manages provider profiles, specialties, and credentials.
2. **Business Objectives**: Track physician availability, commissions, and clinical authority.
3. **Primary Actors**: HR, Tenant Admin.
4. **Secondary Actors**: Appointment Desk.
5. **Key Features**: Doctor profiles, specialty mapping, schedule templates.
6. **Major Screens**: Doctor Profile, Roster Setup.
7. **Major Reports**: Doctor Directory.
8. **Major Database Entities**: `DoctorMaster`.
9. **Dependencies**: Mod 01, 02, 08.
10. **Used By**: Mod 17, 18, 31, 32.
11. **Security Considerations**: Credential verification tracking.
12. **Audit Requirements**: Profile updates.
13. **Mobile Readiness**: High (Doctor App profile).
14. **API Readiness**: High.
15. **AI Readiness**: Low.
16. **Future Expansion**: National medical council API integration.
17. **Criticality Level**: Foundation.
18. **Deployment Edition**: All Editions.

### Module 12 – Referral Doctor
1. **Purpose**: Tracks external referring physicians.
2. **Business Objectives**: Manage B2B relationships and referral commissions.
3. **Primary Actors**: Marketing/CRM, Billing.
4. **Secondary Actors**: Reception.
5. **Key Features**: External doctor profiles, clinic mapping.
6. **Major Screens**: Referral Doctor Setup.
7. **Major Reports**: Referral Volume Report.
8. **Major Database Entities**: `ReferralDoctor`.
9. **Dependencies**: Mod 01.
10. **Used By**: Mod 15, 24.
11. **Security Considerations**: Financial commission visibility.
12. **Audit Requirements**: Track profile creation.
13. **Mobile Readiness**: Low.
14. **API Readiness**: High.
15. **AI Readiness**: Low.
16. **Future Expansion**: Automated commission payouts.
17. **Criticality Level**: Foundation.
18. **Deployment Edition**: Diagnostic, Hospital, Enterprise Editions.

### Module 13 – Ward / Cabin / Bed Setup
1. **Purpose**: Defines the physical inpatient infrastructure.
2. **Business Objectives**: Map the hospital's physical capacity for occupancy tracking.
3. **Primary Actors**: Tenant Admin, Facilities Manager.
4. **Secondary Actors**: None.
5. **Key Features**: Building/Floor/Ward/Room/Bed hierarchy creation.
6. **Major Screens**: Location Hierarchy Builder.
7. **Major Reports**: Bed Inventory List.
8. **Major Database Entities**: `HospitalWard`, `HospitalRoom`, `HospitalBed`.
9. **Dependencies**: Mod 01, 07.
10. **Used By**: Mod 28.
11. **Security Considerations**: None specific.
12. **Audit Requirements**: Track capacity changes.
13. **Mobile Readiness**: Low.
14. **API Readiness**: High.
15. **AI Readiness**: Low.
16. **Future Expansion**: 3D Digital Twin mapping.
17. **Criticality Level**: Foundation.
18. **Deployment Edition**: Hospital, Enterprise, AI Editions.

### Module 14 – Diagnostic Inventory
1. **Purpose**: Healthcare-specific diagnostic inventory and consumption extension for reagents, consumables, and lab quality rules.
2. **Business Objectives**: Ensure labs never run out of critical testing supplies while reusing the enterprise inventory/procurement engines.
3. **Primary Actors**: Lab Manager, Store Keeper.
4. **Secondary Actors**: Purchase Officer (via MOD-34), Inventory Controller (via MOD-35).
5. **Key Features**: Reagent/open-bottle/open-expiry tracking; test-/analyzer-/patient-service-wise consumption; healthcare expiry blocking; lab compliance rules. Physical stock ledger and generic item engine are **MOD-35**; procurement is **MOD-34**.
6. **Major Screens**: Healthcare consumption dashboard, reagent open log, machine/test mapping (planned over MOD-35 stock views).
7. **Major Reports**: Low Stock Alert, Expiry Report, Consumption by Test/Machine.
8. **Major Database Entities**: Healthcare extension entities over MOD-35 item/batch/ledger (design pending implementation).
9. **Dependencies**: Mod 01, 09; **planned**: Mod 34, 35.
10. **Used By**: Mod 21, 22.
11. **Security Considerations**: Inventory value protection.
12. **Audit Requirements**: Track stock adjustments and consumption.
13. **Mobile Readiness**: Medium (Barcode scanning).
14. **API Readiness**: High.
15. **AI Readiness**: Medium (Predictive ordering).
16. **Future Expansion**: Auto-consumption from LIS result/verification events.
17. **Criticality Level**: Foundation.
18. **Deployment Edition**: Diagnostic, Hospital, Enterprise Editions.
19. **Implementation Status**: Documented; not implemented. Architecture boundary **ARCHITECTURE APPROVED** (extension of MOD-35/MOD-34).

### Module 15 – Patient Registration & MPI
1. **Purpose**: Creates the unified patient identity.
2. **Business Objectives**: Prevent duplicate records and establish the Master Patient Index (MPI).
3. **Primary Actors**: Receptionist.
4. **Secondary Actors**: Patient (via Portal).
5. **Key Features**: Demographic capture, duplicate detection, ID card generation.
6. **Major Screens**: Registration Desk, Patient Search.
7. **Major Reports**: Daily Registration Report.
8. **Major Database Entities**: `Patient`.
9. **Dependencies**: Mod 01, 06, 07.
10. **Used By**: Mod 16, 17, 28, 30.
11. **Security Considerations**: Strict PHI protection.
12. **Audit Requirements**: Track demographic changes.
13. **Mobile Readiness**: High (Self-registration).
14. **API Readiness**: High.
15. **AI Readiness**: Medium (Face matching for deduplication).
16. **Future Expansion**: National ID integration.
17. **Criticality Level**: Core.
18. **Deployment Edition**: All Editions.

### Module 16 – Patient Profile & Ledger
1. **Purpose**: The 360-degree clinical and financial patient view and **patient subledger UX**.
2. **Business Objectives**: Provide a single source of truth for a patient's clinical history and patient-account dues.
3. **Primary Actors**: Doctors, Nurses, Billing.
4. **Secondary Actors**: None.
5. **Key Features**: Timeline view, allergy tracking, consolidated **patient** ledger (debits/credits/due). **Not** General Ledger, Account Ledger, Cash Book, Bank Book, Trial Balance, P&L, or Balance Sheet (those are MOD-33).
6. **Major Screens**: Patient 360 Dashboard, Patient Account / Ledger Grid.
7. **Major Reports**: Patient History Summary, Patient Due Statement.
8. **Major Database Entities**: `PatientProfile`, `PatientAllergy`, patient ledger projection (design pending).
9. **Dependencies**: Mod 15; financial projection over Mod 10; future Mod 33 patient subledger.
10. **Used By**: Mod 18, 27, 29, 30.
11. **Security Considerations**: High PHI visibility restrictions.
12. **Audit Requirements**: Track profile views (Break-the-glass).
13. **Mobile Readiness**: High.
14. **API Readiness**: High.
15. **AI Readiness**: High (Risk profiling).
16. **Future Expansion**: Longitudinal health graphs.
17. **Criticality Level**: Core.
18. **Deployment Edition**: All Editions.
19. **Boundary ADR**: ADR-005 (`docs/Architecture/ADR/ADR-005-MOD-16-Patient-Ledger-vs-GL.md`).

### Module 17 – Appointment & Queue
1. **Purpose**: Basic scheduling and token generation.
2. **Business Objectives**: Manage daily outpatient flow.
3. **Primary Actors**: Front Desk.
4. **Secondary Actors**: Doctors.
5. **Key Features**: Slot booking, token printing, check-in.
6. **Major Screens**: Daily Roster, Token Queue.
7. **Major Reports**: Daily Appointment Register.
8. **Major Database Entities**: `Appointment`.
9. **Dependencies**: Mod 11, 15.
10. **Used By**: Mod 18, 31.
11. **Security Considerations**: None specific.
12. **Audit Requirements**: Track cancellations.
13. **Mobile Readiness**: High.
14. **API Readiness**: High.
15. **AI Readiness**: Low.
16. **Future Expansion**: Replaced/Enhanced by Module 31.
17. **Criticality Level**: Core.
18. **Deployment Edition**: Clinic, Diagnostic Editions.

### Module 18 – Doctor Worklist & Encounter
1. **Purpose**: The physician's primary clinical workspace.
2. **Business Objectives**: Digitally capture complaints, diagnoses, and orders.
3. **Primary Actors**: Doctors.
4. **Secondary Actors**: Nurses (Triage).
5. **Key Features**: Vitals review, clinical notes, ICD-10 coding, order entry.
6. **Major Screens**: Doctor Dashboard, Encounter Workspace.
7. **Major Reports**: Outpatient Morbidity Report.
8. **Major Database Entities**: `Encounter`, `ClinicalNote`.
9. **Dependencies**: Mod 11, 15, 17.
10. **Used By**: Mod 19, 21, 25, 29.
11. **Security Considerations**: Doctor-only edit rights.
12. **Audit Requirements**: Immutable clinical notes.
13. **Mobile Readiness**: High (Tablet EMR).
14. **API Readiness**: High.
15. **AI Readiness**: High (Voice-to-text notes).
16. **Future Expansion**: Clinical Decision Support (CDS).
17. **Criticality Level**: Core.
18. **Deployment Edition**: Clinic, Hospital, Enterprise, Telemedicine, AI Editions.

### Module 19 – Prescription Management
1. **Purpose**: Generates structured, multilingual medication plans.
2. **Business Objectives**: Eliminate handwriting errors and standardize prescribing.
3. **Primary Actors**: Doctors.
4. **Secondary Actors**: Pharmacists.
5. **Key Features**: Drug search, dosage templates, multilingual printouts.
6. **Major Screens**: ePrescription Pad.
7. **Major Reports**: Prescribing Patterns Report.
8. **Major Database Entities**: `Prescription`, `PrescriptionItem`.
9. **Dependencies**: Mod 18, 20.
10. **Used By**: Mod 26, 30, 32.
11. **Security Considerations**: Prevents unauthorized prescription generation.
12. **Audit Requirements**: Track prescription edits.
13. **Mobile Readiness**: High.
14. **API Readiness**: High.
15. **AI Readiness**: Medium (Drug interaction alerts).
16. **Future Expansion**: National ePrescription gateway integration.
17. **Criticality Level**: Core.
18. **Deployment Edition**: Clinic, Hospital, Enterprise, Telemedicine, AI Editions.

### Module 20 – Pharmacy Catalog
1. **Purpose**: The master drug database driving prescriptions and MAR.
2. **Business Objectives**: Standardize generic and brand names across the hospital.
3. **Primary Actors**: Chief Pharmacist.
4. **Secondary Actors**: Doctors, Nurses.
5. **Key Features**: Generic/Brand mapping, route/dosage forms, high-alert flags.
6. **Major Screens**: Drug Master Setup.
7. **Major Reports**: Formulary List.
8. **Major Database Entities**: `PharmacyItem`, `GenericMaster`.
9. **Dependencies**: Mod 01, 09.
10. **Used By**: Mod 19, 26, 29.
11. **Security Considerations**: Formulary control.
12. **Audit Requirements**: Track drug additions/removals.
13. **Mobile Readiness**: Low.
14. **API Readiness**: High.
15. **AI Readiness**: Low.
16. **Future Expansion**: Global drug database API sync.
17. **Criticality Level**: Core.
18. **Deployment Edition**: Clinic, Hospital, Enterprise, AI Editions.

### Module 21 – Sample Collection
1. **Purpose**: Barcode generation and physical sample tracking.
2. **Business Objectives**: Eliminate pre-analytical lab errors and lost samples.
3. **Primary Actors**: Phlebotomist.
4. **Secondary Actors**: Lab Reception.
5. **Key Features**: Smart tube grouping, barcode printing, chain of custody.
6. **Major Screens**: Phlebotomy Dashboard, Collection Screen.
7. **Major Reports**: Pending Collection Report.
8. **Major Database Entities**: `SampleCollection`, `SampleBarcode`.
9. **Dependencies**: Mod 10, 15, 18.
10. **Used By**: Mod 22.
11. **Security Considerations**: Patient verification before draw.
12. **Audit Requirements**: Track collection timestamps.
13. **Mobile Readiness**: High (Mobile barcode scanning).
14. **API Readiness**: High.
15. **AI Readiness**: Low.
16. **Future Expansion**: Automated tube sorting integration.
17. **Criticality Level**: Core.
18. **Deployment Edition**: Diagnostic, Hospital, Enterprise, AI Editions.

### Module 22 – Result Entry & Analyzer
1. **Purpose**: Captures manual and machine-generated lab results.
2. **Business Objectives**: Rapid, accurate diagnostic data entry.
3. **Primary Actors**: Lab Technologist.
4. **Secondary Actors**: None.
5. **Key Features**: Reference range auto-flagging, critical value alerts, analyzer queue.
6. **Major Screens**: Result Entry Grid, Analyzer Queue.
7. **Major Reports**: Pending Result Report.
8. **Major Database Entities**: `LabResult`, `AnalyzerMapping`.
9. **Dependencies**: Mod 21, 10.
10. **Used By**: Mod 23.
11. **Security Considerations**: Result tampering prevention.
12. **Audit Requirements**: Track manual vs. machine entry.
13. **Mobile Readiness**: Low.
14. **API Readiness**: High (HL7/ASTM).
15. **AI Readiness**: Medium (Delta check anomaly detection).
16. **Future Expansion**: Bidirectional analyzer interfaces.
17. **Criticality Level**: Advanced.
18. **Deployment Edition**: Diagnostic, Hospital, Enterprise, AI Editions.

### Module 23 – Result Verification
1. **Purpose**: Multi-level clinical approval and quality control.
2. **Business Objectives**: Ensure diagnostic accuracy and medico-legal compliance.
3. **Primary Actors**: Pathologist, Lab Supervisor.
4. **Secondary Actors**: None.
5. **Key Features**: Approval matrices, critical value notification tracking, correction workflow.
6. **Major Screens**: Verification Dashboard, Approval Queue.
7. **Major Reports**: Verification TAT Report.
8. **Major Database Entities**: `ResultVerification`, `ResultApproval`.
9. **Dependencies**: Mod 22, 02, 03.
10. **Used By**: Mod 24, 29.
11. **Security Considerations**: Digital signature tracking.
12. **Audit Requirements**: Strict audit of report amendments.
13. **Mobile Readiness**: High (Pathologist mobile approval).
14. **API Readiness**: High.
15. **AI Readiness**: High (Auto-verification rules).
16. **Future Expansion**: Peer review workflows.
17. **Criticality Level**: Advanced.
18. **Deployment Edition**: Diagnostic, Hospital, Enterprise, AI Editions.

### Module 24 – Report Release & Delivery
1. **Purpose**: Secure distribution of finalized diagnostic reports.
2. **Business Objectives**: Deliver reports quickly while enforcing billing holds.
3. **Primary Actors**: Report Desk, Patients.
4. **Secondary Actors**: None.
5. **Key Features**: Release blocking matrix, QR authenticity, PDF generation.
6. **Major Screens**: Release Queue, Reprint Screen.
7. **Major Reports**: Delivery Report, Reprint Audit.
8. **Major Database Entities**: `ReportRelease`, `ReportDelivery`.
9. **Dependencies**: Mod 23, 15.
10. **Used By**: Mod 30.
11. **Security Considerations**: Prevent unauthorized downloads.
12. **Audit Requirements**: Track every print and download.
13. **Mobile Readiness**: High.
14. **API Readiness**: High.
15. **AI Readiness**: Low.
16. **Future Expansion**: Blockchain document verification.
17. **Criticality Level**: Advanced.
18. **Deployment Edition**: Diagnostic, Hospital, Enterprise, AI Editions.

### Module 25 – Radiology Workflow
1. **Purpose**: Manages imaging schedules, acquisition, and dictation.
2. **Business Objectives**: Optimize expensive machine utilization and radiologist TAT.
3. **Primary Actors**: Radiologist, Rad Tech.
4. **Secondary Actors**: Reception.
5. **Key Features**: Modality scheduling, structured reporting templates, critical findings.
6. **Major Screens**: Rad Dashboard, Structured Reporting Screen.
7. **Major Reports**: Machine Utilization Report.
8. **Major Database Entities**: `RadiologyStudy`, `RadiologyReport`.
9. **Dependencies**: Mod 10, 15, 18.
10. **Used By**: Mod 24, 30.
11. **Security Considerations**: DICOM metadata protection.
12. **Audit Requirements**: Track acquisition times.
13. **Mobile Readiness**: Medium.
14. **API Readiness**: High (DICOM/PACS).
15. **AI Readiness**: High (AI image pre-screening).
16. **Future Expansion**: Full VNA (Vendor Neutral Archive) integration.
17. **Criticality Level**: Advanced.
18. **Deployment Edition**: Diagnostic, Hospital, Enterprise, AI Editions.

### Module 26 – Medication Admin Record (MAR)
1. **Purpose**: Tracks actual drug administration by nurses for patient safety.
2. **Business Objectives**: Enforce the "Rights of Medication" and prevent errors.
3. **Primary Actors**: Nurses.
4. **Secondary Actors**: Doctors, Pharmacists.
5. **Key Features**: Scheduled/PRN tracking, missed dose governance, adverse event logging.
6. **Major Screens**: MAR Dashboard, Administration Screen.
7. **Major Reports**: Missed Dose Report.
8. **Major Database Entities**: `MedicationAdministrationRecord`.
9. **Dependencies**: Mod 19, 20, 27, 28.
10. **Used By**: Mod 29.
11. **Security Considerations**: Witness signatures for narcotics.
12. **Audit Requirements**: Immutable administration logs.
13. **Mobile Readiness**: High (Bedside tablet).
14. **API Readiness**: High.
15. **AI Readiness**: Medium (Adherence analytics).
16. **Future Expansion**: Smart IV Pump integration.
17. **Criticality Level**: Enterprise.
18. **Deployment Edition**: Hospital, Enterprise, AI Editions.

### Module 27 – Nursing Station & Tasks
1. **Purpose**: The operational hub for vitals, handovers, and clinical tasks.
2. **Business Objectives**: Digitize the ward and ensure continuous patient care.
3. **Primary Actors**: Nurses, Ward In-Charge.
4. **Secondary Actors**: Duty Doctors.
5. **Key Features**: Vitals auto-flagging, task kanban board, digital shift handover.
6. **Major Screens**: Ward Dashboard, Vitals Entry.
7. **Major Reports**: Nursing Activity Report, Shift Handover Log.
8. **Major Database Entities**: `PatientVitals`, `ClinicalTask`.
9. **Dependencies**: Mod 16, 28.
10. **Used By**: Mod 26, 29.
11. **Security Considerations**: Shift sign-off authentication.
12. **Audit Requirements**: Track task completion times.
13. **Mobile Readiness**: High.
14. **API Readiness**: High.
15. **AI Readiness**: High (NEWS2 automated scoring).
16. **Future Expansion**: Bedside IoT monitor integration.
17. **Criticality Level**: Enterprise.
18. **Deployment Edition**: Hospital, Enterprise, AI Editions.

### Module 28 – Bed & Occupancy Management
1. **Purpose**: Real-time tracking of bed status, transfers, and housekeeping.
2. **Business Objectives**: Maximize capacity utilization and drive accurate room billing.
3. **Primary Actors**: Admission Desk, Bed Manager, Housekeeping.
4. **Secondary Actors**: Nurses.
5. **Key Features**: Visual bed board, transfer workflows, housekeeping turnaround.
6. **Major Screens**: Bed Board, Transfer Screen.
7. **Major Reports**: Occupancy Report, Length of Stay (LOS).
8. **Major Database Entities**: `BedOccupancy`, `BedTransfer`.
9. **Dependencies**: Mod 13, 15.
10. **Used By**: Mod 27, 29.
11. **Security Considerations**: Isolation/Gender restriction enforcement.
12. **Audit Requirements**: Minute-by-minute occupancy timestamps.
13. **Mobile Readiness**: Medium (Housekeeping app).
14. **API Readiness**: High.
15. **AI Readiness**: High (Predictive forecasting).
16. **Future Expansion**: AI Bed Allocation.
17. **Criticality Level**: Enterprise.
18. **Deployment Edition**: Hospital, Enterprise, AI Editions.

### Module 29 – Discharge Management
1. **Purpose**: Multi-department clearance and continuity of care planning.
2. **Business Objectives**: Prevent revenue leakage and ensure safe patient transitions.
3. **Primary Actors**: Doctors, Discharge Coordinator, Billing.
4. **Secondary Actors**: Nurses, Pharmacy.
5. **Key Features**: Clearance tracker, discharge summary generation, bed release automation.
6. **Major Screens**: Discharge Dashboard, Summary Editor.
7. **Major Reports**: Discharge Register, Readmission Analysis.
8. **Major Database Entities**: `DischargeRequest`, `DischargeClearance`.
9. **Dependencies**: Mod 18, 20, 24, 28.
10. **Used By**: Mod 30, 31.
11. **Security Considerations**: Final lock e-signatures.
12. **Audit Requirements**: Track clearance bottlenecks.
13. **Mobile Readiness**: Low.
14. **API Readiness**: High.
15. **AI Readiness**: High (Readmission risk scoring).
16. **Future Expansion**: Automated Care Pathways.
17. **Criticality Level**: Enterprise.
18. **Deployment Edition**: Hospital, Enterprise, AI Editions.

### Module 30 – Patient Portal & Self Service
1. **Purpose**: The patient-facing web and mobile gateway.
2. **Business Objectives**: Improve patient satisfaction and reduce administrative workload.
3. **Primary Actors**: Patients, Family Delegates.
4. **Secondary Actors**: Customer Service.
5. **Key Features**: Report vault, appointment booking, family access delegation.
6. **Major Screens**: Patient Dashboard, Report Center.
7. **Major Reports**: Portal Adoption Report.
8. **Major Database Entities**: `PatientPortalAccount`, `PatientPortalDocument`.
9. **Dependencies**: Mod 15, 16, 24, 31.
10. **Used By**: Mod 32.
11. **Security Considerations**: Strict data ownership, OTP verification.
12. **Audit Requirements**: Track report downloads.
13. **Mobile Readiness**: High (Native app target).
14. **API Readiness**: High.
15. **AI Readiness**: High (AI Health Assistant).
16. **Future Expansion**: Wearable device integration.
17. **Criticality Level**: Advanced.
18. **Deployment Edition**: Diagnostic, Hospital, Enterprise, Telemedicine, AI Editions.

### Module 31 – Appointment & Follow-Up
1. **Purpose**: Advanced scheduling, waitlists, and compliance tracking.
2. **Business Objectives**: Optimize doctor schedules and ensure clinical continuity.
3. **Primary Actors**: Appointment Desk, Call Center.
4. **Secondary Actors**: Doctors, Patients.
5. **Key Features**: Multi-channel booking, waitlist auto-promotion, follow-up planner.
6. **Major Screens**: Appointment Dashboard, Schedule Setup.
7. **Major Reports**: No-Show Report, Follow-Up Compliance.
8. **Major Database Entities**: `DoctorSchedule`, `Appointment`.
9. **Dependencies**: Mod 11, 15, 17, 30.
10. **Used By**: Mod 32.
11. **Security Considerations**: Schedule override permissions.
12. **Audit Requirements**: Track reschedules and cancellations.
13. **Mobile Readiness**: High.
14. **API Readiness**: High.
15. **AI Readiness**: High (Demand prediction).
16. **Future Expansion**: WhatsApp conversational booking.
17. **Criticality Level**: Advanced.
18. **Deployment Edition**: Clinic, Hospital, Enterprise, Telemedicine, AI Editions.

### Module 32 – Telemedicine & Virtual Care
1. **Purpose**: Integrated remote care and video consultations.
2. **Business Objectives**: Expand hospital reach and generate new revenue streams.
3. **Primary Actors**: Doctors, Patients, Telemed Coordinators.
4. **Secondary Actors**: Billing.
5. **Key Features**: Digital consent, virtual waiting room, remote prescribing.
6. **Major Screens**: Virtual Waiting Room, Consult Workspace.
7. **Major Reports**: Telemedicine Utilization Report.
8. **Major Database Entities**: `TelemedicineSession`, `TelemedicineConsent`.
9. **Dependencies**: Mod 18, 19, 30, 31.
10. **Used By**: None.
11. **Security Considerations**: Encrypted session links, recording governance.
12. **Audit Requirements**: Track join/leave times.
13. **Mobile Readiness**: High.
14. **API Readiness**: High (WebRTC).
15. **AI Readiness**: High (AI consultation summaries).
16. **Future Expansion**: Cross-border consultation governance.
17. **Criticality Level**: Enterprise.
18. **Deployment Edition**: Telemedicine, Enterprise, AI Editions.

### Module 33 – Finance & General Accounting
1. **Purpose**: Central reusable double-entry accounting engine for all editions and verticals.
2. **Business Objectives**: Fiscal control, immutable posting, and statutory statements without healthcare hard-coding in the core engine.
3. **Primary Actors**: Accountant, Finance Manager, Cashier, Auditor.
4. **Key Features**: Fiscal year/periods/lock; COA; vouchers; posting engine; reversal; GL; cash/bank; reconciliation; TB/P&L/BS/Cash Flow/Equity; party subledgers.
5. **Dependencies**: Mod 01, 01A, 02, 03, 04, 06, 07.
6. **Used By**: Mod 10 (adapter), 34, 35, 36, 38, 39, 41, 42.
7. **Status**: PLANNED / ARCHITECTURE APPROVED — NOT STARTED.
8. **Scope Document**: `docs/modules/MOD-33-Finance-General-Accounting.md`.
9. **Deployment Edition**: Recommended for healthcare; Required for Trading/Distribution/Manufacturing/Enterprise.

### Module 34 – Procurement & Supplier Management
1. **Purpose**: Procure-to-pay including suppliers, PR/PO, GRN orchestration, three-way matching, and AP.
2. **Key Features**: Quotation/comparative statement; partial receiving; inspection; supplier invoice; returns; advances; VAT; freight; landed cost; GRNI clearing (ADR-006).
3. **Dependencies**: Mod 01–04, 06, 07, 33, 35.
4. **Used By**: Mod 14, 20 (stock adapter path), 41, 42.
5. **Status**: PLANNED / ARCHITECTURE APPROVED. Scope: `docs/modules/MOD-34-Procurement-Supplier-Management.md`.

### Module 35 – Enterprise Inventory, Store & Consumption
1. **Purpose**: Single generic inventory engine for healthcare, pharmacy, trading, distribution, and manufacturing.
2. **Key Features**: Items/UOM/warehouses; batch/expiry/serial/barcode; movements; WAVG default / FIFO optional; item ledger.
3. **Dependencies**: Mod 01–04, 06, 07, 09, 33.
4. **Used By**: Mod 14, 20 (pharmacy stock adapter), 34, 36, 42.
5. **Status**: PLANNED / ARCHITECTURE APPROVED. Scope: `docs/modules/MOD-35-Enterprise-Inventory.md`.

### Module 36 – Fixed Asset, Device Maintenance & Calibration
1. **Purpose**: Asset register, capitalization, depreciation, maintenance, calibration, AMC, disposal.
2. **Dependencies**: Platform + Mod 33; optional Mod 35 for spare parts.
3. **Status**: PLANNED / ARCHITECTURE APPROVED. Scope: `docs/modules/MOD-36-Fixed-Asset-Maintenance.md`.

### Module 37 – HR & Employee Management
1. **Purpose**: Employee master and employment lifecycle (distinct from Mod 02 user identity).
2. **Dependencies**: Platform + Mod 08.
3. **Used By**: Mod 38.
4. **Status**: PLANNED / ARCHITECTURE APPROVED. Scope: `docs/modules/MOD-37-HR-Employee-Management.md`.

### Module 38 – Payroll, Benefits, Loans & Final Settlement
1. **Purpose**: Payroll run, benefits, loans/advances, payslips, final settlement; posts only via Mod 33.
2. **Dependencies**: Mod 37, 33, platform.
3. **Status**: PLANNED / ARCHITECTURE APPROVED. Scope: `docs/modules/MOD-38-Payroll-Benefits-Settlement.md`.

### Module 39 – Shareholder, Investment & Profit Distribution
1. **Purpose**: Shareholder register, capital movements, dividend declaration and payment.
2. **Dependencies**: Mod 33, platform.
3. **Status**: PLANNED / ARCHITECTURE APPROVED. Scope: `docs/modules/MOD-39-Shareholder-Profit-Distribution.md`.

### Module 40 – AI Prescription Capture
1. **Purpose**: Intelligent OCR and mapping of unstructured prescriptions.
2. **Business Objectives**: Eliminate manual data entry and prevent revenue leakage.
3. **Primary Actors**: Reception, Billing.
4. **Secondary Actors**: AI Verification Officer.
5. **Key Features**: OCR extraction, smart service mapping, duplicate detection.
6. **Major Screens**: Upload Screen, Verification Workbench.
7. **Major Reports**: AI Accuracy Report, Revenue Impact.
8. **Major Database Entities**: `AIPrescriptionCapture`, `AIInvestigationMapping`.
9. **Dependencies**: Mod 10, 15, 20.
10. **Used By**: Mod 21, 25.
11. **Security Considerations**: PHI protection in image storage.
12. **Audit Requirements**: Track human overrides of AI predictions.
13. **Mobile Readiness**: Medium (Mobile upload).
14. **API Readiness**: High.
15. **AI Readiness**: High (Core AI Module).
16. **Future Expansion**: LLM-assisted clinical interpretation.
17. **Criticality Level**: AI.
18. **Deployment Edition**: AI Edition.

### Module 41 – Budgeting, Cost Center & Financial Control
1. **Purpose**: Cost centers, projects, budgets, commitment control, actual vs budget, approval limits, cash-flow forecast.
2. **Dependencies**: Mod 33; reads Mod 34 commitments; Mod 08 for department budgets.
3. **Status**: PLANNED / ARCHITECTURE APPROVED. Scope: `docs/modules/MOD-41-Budgeting-Financial-Control.md`.

### Module 42 – Manufacturing, BOM, Production & Costing
1. **Purpose**: BOM, production orders, WIP, finished goods, labor/overhead, batch and product costing.
2. **Dependencies**: Mod 35, 33, 34, platform.
3. **Status**: PLANNED / ARCHITECTURE APPROVED. Scope: `docs/modules/MOD-42-Manufacturing-Costing.md`.
4. **Deployment Edition**: Manufacturing (Required); Enterprise (Optional).

---

## SECTION 4: MODULE GROUP SUMMARIES

*   **Foundation Modules (01-06)**: The bedrock of the SaaS platform. These modules handle multi-tenancy, security, auditing, and localization. They operate invisibly behind the scenes to keep the system secure and scalable.
*   **Master Data Modules (07-14)**: The dictionaries of the hospital. They define the physical locations, clinical departments, billable services, and healthcare inventory extension (MOD-14 over planned MOD-35).
*   **Patient Journey Modules (15-17, 31)**: Manage the patient's entry into the system, ensuring unique identification (MPI) and orchestrating their physical and digital appointments. MOD-16 is patient 360 / patient subledger UX — not General Ledger.
*   **Clinical Modules (18-20)**: The physician's digital workspace. These modules replace paper charts with structured encounters, diagnoses, and electronic prescriptions. MOD-20 pharmacy stock will use MOD-35 (no second stock engine).
*   **Diagnostic Modules (21-24)**: The Laboratory Information System (LIS). A strict pipeline from barcode generation to pathologist verification and secure report delivery.
*   **Radiology Modules (25)**: The Radiology Information System (RIS). Manages expensive imaging assets, technician workflows, and structured radiologist dictations.
*   **IPD Modules (26-29)**: The logistical and clinical management of admitted patients. Covers bed occupancy, nursing tasks, medication administration, and the complex discharge clearance process.
*   **Operational Finance Touchpoints**: Modules 10, 28, 29, and 40 contain billing, pricing, clearance, and revenue-assurance touchpoints. They later post into MOD-33 via adapters; they do not write arbitrary GL rows.
*   **Business Operations Suite (33–39, 41–42)**: **PLANNED / ARCHITECTURE APPROVED**. Reusable finance, procurement, inventory, assets, HR, payroll, shareholder, budgeting, and manufacturing. See `docs/Architecture/05-Business-Operations-Suite.md`.
*   **Patient Engagement Modules (30)**: The digital front door, empowering patients with self-service access to their health data and hospital services.
*   **Telemedicine Modules (32)**: Extends clinical care beyond the hospital walls via secure video consultations and remote prescribing.
*   **AI Modules (40)**: The intelligence layer that automates administrative burdens, starting with the conversion of unstructured prescription images into structured billing orders.

---

## SECTION 5: CROSS MODULE WORKFLOWS

### Standard OPD to Lab Workflow
```text
[15] Patient Registration
      |
      v
[31] Appointment Booking
      |
      v
[18] Doctor Encounter (Orders Lab Tests)
      |
      v
[21] Sample Collection (Generates Barcode)
      |
      v
[22] Result Entry (Machine/Manual)
      |
      v
[23] Result Verification (Pathologist)
      |
      v
[24] Report Release
      |
      v
[30] Patient Portal (Patient views PDF)
```

### Telemedicine Workflow
```text
[30] Patient Portal (Books Telemed)
      |
      v
[31] Appointment (Schedules Slot)
      |
      v
[32] Telemedicine (Digital Consent & Waiting Room)
      |
      v
[18] Encounter (Doctor documents via Video Call)
      |
      v
[19] Prescription (ePrescription generated)
      |
      v
[30] Patient Portal (Patient downloads Rx)
```

### AI Prescription Flow
```text
[30] Patient Portal (Uploads External Rx Image)
      |
      v
[40] AI Prescription Capture (OCR & Extraction)
      |
      v
[40] Smart Mapping (Maps to [10] Service Catalog)
      |
      v
[40] Verification Workbench (Human approves)
      |
      v
[21] Sample Collection (Orders automatically created)
```

### Planned Procure-to-Pay & Accounting Flow *(Architecture Approved — Not Implemented)*
```text
[34] Purchase Requisition → PO
      |
      v
[34/35] GRN (Inventory Dr / GRNI Cr via [33])
      |
      v
[34] Supplier Invoice + Three-Way Match (clear GRNI → AP via [33])
      |
      v
[34] Supplier Payment (AP Dr / Bank Cr via [33])

[10] Diagnostic Invoice/Payment ──adapter──► [33] Patient AR / Revenue / Cash
[14] Healthcare consumption ──uses──► [35] stock + [33] expense posting
[20] Pharmacy stock adapter ──uses──► [35] (no second stock engine)
```

---

## SECTION 6: MODULE DEPENDENCY HEATMAP

| Module Group | Dependency Level | Description |
| :--- | :--- | :--- |
| **Foundation (01-06)** | **Independent** | Relies on nothing. Everything relies on them. |
| **Master Data (07-14)** | **Low Dependency** | Relies only on Foundation; MOD-14 later depends on MOD-34/35. |
| **Patient Journey (15-17)** | **Medium Dependency** | Relies on Foundation and Master Data. |
| **Clinical (18-20)** | **High Dependency** | Relies on Patient Journey and Master Data. |
| **Diagnostics (21-25)** | **High Dependency** | Strict linear dependency within the group. |
| **IPD (26-29)** | **Very High Dependency**| Relies on Clinical, Master Data, and Patient. |
| **Engagement/Telemed (30-32)**| **High Dependency** | Sits on top of all clinical and diagnostic data. |
| **Business Operations (33–39, 41–42)** | **High Dependency** | Core sequence MOD-33 → MOD-35 → MOD-34; others post into MOD-33. **Planned only.** |
| **AI (40)** | **Very High Dependency**| Requires mature Master Data to map against. |

---

## SECTION 7: EDITION MAPPING

| Module | Clinic | Diagnostic | Hospital | Enterprise | Telemed | AI Ed. | Trading/Dist. *(P)* | Mfg *(P)* |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 01-06 (Foundation) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| 07-12 (Masters) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔* | ✔* |
| 13 (Ward Setup) | | | ✔ | ✔ | | ✔ | | |
| 14 (Diag Inventory) | | ✔ | ✔ | ✔ | | ✔ | | |
| 15-17 (Patient/Appt)| ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | | |
| 18-20 (Clinical) | ✔ | | ✔ | ✔ | ✔ | ✔ | | |
| 21-24 (Laboratory) | | ✔ | ✔ | ✔ | | ✔ | | |
| 25 (Radiology) | | ✔ | ✔ | ✔ | | ✔ | | |
| 26-29 (IPD) | | | ✔ | ✔ | | ✔ | | |
| 30 (Patient Portal) | | ✔ | ✔ | ✔ | ✔ | ✔ | | |
| 31 (Adv. Appt) | ✔ | | ✔ | ✔ | ✔ | ✔ | | |
| 32 (Telemedicine) | | | | ✔ | ✔ | ✔ | | |
| 33 (Finance) *(P)* | ○ | ○ | ○ | ✔ | | ✔ | ✔ | ✔ |
| 34 (Procurement) *(P)* | ○ | ○ | ○ | ✔ | | ✔ | ✔ | ✔ |
| 35 (Inventory) *(P)* | ○ | ✔ | ✔ | ✔ | | ✔ | ✔ | ✔ |
| 36 (Assets) *(P)* | ○ | ○ | ○ | ✔ | | ✔ | ○ | ✔ |
| 37–38 (HR/Payroll) *(P)* | ○ | ○ | ○ | ✔ | | ✔ | ○ | ○ |
| 39 (Shareholder) *(P)* | ○ | ○ | ○ | ○ | | | ○ | ○ |
| 40 (AI Prescription)| | | | | | ✔ | | |
| 41 (Budget) *(P)* | ○ | ○ | ○ | ✔ | | ✔ | ✔ | ✔ |
| 42 (Manufacturing) *(P)* | | | | ○ | | | | ✔ |

\* Trading/Manufacturing editions use relevant masters (branch, category, users) without full clinical packs.
*(P)* = PLANNED / ARCHITECTURE APPROVED. ○ = Optional/Recommended. ✔ = Included/Required.

---

## SECTION 8: IMPLEMENTATION PRIORITY

Based on the official Development Sequence Guide (clinical) plus Business Operations Suite phases:

*   **Phase 1 (The Bedrock)**: Modules 01, 02, 03, 04, 06.
*   **Phase 2 (The Dictionaries)**: Modules 07, 08, 09, 10, 11, 12, 13, 14, 20.
*   **Phase 3 (The Front Desk)**: Modules 15, 16, 17, 05.
*   **Phase 4 (Clinical & Diagnostics)**: Modules 18, 19, 21, 22, 23, 24, 25.
*   **Phase 5 (The Ward & Edge)**: Modules 28, 27, 26, 29, 30, 31, 32, 40.
*   **Business Operations P0 (Docs/Registry)**: Reserve MOD-33–39, 41–42 — **current documentation reservation**.
*   **Business Operations P1–P11**: MOD-33 foundation → statements + MOD-10 adapter → MOD-35 → MOD-34 → MOD-14/MOD-20 adapters → MOD-16 AR projection → MOD-36 → MOD-37/38 → MOD-41 → MOD-39 → MOD-42. See `docs/Architecture/05-Business-Operations-Suite.md`.

---

## SECTION 9: PRODUCT MATURITY MAP

*   **Foundation**: Modules 01-14. The mandatory healthcare base.
*   **Core**: Modules 15-21. The minimum viable healthcare operations.
*   **Advanced**: Modules 22-25, 30, 31. Automation and patient-facing tools.
*   **Enterprise**: Modules 26-29, 32. Complex inpatient logistics and virtual care.
*   **AI**: Module 40. Next-generation machine learning automation.
*   **Business Operations (PLANNED)**: Modules 33–39, 41–42. Architecture approved; implementation not started; not production approved.

---

## SECTION 10: CONCLUSION

The ABSHealthcareLite Functional Module Catalog demonstrates a platform of immense **breadth** (covering everything from basic OPD to complex IPD and Telemedicine) and profound **depth** (featuring enterprise-grade auditability, multi-level approvals, and strict clinical safety gates).

Our **Competitive Strengths** lie in our unified architecture. Unlike fragmented hospital systems that bolt a third-party LIS onto an EMR, ABSHealthcareLite natively integrates diagnostics, pharmacy, and patient engagement. The multi-tenant SaaS design ensures rapid scalability, while the localization engine guarantees global market readiness. 

The **Future Roadmap** is secured by an architecture that preserves current stability (SQL Server/WebForms) while explicitly paving the way for modern API-driven, mobile-first, and AI-augmented healthcare delivery.
