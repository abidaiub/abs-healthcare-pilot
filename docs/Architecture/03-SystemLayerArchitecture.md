# ABSHealthcareLite System Layer Architecture

## 1. Executive Summary
The **ABSHealthcareLite System Layer Architecture** defines the complete structural blueprint of the platform. By adopting a strict layered architecture philosophy, the system decouples presentation, business logic, and data access. This ensures that the current ASP.NET WebForms implementation can seamlessly transition to future MVC/Core/API frameworks without rewriting the underlying business rules or database schemas. 

This document serves as the master technical blueprint, ensuring that all modules (01-32, 40, and planned Business Operations 33–39 / 41–42) adhere to the multi-tenant SaaS model, maintain rigorous data isolation, and provide a scalable foundation for a modern, AI-driven healthcare and business-operations enterprise.

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
*   **Inventory/Pharmacy Masters**: Diagnostic healthcare inventory extension (Module 14 over planned MOD-35) and medication catalogs (Module 20; pharmacy stock via planned MOD-35 adapter).

## 6. Patient Management Layer
The core demographic and identity engine.
*   **Patient Registration**: Master Patient Index (MPI) generation (Module 15).
*   **Patient Identity**: Deduplication and demographic tracking.
*   **Patient Profile**: The 360-degree clinical-financial patient view / patient subledger UX (Module 16 — not General Ledger).

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
Operational revenue cycle plus planned reusable accounting engine.
*   **Operational Billing (MOD-10)**: Diagnostic/service invoicing, collection, discounts, dues (live in pilot).
*   **Payments**: Cash, credit, and future online gateways (operational under MOD-10).
*   **General Accounting (MOD-33 — PLANNED)**: Central double-entry posting engine, COA, vouchers, GL, statements; adapters only — no arbitrary GL writes from source modules.
*   **Procurement / Inventory / Assets / HR / Payroll / Shareholder / Budget / Manufacturing (MOD-34–39, 41–42 — PLANNED)**: See `docs/Architecture/05-Business-Operations-Suite.md`.
*   **Revenue**: Corporate and insurance tracking (future enhancements on operational + GL layers).

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