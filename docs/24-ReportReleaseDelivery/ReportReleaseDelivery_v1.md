## MODULE 24: Report Release & Delivery

### 1. Executive Summary
The Report Release & Delivery module governs the final stage of the diagnostic lifecycle. It ensures that clinically approved reports are securely released, accurately delivered to the correct patient or authorized representative, and made available across digital channels (Patient Portal, Email, WhatsApp). The module enforces strict access controls, tracks every view and reprint, and provides mechanisms for verifying report authenticity via QR codes.

### 2. Business Purpose
To protect patient confidentiality and ensure the secure, timely dissemination of diagnostic information. By centralizing the release workflow, this module prevents the unauthorized handover of sensitive data, enforces billing/quality holds, and maintains a comprehensive medico-legal audit trail of who accessed or printed a report and when.

### 3. Actors
*   **Report Release Officer**: Manages the physical and digital release queue.
*   **Reception User**: Hands over physical reports at the counter.
*   **Lab Supervisor**: Oversees release blocks and reprints.
*   **Doctor**: Accesses released reports via the Doctor Portal.
*   **Patient**: Accesses reports via the Patient Portal or physically.
*   **Patient Representative**: Authorized individual collecting the report.
*   **Tenant Admin**: Configures delivery methods and billing hold rules.
*   **Host Admin**: Manages global portal infrastructure.

### 4. Functional Requirements

#### A. Report Status Lifecycle
*   `Draft` → `Approved` (Clinical) → `Release Pending` → `Released` → `Viewed` / `Downloaded`.
*   **Exception Statuses**: `Reprinted`, `Revoked`, `Corrected After Release`.

#### B. Report Release Governance
*   Reports must be explicitly authorized for release.
*   **Tracking**: Release Timestamp, Released By (User ID), Release Branch, Release Method.
*   **Release Methods**: Counter Collection, Patient Portal, Email, SMS Notification, WhatsApp Notification, Doctor Portal, API Integration.

#### C. Patient Identity Verification
*   Before counter delivery, the user must verify identity via:
    *   Registration Number / Patient ID.
    *   Mobile Number Verification.
    *   Future: OTP Verification.
    *   Representative Authorization (logging the name/ID of the person collecting).

#### D. Report Delivery Methods
*   **Counter Delivery**: Physical printout handed to patient.
*   **Patient Portal Download**: Secure PDF download.
*   **Email/WhatsApp Delivery**: Secure link or encrypted PDF sent to registered contacts.
*   **Doctor / Corporate Client Delivery**: Automated routing to referring entities.

#### E. Reference Doctor Delivery
*   Referring doctors receive a copy or a secure, expiry-controlled access link to view their patients' reports.

#### F. Patient Portal Integration
*   Allows patients to Login, View Reports, Download PDFs, and see their Release History.

#### G. QR Code Verification
*   Every printed/PDF report includes a unique QR code.
*   Scanning the QR code opens a verification URL to confirm the report's authenticity against the central database.

#### H. Report Correction After Release
*   If an error is found post-release:
    *   `Released Report` → `Correction` → `New Version` → `Release Again`.
    *   The system maintains the Original Version, the Corrected Version, and the Correction Reason. The new report must clearly state "Amended Report".

#### I. Reprint Governance
*   Any printing after the initial release is considered a reprint.
*   **Tracking**: Reprint Count, Reprint Reason, Reprinted By, Reprint Timestamp.

#### J. Release Blocking Matrix
*   The system hard-blocks release if any of the following are true:
    *   Verification/Approval is Pending.
    *   Critical Notification is Pending (unacknowledged).
    *   Quality Hold is Active.
    *   Correction is Pending.
    *   Billing Hold is Active (e.g., unpaid balance - configurable per tenant).

#### K. Digital Signature Foundation (Architecture Only)
*   Future support for embedding Pathologist Signatures, Digital Seals, and cryptographic Signature Timestamps into the PDF.

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: All reports, portals, and QR links are strictly scoped by `CompanyId`.
*   **Auditability**: 100% traceability of Viewed By, Downloaded By, Released By, Shared By, and Reprinted By.
*   **Localization**: Report templates and portal UI support EN, BN, AR, UR, HI with RTL rendering.

### 6. Screen List
1.  Release Dashboard
2.  Release Queue
3.  Report Release Screen (Authorization)
4.  Patient Delivery Screen (Counter Handover)
5.  Portal Access Screen (Patient View)
6.  Reprint Screen (Governance)
7.  QR Verification Screen (Public/Secure)
8.  Mobile Patient View

### 7. Detailed ASCII Mockups
*(See `docs/24-ReportReleaseDelivery/Mockups/WireframeMockup.md`)*

### 8. Workflow Diagrams
*(See `docs/24-ReportReleaseDelivery/Mockups/ScreenFlow.md`)*

