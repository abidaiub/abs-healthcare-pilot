## MODULE 25: Radiology Workflow & Imaging Management

### 1. Executive Summary
The Radiology Workflow & Imaging Management module orchestrates the complete lifecycle of radiological investigations. It bridges the gap between patient billing/ordering, physical imaging acquisition, and clinical reporting. The module ensures that imaging studies are efficiently scheduled, machine utilization is tracked, and radiologists have a structured, auditable environment to dictate, verify, and release diagnostic reports, while laying a robust architectural foundation for future PACS/DICOM integration.

### 2. Business Purpose
To streamline the heavy operational logistics of a radiology department. By managing equipment schedules, enforcing structured reporting templates, and tracking critical findings, this module minimizes patient wait times, prevents lost imaging orders, and ensures rapid turnaround times (TAT) for critical diagnostic reports.

### 3. Actors
*   **Reception User**: Books appointments and registers patient arrival.
*   **Radiology Technician (X-Ray, CT, MRI)**: Performs the physical scan and logs acquisition details.
*   **Sonographer**: Performs ultrasounds and drafts initial findings.
*   **Radiologist**: Dictates/types the clinical report and verifies findings.
*   **Consultant Radiologist**: Provides final approval for complex studies.
*   **Doctor**: Views the final report and (future) PACS viewer link.
*   **Patient**: Accesses the final text report via the portal.
*   **Tenant Admin**: Configures machines, rooms, and reporting templates.
*   **Host Admin**: Manages global modality classifications.

### 4. Functional Requirements

#### A. Supported Modalities
*   X-Ray (CR/DR)
*   Ultrasound (USG)
*   CT Scan
*   MRI
*   Mammography
*   Fluoroscopy
*   Echocardiography
*   Doppler
*   Dental Imaging (OPG/CBCT)
*   Nuclear Medicine (Future)

#### B. Radiology Order Workflow
*   `Order` → `Schedule` → `Arrival` → `Acquisition` → `Reporting` → `Verification` → `Release`.

#### C. Appointment & Scheduling
*   Complex scheduling matrices combining:
    *   **Modality Schedule**: e.g., MRI slots vs. X-Ray slots.
    *   **Room Schedule**: Physical location of the machine.
    *   **Technician Schedule**: Staff availability.
    *   **Equipment Schedule**: Machine maintenance blocks.

#### D. Radiology Status Lifecycle
*   `Ordered` → `Scheduled` → `Arrived` → `In Progress` → `Acquired` → `Reporting` → `Verified` → `Released`.
*   **Exception**: `Cancelled`.

#### E. Imaging Acquisition Tracking
*   System tracks the physical execution of the scan: Modality, Machine ID, Room, Technician ID, Start Time, End Time, and Image Count.

#### F. Radiology Reporting & Templates
*   **Formats**: Structured Reporting (discrete data fields) and Free Text Reporting.
*   **Sections**: Clinical Indication, Technique, Findings, Impression, Recommendations.
*   **Template Engine**: Pre-configured templates for common studies (e.g., Chest X-Ray Normal, USG Abdomen, CT Brain, MRI Spine) to accelerate reporting.

#### G. Critical Findings Governance
*   **Workflow**: If a radiologist flags an `Urgent` or `Critical Finding` (e.g., massive hemorrhage), the system forces a notification workflow.
*   **Tracking**: Must log Notified To, Notified By, and Notification Time before the report can be finalized.

#### H. Verification & Approval
*   Multi-level approval support (`Draft` → `Verified` → `Approved`).
*   Corrections post-approval generate a new version, preserving the original.

#### I. Future-Ready Foundations (Architecture Only)
*   **Voice Dictation**: Schema support for linking audio files and Speech-to-Text AI drafts to the report.
*   **DICOM/PACS**: Schema fields for `StudyUID`, `SeriesUID`, `ImageUID`, `PACSLink`, and `ViewerLink`. (Actual image rendering/storage is out of scope for now).
*   **Image Storage Governance**: Metadata tracking for Local Storage, Cloud Storage, and Archive Storage locations.

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: All schedules, machines, and reports are strictly scoped by `CompanyId`.
*   **Branch/Department-Aware**: An MRI at Branch A has a separate schedule and reporting queue from an MRI at Branch B.
*   **Auditability**: 100% traceability of who scheduled, acquired, reported, and verified the study.
*   **Localization**: UI and reporting templates support EN, BN, AR, UR, HI with RTL rendering.

### 6. Screen List
1.  Radiology Dashboard (Overview)
2.  Scheduling Screen (Calendar/Slot view)
3.  Acquisition Screen (Technician view)
4.  Reporting Screen (Radiologist worklist)
5.  Structured Reporting Screen (Template editor)
6.  Verification Screen (Sign-off)
7.  Critical Findings Screen (Notification log)
8.  Mobile Radiologist Review View

