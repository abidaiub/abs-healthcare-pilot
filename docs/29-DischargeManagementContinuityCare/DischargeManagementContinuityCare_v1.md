## MODULE 29: Discharge Management & Continuity of Care

### 1. Executive Summary
The Discharge Management & Continuity of Care module governs the final and often most complex phase of a patient's inpatient journey. It orchestrates a multi-disciplinary clearance workflow (Clinical, Nursing, Pharmacy, and Billing) to ensure that patients are safely transitioned out of the hospital. By generating structured discharge summaries, managing take-home medications, and scheduling follow-ups, this module ensures clinical continuity while securing the hospital's financial and operational assets (bed release).

### 2. Business Purpose
To prevent revenue leakage through unbilled services, eliminate bed-blocking caused by inefficient discharge processes, and reduce clinical readmissions through structured patient education and follow-up planning. This module ensures that every discharge is medically sound, administratively approved, and financially cleared.

### 3. Actors
*   **Attending Doctor / Consultant**: Initiates the discharge, writes the summary, and prescribes take-home meds.
*   **Nurse / Ward In-Charge**: Performs final vitals, removes devices, and provides patient education.
*   **Pharmacy Officer**: Reconciles returned ward stock and dispenses take-home medications.
*   **Billing Officer**: Finalizes the bill, applies discounts, and collects payment.
*   **Medical Records Officer**: Audits the discharge summary for completeness.
*   **Discharge Coordinator**: Manages the overall flow and resolves bottlenecks.
*   **Hospital Administrator**: Monitors Length of Stay (LOS) and readmission metrics.
*   **Patient / Patient Attendant**: Receives instructions, medications, and final documents.

### 4. Functional Requirements

#### A. Discharge Request Workflow
*   **Initiation**: Doctor requests discharge, specifying category (e.g., Routine, LAMA, Absconded, Deceased).
*   **Status Lifecycle**: `Draft` → `Pending Nursing Clearance` → `Pending Pharmacy Clearance` → `Pending Billing Clearance` → `Pending Administrative Approval` → `Ready For Discharge` → `Discharged`.
*   **Exception**: `Cancelled`.

#### B. Medical Discharge Summary
*   **Content**: Admission/Final Diagnosis, Procedures, OT History, Treatment Summary, Medication Summary, Investigation Summary, Complications, Outcome.
*   **Output**: Structured, multilingual PDF generation.

#### C. Discharge Medication Plan
*   **Content**: Drug, Dose, Frequency, Duration, Instructions, Food relation, Warnings.
*   **Integration**: Links to Pharmacy for dispensing.

#### D. Follow-Up Management
*   **Scheduling**: Doctor, Department, Telemedicine, Investigation, or Procedure follow-ups.
*   **Tracking**: Monitors if the patient actually attended the follow-up.

#### E. Referral Management
*   **Types**: Another department, hospital, specialist center, rehab, or home care.
*   **Documentation**: Generates standardized referral letters.

#### F. Clearance Workflows
*   **Nursing**: Verifies final vitals, device/IV/catheter removal, dressing status, and education delivery.
*   **Pharmacy**: Reconciles unused ward medications and issues take-home drugs.
*   **Billing**: Freezes charges (Bed, Doctor, Procedure, Pharmacy). Supports Full Settlement, Partial Settlement, or Credit Discharge (Corporate/Insurance).

#### G. Bed Release Workflow
*   Upon final `Discharged` status, the system automatically triggers Module 28 to update `BedOccupancy` (End Time) and sets the bed status to `Cleaning Required`.

#### H. Continuity of Care & Readmission Analysis
*   **Tracking**: 7-day, 30-day, and 90-day readmission metrics.
*   **Linkage**: A new admission within the window is flagged and linked to the previous discharge for quality auditing.

#### I. Patient Education Management
*   **Categories**: Medication, Diet, Exercise, Wound Care, Warning Signs, Emergency Contacts.
*   **Templates**: Pre-configured, multilingual instruction blocks.

#### J. Document Generation
*   Discharge Summary, Medication Plan, Follow-Up Schedule, Referral Letter, Fitness Certificate, Medical Leave Certificate.

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: All discharge records and clearances are strictly scoped by `CompanyId`.
*   **Auditability**: 100% traceability of who cleared which department and when.
*   **Localization**: UI, discharge summaries, and education templates support EN, BN, AR, UR, HI with RTL rendering.

