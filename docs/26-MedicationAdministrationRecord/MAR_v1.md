## MODULE 26: Medication Administration Record (MAR)

### 1. Executive Summary
The Medication Administration Record (MAR) module is the clinical source of truth for all medications given to a patient during their care encounter. While a prescription represents the doctor's intent and pharmacy dispensing represents inventory movement, the MAR represents the actual execution of care. This module enforces the "Rights of Medication Administration," governs missed or delayed doses, and provides a strict, immutable audit trail for nursing staff.

### 2. Business Purpose
To ensure patient safety and clinical compliance by providing nurses with a clear, scheduled view of what medications are due, when, and via what route. By enforcing mandatory documentation for missed doses, adverse events, and PRN (as needed) effectiveness, this module significantly reduces medication errors and protects the hospital against medico-legal liabilities.

### 3. Actors
*   **Staff Nurse**: Primary user executing and documenting medication administration.
*   **Senior Nurse / Ward In-Charge**: Oversees the ward, approves corrections, and manages shift handovers.
*   **Doctor**: Writes the original prescription, reviews the MAR, and manages clinical holds.
*   **Pharmacist**: Reviews the MAR against dispensed inventory.
*   **Patient**: The recipient of the medication.
*   **Tenant Admin**: Configures ward settings and medication schedules.
*   **Host Admin**: Manages global medication routes and safety protocols.

### 4. Functional Requirements

#### A. MAR Status Lifecycle
*   `Scheduled` → `Due` → `Administered`.
*   **Exception Statuses**: `Partially Administered`, `Missed`, `Delayed`, `Held`, `Refused`, `Cancelled`.

#### B. Medication Rights Enforcement
*   The UI must visually reinforce the core rights before administration:
    *   Right Patient
    *   Right Medication
    *   Right Dose
    *   Right Route
    *   Right Time
    *   Right Documentation
    *   *(Future: Right Reason, Right Response)*

#### C. Medication Routes
*   Support for: Oral, IV, IV Push, IV Infusion, IM, SC, Inhalation, Topical, Eye Drop, Ear Drop, Rectal, Vaginal, Feeding Tube.

#### D. Administration Workflow
*   `Doctor Order` → `MAR Schedule Generated` (System) → `Nurse Review` → `Medication Preparation` → `Administration` → `Documentation`.

#### E. Scheduled Medications
*   System automatically generates time slots based on frequency:
    *   Once, BID (Twice daily), TID (Three times), QID (Four times).
    *   Hourly, Every X Hours.
    *   Stat Dose (Immediate).
    *   PRN (As needed - no fixed schedule).

#### F. Missed Dose Governance
*   If a dose is not given, a mandatory reason must be logged:
    *   Patient Refused, Medication Unavailable, Clinical Hold, NPO (Nothing by mouth), Adverse Reaction, Physician Order Change.

#### G. PRN Medications (As Needed)
*   Requires specific tracking beyond standard administration:
    *   Reason Given (e.g., Pain level 8/10).
    *   Effectiveness Review (Follow-up assessment required after X minutes).

#### H. IV Infusion Support
*   Requires tracking of continuous administration:
    *   Start Time, Stop Time, Rate (ml/hr), Volume (ml), Completion Status.

#### I. Medication Hold Workflow
*   **Triggers**: Doctor Hold, Nurse Hold Request, Pharmacy Hold.
*   System tracks the reason and the approval/release of the hold.

#### J. Adverse Drug Event (ADE)
*   If an adverse reaction occurs during or after administration, the nurse logs:
    *   Reaction Type, Severity, Action Taken, Doctor Notified.

#### K. Allergy Safety (Architecture Only)
*   System performs an Active Allergy Check against the patient's profile before allowing administration documentation.

#### L. MAR Correction Workflow
*   `Administration Recorded` → `Correction Request` → `Approval` → `New Audit Version`.
*   The original entry is never overwritten; it is struck through and superseded by the corrected entry.

#### M. Nursing Handover Support
*   Shift-to-shift transition tool tracking: Shift, Nurse, Pending Medications, Outstanding Tasks.

#### N. Barcode Medication Administration (BCMA) (Architecture Only)
*   Future-ready schema to support scanning the Patient Wristband Barcode + Medication Barcode to electronically verify the "Rights".

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: All MAR data is strictly scoped by `CompanyId`.
*   **Ward/Bed-Aware**: MAR queues are filtered by the nurse's assigned Ward and the patient's current Bed.
*   **Auditability**: 100% traceability of who administered, witnessed, or missed a dose.
*   **Localization**: UI supports EN, BN, AR, UR, HI with RTL rendering.