### 7. Detailed ASCII Mockups
*(See `docs/25-RadiologyWorkflowImagingManagement/Mockups/WireframeMockup.md`)*

### 8. Workflow Diagrams
*(See `docs/25-RadiologyWorkflowImagingManagement/Mockups/ScreenFlow.md`)*

### 9. Business Rules
*   **CompanyId Mandatory**: No study or machine exists outside a tenant context.
*   **Acquisition Gate**: A study cannot enter the `Reporting` queue until it is marked `Acquired` by a technician.
*   **Critical Alert Lock**: A report flagged with Critical Findings cannot be released until the notification is logged.
*   **Template Enforcement**: Radiologists must select a template or explicitly choose "Blank Report" to begin dictation.

### 10. Database Design

**Table: RadiologyMachine** (Master)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| MachineId | INT (PK) | Yes | Identity |
| CompanyId | INT | Yes | Tenant Context |
| BranchId | INT | Yes | |
| Modality | NVARCHAR(50) | Yes | CT, MRI, XRAY |
| MachineName | NVARCHAR(100)| Yes | e.g., GE Optima 1.5T |
| RoomNo | NVARCHAR(50) | No | |

**Table: RadiologyOrder** (Header)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| RadOrderId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| InvestigationId| BIGINT (FK)| Yes | Link to Billing Order |
| PatientId | BIGINT (FK)| Yes | |
| Modality | NVARCHAR(50) | Yes | |
| Status | NVARCHAR(20) | Yes | Ordered, Scheduled, Arrived |

**Table: RadiologySchedule**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ScheduleId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| RadOrderId | BIGINT (FK)| Yes | |
| MachineId | INT (FK) | Yes | |
| ScheduledDate | DATE | Yes | |
| StartTime | TIME | Yes | |
| EndTime | TIME | Yes | |

**Table: RadiologyStudy** (Acquisition)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| StudyId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| RadOrderId | BIGINT (FK)| Yes | |
| MachineId | INT (FK) | Yes | |
| TechnicianId | INT (FK) | Yes | |
| AcquiredStart | DATETIME | Yes | |
| AcquiredEnd | DATETIME | Yes | |
| ImageCount | INT | No | |
| Status | NVARCHAR(20) | Yes | Acquired, Reporting, Verified |

**Table: RadiologyImageReference** (Future PACS Link)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ImageRefId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| StudyId | BIGINT (FK)| Yes | |
| DicomStudyUID | NVARCHAR(100)| No | |
| ViewerUrl | NVARCHAR(500)| No | Zero-footprint viewer link |
| StorageLocation| NVARCHAR(100)| No | Local, AWS S3, VNA |

**Table: RadiologyTemplate**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| TemplateId | INT (PK) | Yes | Identity |
| CompanyId | INT | Yes | |
| Modality | NVARCHAR(50) | Yes | |
| TemplateName | NVARCHAR(100)| Yes | e.g., Normal Chest X-Ray |
| FindingsText | NVARCHAR(MAX)| Yes | Default text |
| ImpressionText | NVARCHAR(MAX)| Yes | Default text |

**Table: RadiologyReport**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ReportId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| StudyId | BIGINT (FK)| Yes | |
| Findings | NVARCHAR(MAX)| Yes | |
| Impression | NVARCHAR(MAX)| Yes | |
| Recommendations| NVARCHAR(MAX)| No | |
| IsCritical | BIT | Yes | |
| ReportedBy | INT (FK) | Yes | Radiologist |
| VerifiedBy | INT (FK) | No | Consultant |

**Table: RadiologyReportVersion** (Correction History)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| VersionId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ReportId | BIGINT (FK)| Yes | |
| OldFindings | NVARCHAR(MAX)| Yes | |
| NewFindings | NVARCHAR(MAX)| Yes | |
| Reason | NVARCHAR(200)| Yes | |

**Table: RadiologyCriticalNotification**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| NotificationId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ReportId | BIGINT (FK)| Yes | |
| NotifiedTo | NVARCHAR(100)| Yes | Doctor Name |
| NotifiedBy | INT (FK) | Yes | |
| NotificationTime| DATETIME | Yes | |

*Note: All tables include `CreatedBy`, `CreatedOn`, `ModifiedBy`, `ModifiedOn`, `IsActive`.*
*Index Recommendations: Non-clustered indexes on `CompanyId`, `PatientId`, `MachineId`, `Status`, and `ScheduledDate`.*

### 11. Reports
*   **Scheduled Studies Report**: Daily roster for technicians.
*   **Completed Studies Report**: Volume of scans acquired.
*   **Pending Reporting Report**: Aging report of unread scans (TAT tracking).
*   **Critical Findings Report**: Audit of urgent notifications.
*   **Radiologist Productivity Report**: Number of reports dictated/verified per user.
*   **Machine Utilization Report**: Uptime and scan volume per machine (ROI tracking).