### 6. Screen List
1.  Discharge Dashboard (Coordinator View)
2.  Discharge Request Form (Doctor View)
3.  Clearance Tracker (Multi-department View)
4.  Discharge Summary Screen (Clinical Editor)
5.  Follow-Up & Referral Planner
6.  Readmission Analysis Screen
7.  Discharge Reporting Dashboard

### 7. Detailed ASCII Mockups
*(See `docs/29-DischargeManagementContinuityCare/Mockups/WireframeMockup.md`)*

### 8. Workflow Diagrams
*(See `docs/29-DischargeManagementContinuityCare/Mockups/ScreenFlow.md`)*

### 9. Business Rules
*   **Mandatory Approvals**: A patient cannot reach `Discharged` status until Nursing, Pharmacy, and Billing clearances are explicitly signed off.
*   **Bed Automation**: The bed must automatically become available (via housekeeping) after successful discharge.
*   **Bill Freezing**: The final bill must be frozen after discharge completion; no further charges can be added to that admission ID.
*   **Summary Revisions**: Editing a finalized discharge summary requires a formal addendum and audit logging.
*   **Controlled Medications**: Take-home narcotics require special pharmacy approval.

### 10. Database Design

**Table: DischargeRequest** (Header)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| DischargeId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | Tenant Context |
| BranchId | INT | Yes | |
| AdmissionId | BIGINT (FK)| Yes | |
| PatientId | BIGINT (FK)| Yes | |
| RequestedBy | INT (FK) | Yes | Doctor UserId |
| RequestDate | DATETIME | Yes | |
| ExpectedDate | DATETIME | No | |
| Category | NVARCHAR(50) | Yes | Routine, LAMA, Deceased |
| Status | NVARCHAR(50) | Yes | Pending Clearance, Discharged |

**Table: DischargeClearance**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ClearanceId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| DischargeId | BIGINT (FK)| Yes | |
| Department | NVARCHAR(50) | Yes | Nursing, Pharmacy, Billing |
| ClearedBy | INT (FK) | No | UserId |
| ClearedDate | DATETIME | No | |
| Status | NVARCHAR(20) | Yes | Pending, Cleared, Rejected |
| Remarks | NVARCHAR(MAX)| No | |

**Table: DischargeSummary**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| SummaryId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| DischargeId | BIGINT (FK)| Yes | |
| AdmissionDiag| NVARCHAR(MAX)| Yes | |
| FinalDiag | NVARCHAR(MAX)| Yes | |
| TreatmentSum | NVARCHAR(MAX)| Yes | |
| Complications| NVARCHAR(MAX)| No | |
| Outcome | NVARCHAR(100)| Yes | Improved, Stable, Expired |

**Table: DischargeMedication**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| MedId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| DischargeId | BIGINT (FK)| Yes | |
| ItemId | BIGINT (FK)| Yes | Link to Pharmacy Master |
| Dose | NVARCHAR(50) | Yes | |
| Frequency | NVARCHAR(50) | Yes | |
| DurationDays | INT | Yes | |
| Instructions | NVARCHAR(200)| No | |

**Table: DischargeFollowUp**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| FollowUpId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| DischargeId | BIGINT (FK)| Yes | |
| FollowUpType | NVARCHAR(50) | Yes | Doctor, Investigation |
| TargetDate | DATE | Yes | |
| DoctorId | INT (FK) | No | |
| IsAttended | BIT | Yes | Defaults to 0 |

**Table: DischargeReferral**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ReferralId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| DischargeId | BIGINT (FK)| Yes | |
| ReferralType | NVARCHAR(50) | Yes | Hospital, Rehab, HomeCare |
| TargetEntity | NVARCHAR(200)| Yes | Name of hospital/doctor |
| Reason | NVARCHAR(MAX)| Yes | |

**Table: DischargeEducation**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| EduId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| DischargeId | BIGINT (FK)| Yes | |
| Category | NVARCHAR(50) | Yes | Diet, Wound Care |
| Instructions | NVARCHAR(MAX)| Yes | |