### 9. Business Rules
*   **CompanyId Mandatory**: No report exists or can be verified outside a tenant context.
*   **Block Enforcement**: The Release Blocking Matrix supersedes all manual release attempts.
*   **Immutable Audit**: Access and reprint logs cannot be deleted or altered.
*   **Correction Transparency**: A corrected report must never hide the fact that it was amended.

### 10. Database Design

**Table: ReportRelease**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ReleaseId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | Tenant Context |
| ResultId | BIGINT (FK)| Yes | Link to Approved LabResult |
| OrderId | BIGINT (FK)| Yes | Link to Investigation Order |
| Status | NVARCHAR(20) | Yes | Release Pending, Released, Revoked |
| ReleasedBy | INT (FK) | No | UserId |
| ReleasedOn | DATETIME | No | |
| ReleaseBranchId| INT (FK) | No | |

**Table: ReportDelivery**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| DeliveryId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ReleaseId | BIGINT (FK)| Yes | |
| DeliveryMethod | NVARCHAR(50) | Yes | Counter, Email, Portal, WhatsApp |
| DeliveredTo | NVARCHAR(100)| Yes | Patient, Representative Name |
| DeliveredBy | INT (FK) | No | System or UserId |
| DeliveredOn | DATETIME | Yes | |
| ReferenceDetails| NVARCHAR(200)| No | Email address, Phone number, ID |

**Table: ReportAccessAudit**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| AccessId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ReleaseId | BIGINT (FK)| Yes | |
| AccessedBy | NVARCHAR(100)| Yes | UserId, PatientId, or IP Address |
| AccessMethod | NVARCHAR(50) | Yes | Portal View, PDF Download, Doctor Portal |
| AccessTime | DATETIME | Yes | |
| IPAddress | NVARCHAR(50) | No | |

**Table: ReportReprintAudit**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ReprintId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ReleaseId | BIGINT (FK)| Yes | |
| ReprintedBy | INT (FK) | Yes | UserId |
| ReprintTime | DATETIME | Yes | |
| Reason | NVARCHAR(200)| Yes | Patient lost copy, Doctor request |

**Table: ReportCorrectionAudit**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| CorrectionId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| OriginalReleaseId| BIGINT (FK)| Yes | |
| NewReleaseId | BIGINT (FK)| Yes | |
| CorrectedBy | INT (FK) | Yes | UserId |
| CorrectionTime | DATETIME | Yes | |
| Reason | NVARCHAR(MAX)| Yes | |

**Table: ReportVerificationLink**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| LinkId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ReleaseId | BIGINT (FK)| Yes | |
| VerificationToken| NVARCHAR(100)| Yes | Unique hash for QR code |
| ExpiryDate | DATETIME | No | |
| IsRevoked | BIT | Yes | |

**Table: PatientPortalReportAccess**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| PortalAccessId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| PatientId | BIGINT (FK)| Yes | |
| ReleaseId | BIGINT (FK)| Yes | |
| IsVisible | BIT | Yes | Controlled by billing/holds |
| FirstViewedOn | DATETIME | No | |

*Note: All tables include `CreatedBy`, `CreatedOn`, `ModifiedBy`, `ModifiedOn`, `IsActive`.*
*Index Recommendations: Non-clustered indexes on `CompanyId`, `ResultId`, `PatientId`, and `VerificationToken`.*

### 11. Reports
*   **Report Release Report**: Volume of reports released by branch/user.
*   **Delivery Report**: Breakdown by delivery method (Counter vs Digital).
*   **Portal Access Report**: Analytics on patient portal engagement.
*   **Reprint Report**: Audit of all reprints and justifications.
*   **Correction Report**: Log of reports amended post-release.
*   **QR Verification Report**: Analytics on external authenticity checks.

### 12. Dashboard Cards
*   Pending Release (Count)
*   Released Today (Count)
*   Portal Downloads (Count)
*   Reprints (Count / Alert)
*   Corrections (Count / Alert)
*   Delivery Failures (e.g., Email/SMS bounce)

### 13. Acceptance Criteria
*   **Secure Release**: A report cannot be released if the Release Blocking Matrix conditions (e.g., unpaid bill) are met.
*   **Patient Verification**: Counter delivery requires logging the identity of the person receiving the report.
*   **Portal Delivery**: Approved and released reports are immediately visible in the Patient Portal.
*   **Reprint Governance**: Printing a report a second time forces the user to enter a reprint reason.
*   **Correction Governance**: Correcting a released report generates a new version and updates the portal, maintaining the audit trail.
*   **Auditability**: Every view, download, and print is logged with a timestamp and actor.
*   **SaaS Tenant Isolation**: Verification tokens and portal access are strictly isolated by `CompanyId`.
*   **Multilingual Readiness**: Report templates support dynamic rendering in EN, BN, AR, UR, HI.

### Appendix A – Enterprise Report Governance

#### 1. Watermark Roadmap
*   **Architecture**: Dynamic PDF generation that overlays contextual watermarks (e.g., "DRAFT", "REPRINT", "AMENDED", or "UNOFFICIAL COPY") based on the `ReportRelease` status and the user downloading it.