### 6. Screen List
1.  MAR Dashboard (Ward Overview)
2.  Patient Medication Schedule (Grid View)
3.  Administration Screen (Documentation)
4.  Missed Dose Screen (Governance)
5.  PRN Medication Screen (Assessment)
6.  Adverse Event Screen
7.  Shift Handover Screen
8.  Mobile Nurse MAR View

### 7. Detailed ASCII Mockups
*(See `docs/26-MedicationAdministrationRecord/Mockups/WireframeMockup.md`)*

### 8. Workflow Diagrams
*(See `docs/26-MedicationAdministrationRecord/Mockups/ScreenFlow.md`)*

### 9. Business Rules
*   **CompanyId Mandatory**: No MAR record exists outside a tenant context.
*   **Missed Dose Justification**: A dose cannot be marked `Missed` or `Refused` without selecting a valid reason code and entering remarks.
*   **Immutable Audit**: Once a dose is marked `Administered`, it cannot be deleted, only corrected via the formal workflow.
*   **PRN Follow-up**: Administering a PRN medication automatically generates a pending task for Effectiveness Review.

### 10. Database Design

**Table: MedicationAdministrationSchedule** (Header/Plan)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ScheduleId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | Tenant Context |
| BranchId | INT | Yes | |
| WardId | INT | Yes | |
| PrescriptionId| BIGINT (FK)| Yes | Link to Doctor Order |
| PatientId | BIGINT (FK)| Yes | |
| ItemId | BIGINT (FK)| Yes | Link to Medication Master |
| Route | NVARCHAR(50) | Yes | Oral, IV, etc. |
| Frequency | NVARCHAR(50) | Yes | BID, TID, PRN |
| ScheduledTime | DATETIME | Yes | |
| Status | NVARCHAR(20) | Yes | Scheduled, Due, Cancelled |

**Table: MedicationAdministrationRecord** (The Execution)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| MarId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ScheduleId | BIGINT (FK)| Yes | |
| PatientId | BIGINT (FK)| Yes | |
| AdministeredBy| INT (FK) | Yes | Nurse UserId |
| AdministeredOn| DATETIME | Yes | |
| DoseGiven | DECIMAL | Yes | |
| UOM | NVARCHAR(20) | Yes | mg, ml, tab |
| Status | NVARCHAR(20) | Yes | Administered, Missed, Refused |
| Remarks | NVARCHAR(MAX)| No | |

**Table: MedicationAdministrationItem** (For IVs / Compounds)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| MarItemId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| MarId | BIGINT (FK)| Yes | |
| StartTime | DATETIME | No | For IV Infusion |
| StopTime | DATETIME | No | For IV Infusion |
| Rate | DECIMAL | No | ml/hr |
| Volume | DECIMAL | No | Total ml |

**Table: MedicationRefusal** (Missed Dose Governance)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| RefusalId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| MarId | BIGINT (FK)| Yes | |
| ReasonCode | NVARCHAR(50) | Yes | NPO, Refused, Unavailable |
| LoggedBy | INT (FK) | Yes | |
| LoggedOn | DATETIME | Yes | |

**Table: MedicationHold**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| HoldId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ScheduleId | BIGINT (FK)| Yes | |
| HoldReason | NVARCHAR(200)| Yes | |
| RequestedBy | INT (FK) | Yes | |
| ApprovedBy | INT (FK) | No | Doctor |
| Status | NVARCHAR(20) | Yes | Active, Released |

**Table: MedicationAdverseEvent**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| EventId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| MarId | BIGINT (FK)| Yes | |
| ReactionType | NVARCHAR(100)| Yes | Rash, Anaphylaxis |
| Severity | NVARCHAR(20) | Yes | Mild, Moderate, Severe |
| ActionTaken | NVARCHAR(MAX)| Yes | |
| DoctorNotified| BIT | Yes | |

**Table: MedicationAdministrationCorrection**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| CorrectionId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| MarId | BIGINT (FK)| Yes | |
| OldStatus | NVARCHAR(20) | Yes | |
| NewStatus | NVARCHAR(20) | Yes | |
| Reason | NVARCHAR(200)| Yes | |
| ApprovedBy | INT (FK) | Yes | Ward In-Charge |

**Table: MedicationAdministrationAudit**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| AuditId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| MarId | BIGINT (FK)| Yes | |
| Action | NVARCHAR(50) | Yes | Created, Updated, Corrected |
| ActorId | INT (FK) | Yes | |
| ActionTime | DATETIME | Yes | |

*Note: All tables include `CreatedBy`, `CreatedOn`, `ModifiedBy`, `ModifiedOn`, `IsActive`.*
*Index Recommendations: Non-clustered indexes on `CompanyId`, `WardId`, `PatientId`, `ScheduleId`, and `ScheduledTime`.*