**Table: ReadmissionTracking**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| TrackId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| PatientId | BIGINT (FK)| Yes | |
| PrevDischargeId| BIGINT (FK)| Yes | |
| NewAdmissionId| BIGINT (FK)| Yes | |
| DaysBetween | INT | Yes | Calculated |
| IsUnplanned | BIT | Yes | 1 if emergency, 0 if scheduled |

*Note: All tables include `CreatedBy`, `CreatedDate`, `ModifiedBy`, `ModifiedDate`, `IsActive`.*
*Index Recommendations: Non-clustered indexes on `CompanyId`, `AdmissionId`, `PatientId`, and `Status`.*

### 11. Reports
*   **Discharge Register**: Chronological log of all discharged patients.
*   **Daily/Department/Doctor Discharge Report**: Volume analytics.
*   **Average Length of Stay (ALOS) Report**: Efficiency metric by ward/doctor.
*   **Readmission Analysis Report**: Quality metric tracking 7/30/90-day returns.
*   **Pending Clearance Report**: Bottleneck analysis (e.g., waiting on Pharmacy).
*   **Follow-Up Compliance Report**: Percentage of patients who returned as instructed.

### 12. Dashboard Cards
*   Pending Discharges (Count)
*   Discharged Today (Count)
*   Clearance Bottlenecks (Alert)
*   Average LOS (Days)
*   30-Day Readmission Rate (%)
*   Pending Follow-ups (Count)

### 13. Acceptance Criteria
*   **Functional Completion**: A doctor can initiate a discharge, write a summary, and prescribe take-home meds in a single workflow.
*   **Clinical Safety**: The system forces nursing staff to verify IV/catheter removal before granting clearance.
*   **Financial Controls**: The system hard-blocks the final discharge if the Billing Clearance is pending.
*   **Audit Compliance**: Every clearance signature (Nursing, Pharmacy, Billing) is permanently timestamped.
*   **Multi-tenant Readiness**: Discharge templates and clearance rules are isolated by `CompanyId`.
*   **Localization Readiness**: Discharge instructions can be printed in Arabic/Urdu (RTL) or English/Bangla (LTR).

### Appendix A – Enterprise Enhancements

#### 1. Care Pathway Automation
*   **Architecture**: Future integration where specific diagnoses (e.g., Heart Failure) automatically populate the Discharge Summary, Medication Plan, and Education templates based on standardized clinical guidelines.

#### 2. AI Readmission Risk Prediction
*   **Architecture**: Machine learning models analyzing patient age, comorbidities, LOS, and lab results to assign a "Readmission Risk Score" at the time of discharge, prompting enhanced follow-up protocols for high-risk patients.

#### 3. Home Care Integration
*   **Architecture**: API endpoints to seamlessly transmit the discharge summary and medication plan to affiliated Home Nursing or Physiotherapy agencies.

#### 4. Remote Patient Monitoring Integration
*   **Architecture**: Linking the discharge record to IoT devices (e.g., continuous glucose monitors, BP cuffs) sent home with the patient, feeding data back into the Continuity of Care Registry.

#### 5. Insurance Discharge Authorization Workflow
*   **Architecture**: A specialized clearance step requiring the Billing Officer to receive a final "Discharge Approval Code" via API from the TPA/Insurance provider before the patient can physically leave.

#### 6. National Health Information Exchange Integration
*   **Architecture**: HL7/FHIR compliance to automatically push standardized discharge summaries (e.g., CCDA format) to national or regional health registries.

#### 7. Chronic Disease Continuity Registry
*   **Architecture**: A longitudinal tracking database for patients with conditions like Diabetes or CKD, ensuring their inpatient discharge seamlessly updates their outpatient chronic care management plan.

#### 8. Population Health Analytics
*   **Architecture**: Data warehousing strategies to aggregate discharge outcomes, readmission rates, and geographic data to identify community health trends and hospital performance metrics.

### Appendix B – Recommended Enterprise Additions