#### 2. Anti-forgery Roadmap
*   **Architecture**: Advanced PDF security settings to prevent text editing, copying, or unauthorized manipulation of the digital document after it leaves the system.

#### 3. Tamper Detection Roadmap
*   **Architecture**: Implementing cryptographic hashing (e.g., SHA-256) of the report data at the time of release. The QR Verification portal will re-hash the data and compare it to ensure the printed values have not been altered.

#### 4. External Verification Portal Roadmap
*   **Architecture**: A dedicated, unauthenticated web endpoint (e.g., `verify.abshealthcare.com/token`) where third parties (employers, embassies, other hospitals) can scan the QR code and view a secure, read-only summary of the authentic report to prevent fraud.

#### 5. Government Reporting Integration Roadmap
*   **Architecture**: Automated data pipelines (API/HL7) to securely transmit specific released reports (e.g., Notifiable Diseases like COVID-19, Tuberculosis) directly to national health registries or ministries of health.

#### 6. Long-term Report Archival Strategy
*   **Architecture**: Policy-driven data tiering where reports older than a configurable threshold (e.g., 5 years) are moved to cold storage (e.g., AWS S3 Glacier / Azure Archive) while maintaining metadata in the active database for legal compliance and retrieval requests.

#### 7. Report Layout Engine
*   **Architecture**: A dynamic rendering engine capable of generating pixel-perfect PDFs and direct-to-printer outputs. It separates the clinical data payload from the visual presentation layer, allowing layouts to be updated without altering the underlying medical records.

#### 8. Company Branding Engine
*   **Architecture**: Tenant-specific configuration profiles that store brand colors (primary/secondary hex codes), typography preferences, and styling rules. Ensures that a multi-tenant SaaS deployment can generate reports that look entirely bespoke to each hospital or clinic.

#### 9. Multi Logo Support
*   **Architecture**: Support for rendering multiple distinct logos on a single report layout:
    *   **Hospital Logo**: Primary brand identity.
    *   **Diagnostic Logo**: Specific laboratory or imaging center branding.
    *   **Accreditation Logo**: ISO, CAP, CLIA, or local regulatory body seals (conditionally rendered based on the department's accreditation status).

#### 10. Header & Footer Designer
*   **Architecture**: A visual or HTML-based configuration tool allowing Tenant Admins to design the top and bottom sections of the report. Supports dynamic data tags (e.g., `{{PatientName}}`, `{{Barcode}}`, `{{PageNumber}}`).

#### 11. Pad Support (Built-in & Preprinted)
*   **Architecture**: 
    *   **Built-in Pad**: The system prints the full header, footer, and logos on blank paper.
    *   **Preprinted Pad**: The system suppresses the header/footer rendering and only prints the clinical data, precisely aligned to fit within the blank space of the hospital's physical letterhead.

#### 12. Paper Size Management
*   **Architecture**: Configurable output dimensions supporting standard and custom physical media: A4, A5, Letter, Legal, and Custom dimensions (e.g., for specialized continuous feed printers).

#### 13. Print Margin Control
*   **Architecture**: Granular, millimeter-level configuration for Top, Bottom, Left, and Right margins. Crucial for aligning data correctly when using the Preprinted Pad mode.

#### 14. Multi-page Governance
*   **Architecture**: Logic to handle reports that span multiple pages. Includes automatic "Page X of Y" numbering, repeated patient demographic headers on subsequent pages, and intelligent table breaks (preventing a single test result row from being split across two pages).

#### 15. Department Specific Templates
*   **Architecture**: The layout engine dynamically selects the template based on the `DepartmentId`. A Radiology MRI report (heavy narrative, large fonts) will use a completely different visual layout than a Biochemistry report (dense tabular data).

#### 16. Signature Block Management
*   **Architecture**: Dynamic placement of authorized signatures. Supports rendering multiple signatures (e.g., Prepared By, Verified By, Approved By) side-by-side or stacked, including digitized images of the physical signatures and the signer's credentials.

#### 17. Patient / Doctor / Internal Copy Types
*   **Architecture**: The ability to print distinct versions of the same report based on the audience. 
    *   **Patient Copy**: Standard layout.
    *   **Doctor Copy**: May include additional clinical notes, historical graphs, or hide billing information.
    *   **Internal Copy**: Includes audit metadata, QC flags, and a prominent "INTERNAL USE ONLY" watermark.

#### 18. Multilingual Report Layout
*   **Architecture**: Layout engine support for bidirectional text rendering. Can generate reports entirely in RTL (Arabic/Urdu), LTR (English/Bangla/Hindi), or dual-language side-by-side formats where headers and test names appear in both English and the local language.

#### 19. Report Template Versioning
*   **Architecture**: Templates are version-controlled. When a report is released, it is permanently linked to `TemplateVersionId`. If the hospital changes its logo or layout next year, reprinting a 5-year-old report will still use the historical template, ensuring the reprint looks exactly as it did on the day of original release.