### 11. Reports
*   **MAR Report**: Complete legal record of all medications given to a patient during admission.
*   **Missed Dose Report**: Analytics on why doses are being missed (e.g., pharmacy delays vs. patient refusal).
*   **Delayed Dose Report**: SLA tracking for nursing administration efficiency.
*   **PRN Medication Report**: Usage and effectiveness of as-needed medications.
*   **Adverse Event Report**: Quality control log of all medication reactions.
*   **Shift Handover Report**: Summary of pending tasks for the incoming nursing shift.

### 12. Dashboard Cards
*   Due Medications (Count - Next 2 Hours)
*   Missed Doses (Count / Alert)
*   Delayed Doses (Count / Alert)
*   PRN Given (Count requiring follow-up)
*   Adverse Events (Count)
*   Pending Holds (Count)

### 13. Acceptance Criteria
*   **Medication Safety**: System visually alerts the nurse if a patient has a documented allergy to the scheduled medication.
*   **Administration Workflow**: A nurse can successfully mark a scheduled dose as `Administered`, capturing the exact time and dose given.
*   **Missed Dose Governance**: The system prevents marking a dose as `Missed` without a valid reason code.
*   **PRN Governance**: Administering a PRN medication automatically flags the need for an effectiveness review.
*   **Adverse Event Tracking**: Nurses can log an ADE directly from the MAR, which alerts the attending physician.
*   **Auditability**: Every administration, refusal, and correction is permanently logged in `MedicationAdministrationAudit`.
*   **SaaS Tenant Isolation**: Nurses in Company A cannot view or administer medications for patients in Company B.
*   **Multilingual Readiness**: Route descriptions and refusal reasons support dynamic rendering in local languages.

### Appendix A – Enterprise Medication Safety

#### 1. BCMA Roadmap
*   **Architecture**: Barcode Medication Administration. Future integration where the nurse uses a handheld scanner or mobile device to scan the patient's wristband, then scans the medication barcode. The system electronically verifies the "Rights" before enabling the 'Administer' button.

#### 2. Smart Pump Integration Roadmap
*   **Architecture**: Future bidirectional integration with IV Smart Pumps. The MAR sends the prescribed rate/volume to the pump, and the pump sends real-time infusion data back to the MAR, preventing manual programming errors.

#### 3. Closed Loop Medication Administration
*   **Architecture**: The ultimate safety goal where the Doctor's CPOE (Computerized Physician Order Entry), the Pharmacy's Dispensing system, and the Nursing MAR are perfectly synchronized. A change in the prescription instantly updates the MAR, and a pharmacy out-of-stock instantly alerts the nurse.

#### 4. High Alert Medication Governance
*   **Architecture**: Specific configurations for dangerous drugs (e.g., Insulin, Heparin, Chemotherapy). The MAR requires a mandatory "Independent Double Check" where a second nurse must log in and verify the dose before administration can proceed.

#### 5. Controlled Drug Witness Workflow
*   **Architecture**: For narcotics (e.g., Morphine), the MAR requires a witness signature (second nurse login) for administration, and specifically for "Wastage" (e.g., if 2mg is given from a 5mg vial, the 3mg waste must be witnessed and logged).

#### 6. Joint Commission Readiness
*   **Architecture**: Database design ensures all data points required by international accreditation bodies (JCI) regarding medication management, pain reassessment (PRN follow-up), and adverse event reporting are captured and easily exportable.

#### 7. Double Witness Workflow
*   **Architecture**: A generalized framework beyond just high-alert drugs, allowing Tenant Admins to configure any specific medication, route, or patient condition (e.g., pediatric dosing) to require a mandatory secondary nurse authentication (co-signature) at the exact time of administration.

#### 8. Controlled Drug Reconciliation
*   **Architecture**: End-of-shift workflow linking the MAR directly to the ward's narcotic cabinet inventory. Ensures that the total volume of controlled substances dispensed from the cabinet exactly matches the sum of the volume administered to patients plus the volume documented as wasted.

#### 9. Medication Waste Documentation
*   **Architecture**: A dedicated workflow for logging partial dose disposal (e.g., drawing 2mg from a 5mg ampoule). Requires logging the wasted amount, the disposal method (e.g., sink, sharps container), and a witness signature to prevent drug diversion.

#### 10. Infusion Pump Monitoring Roadmap
*   **Architecture**: Beyond just sending the initial rate/volume to a smart pump, this roadmap includes continuous telemetry monitoring. The MAR will actively listen to the pump's status, logging real-time volume infused, flow rate changes, and critical pump alarms (e.g., occlusion, air-in-line) directly into the patient's electronic record.

#### 11. Bedside Mobile Administration Workflow
*   **Architecture**: A specialized, lightweight mobile interface designed specifically for tablets or ruggedized clinical smartphones. Optimized for one-handed operation at the patient's bedside, focusing purely on the BCMA scanning loop, immediate vital sign entry (e.g., BP before anti-hypertensives), and instant administration confirmation.