#### 1. Discharge Against Medical Advice Governance
*   **Overview**: Comprehensive support for non-routine discharges including DAMA (Discharge Against Medical Advice), LAMA (Leave Against Medical Advice), Absconded Patient, Expired / Death Discharge, Transfer Out, and Referral Transfer.
*   **Business Value**: Critical for legal safety, accreditation compliance, insurance claim defense, and accurate mortality/morbidity analytics.
*   **Required Fields**: `CompanyId`, `DischargeType`, `DischargeReason`, `RiskExplainedBy`, `RiskExplainedTo`, `WitnessName`, `WitnessContact`, `ConsentSigned` (BIT), `LegalNotes`, `FinalDoctorSignature`, `FinalNurseSignature`.

#### 2. Bed Turnaround & Housekeeping Workflow
*   **Overview**: Extends the bed release process. After discharge completion, the bed should not directly become `Available`.
*   **Workflow**: `Discharged` → `Housekeeping Pending` → `Cleaning In Progress` → `Sanitized` → `Bed Available`.
*   **Connection**: Integrates directly with **Module 28: Bed, Ward, Room & Occupancy Management** to ensure accurate capacity tracking and infection control.
*   **Required Fields**: `CompanyId`, `HousekeepingStatus`, `CleaningStartedAt`, `CleaningCompletedAt`, `SanitizedBy`, `BedReleasedAt`, `TurnaroundMinutes`.

#### 3. Insurance / Corporate Discharge Authorization
*   **Overview**: Specialized clearance workflow for insured and corporate patients requiring third-party payment validation.
*   **Features**: Pre-authorization check, final authorization, claim document checklist, approval reference number, short approval handling, patient vs. insurance payable amounts, and corporate credit discharge.
*   **Required Fields**: `CompanyId`, `PayerType`, `InsuranceProviderId`, `CorporateClientId`, `AuthorizationStatus`, `AuthorizationReferenceNo`, `ClaimSubmittedDate`, `ClaimApprovedAmount`, `PatientPayableAmount`, `PayerPayableAmount`.

#### 4. Mortality / Expired Patient Workflow
*   **Overview**: A dedicated, sensitive, and legally compliant workflow for expired patient discharges.
*   **Features**: Death declaration, death certificate generation, cause/time of death, attending doctor confirmation, body handover record, medico-legal case (MLC) flag, and police notification tracking.
*   **Required Fields**: `CompanyId`, `IsExpired` (BIT), `DeathDeclaredAt`, `DeathDeclaredByDoctorId`, `CauseOfDeath`, `DeathCertificateNo`, `BodyHandoverTo`, `BodyHandoverTime`, `IsMedicoLegalCase` (BIT), `PoliceNotified` (BIT).

#### 5. Electronic Signature & Final Locking
*   **Overview**: Enforces a final locking rule after discharge completion to prevent unauthorized retrospective changes to the medical or financial record.
*   **Features**: Doctor, Nurse, Billing Officer, and Pharmacy e-signatures; Admin final approval; and a versioned revision request workflow if post-lock edits are clinically necessary.
*   **Required Fields**: `CompanyId`, `IsFinalLocked` (BIT), `FinalLockedAt`, `FinalLockedBy`, `RevisionRequestedBy`, `RevisionReason`, `RevisionApprovedBy`, `RevisionApprovedAt`.

#### 6. Post-Discharge Communication Log
*   **Overview**: Tracks all multi-channel communication with the patient or their family after discharge.
*   **Channels**: SMS, WhatsApp, Email, Phone call, Portal notification.
*   **Use Cases**: Follow-up reminders, medicine instruction reminders, report availability alerts, emergency warnings, and readmission risk follow-ups.
*   **Required Fields**: `CompanyId`, `CommunicationType`, `RecipientType`, `RecipientContact`, `MessageTemplateId`, `SentStatus`, `SentAt`, `DeliveryStatus`, `FailedReason`.

#### 7. Discharge Quality Indicators
*   **Overview**: Key performance and quality metrics derived from the discharge lifecycle.
*   **Metrics**: Average discharge processing time, Billing clearance delay, Pharmacy clearance delay, Nursing clearance delay, Bed turnaround time, 7-day readmission rate, 30-day readmission rate, DAMA/LAMA percentage, Mortality rate, Follow-up compliance rate.
*   **Note**: These indicators will form the foundation for future hospital executive dashboards, accreditation reporting (e.g., JCI, NABH), and AI-driven operational analytics.