### 12. Dashboard Cards
*   Scheduled Today (Count)
*   Waiting Patients (Count - Arrived but not acquired)
*   Reporting Queue (Count - Acquired but not reported)
*   Critical Findings (Count / Alert)
*   Released Reports (Count)
*   Machine Utilization (Percentage/Chart)

### 13. Acceptance Criteria
*   **Scheduling Workflow**: A billed MRI order can be assigned a specific time slot on a specific machine.
*   **Acquisition Workflow**: Technicians can mark a scheduled patient as `Arrived` and then `Acquired`, moving them to the radiologist's queue.
*   **Reporting Workflow**: Radiologists can load a predefined template (e.g., Normal Chest) and edit the text to generate a report.
*   **DICOM/PACS Readiness**: The database schema includes fields for Study UIDs and external viewer URLs without requiring immediate implementation.
*   **Auditability**: Every status change (Scheduled, Acquired, Reported, Verified) logs the User ID and Timestamp.
*   **Multi-level Approval**: A junior radiologist can draft a report that requires verification by a Consultant Radiologist before release.
*   **SaaS Tenant Isolation**: Machine lists, templates, and reports are strictly isolated by `CompanyId`.
*   **Multilingual Readiness**: Findings and Impressions support RTL text entry for Arabic/Urdu reporting.

### Appendix A – Enterprise Imaging Governance

#### 1. PACS Integration Roadmap
*   **Architecture**: Future bidirectional HL7/DICOM integration where the ERP sends an ORM (Order Message) to the PACS to create a DICOM worklist, and the PACS returns an ORU (Observation Result) containing the Study UID and image links once the scan is complete.

#### 2. Vendor Neutral Archive (VNA) Roadmap
*   **Architecture**: Strategy to decouple image storage from the viewing software. The ERP will store references to a central VNA, allowing the hospital to switch PACS vendors in the future without migrating petabytes of historical image data.

#### 3. Teleradiology Workflow
*   **Architecture**: Secure routing rules to assign specific studies (e.g., after-hours CT Brains) to external, remote radiologists. Includes temporary RBAC (Role-Based Access Control) granting the external user access only to their assigned reporting queue.

#### 4. External Consultant Reporting
*   **Architecture**: Similar to Teleradiology, but designed for highly specialized second opinions (e.g., a complex Neuro-MRI sent to an external specialist). The system manages the secure sharing of the viewer link and the ingestion of the external consultant's PDF report.

#### 5. AI Imaging Assistance Roadmap
*   **Architecture**: Future integration with AI diagnostic engines (e.g., Aidoc, Zebra Medical). The system will receive AI-generated bounding boxes, risk scores, and draft text, presenting them to the radiologist as a "pre-read" overlay during the reporting phase.

#### 6. Long-Term Image Retention Strategy
*   **Architecture**: Policy-driven lifecycle management for heavy DICOM files. E.g., Keep images on fast local SSDs for 6 months, move to cloud object storage for 5 years, and then transition to deep archive (Glacier) for 10+ years, while keeping the text report immediately accessible in the active database.

#### 7. Contrast Media Governance
*   **Architecture**: Structured tracking during the Acquisition phase for any contrast agents administered. Includes fields for Contrast Type, Volume (ml), Lot Number, Administration Route (IV, Oral), eGFR pre-check validation, and a mandatory log for any adverse allergic reactions.

#### 8. Radiation Dose Tracking
*   **Architecture**: Automated or manual logging of radiation exposure metrics per study (e.g., CTDIvol, DLP for CT scans; Fluoroscopy time). Essential for cumulative patient dose monitoring and compliance with ALARA (As Low As Reasonably Achievable) safety standards.

#### 9. Image Media Delivery (CD/USB/Download)
*   **Architecture**: Workflow to manage patient requests for physical or digital copies of their raw DICOM images. Includes tracking media burning (CD/DVD/USB), logging the handover for audit purposes, and integrating with the billing module to charge for the physical media if applicable.

#### 10. Radiology Addendum Workflow
*   **Architecture**: Distinct from a "Correction" (which fixes an error), an Addendum allows a radiologist to append supplementary findings or post-operative correlations to an already verified and released report. The original text remains locked, and the addendum is date/time stamped below it.

#### 11. External Teleradiology SLA Tracking
*   **Architecture**: Specialized reporting and alert mechanisms for outsourced imaging reads. Tracks the timestamp when the image was transmitted to the external partner versus when the final report was returned. Includes automated escalation triggers if the external partner breaches their contractual Turnaround Time (TAT) SLA.