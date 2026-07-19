## MODULE 27: Nursing Station & Clinical Task Management

### 1. Executive Summary
The Nursing Station & Clinical Task Management module is the operational nerve center for Inpatient Department (IPD) care. It provides nursing staff with a centralized, real-time view of patient census, clinical tasks, vital signs, and doctor orders. By digitizing shift handovers, enforcing task accountability, and providing structured escalation pathways, this module ensures continuous, high-quality patient care and maintains a rigorous medico-legal audit trail of all nursing activities.

### 2. Business Purpose
To replace fragmented paper-based nursing charts and verbal handovers with a structured, digital workflow. This module ensures that no clinical task (medication, dressing, sample collection) is missed, critical vital sign changes are immediately escalated, and the transition of care between nursing shifts is seamless and fully documented.

### 3. Actors
*   **Staff Nurse**: Primary user executing tasks, entering vitals, and writing notes.
*   **Senior Nurse / Ward In-Charge**: Oversees ward operations, assigns tasks, and manages escalations.
*   **Doctor / Duty Doctor**: Issues orders, reviews vitals/notes, and responds to escalations.
*   **Pharmacist**: Coordinates with the nursing station for medication delivery.
*   **Patient**: The recipient of care.
*   **Tenant Admin**: Configures ward layouts, task templates, and escalation rules.
*   **Host Admin**: Manages global clinical standards and Early Warning Score (EWS) logic.

### 4. Functional Requirements

#### A. Ward Dashboard & Patient Census
*   **Dashboard**: Real-time overview of Occupied Beds, Vacant Beds, Pending Tasks, Due Medications, Critical Patients, Escalations, and New Admissions.
*   **Census**: List of current patients including Bed Number, Ward, Admission Date, Attending Doctor, and clinical Status.

#### B. Vitals Management
*   **Parameters**: Temperature, Pulse, Respiratory Rate, Blood Pressure, SpO2, Pain Score, Weight, Height, BMI, Blood Sugar, Glasgow Coma Scale (GCS).
*   **Status Classification**: System automatically flags vitals as `Normal`, `Abnormal`, or `Critical` based on configured thresholds.
*   **Architecture**: Must support historical trend charting (graphs).

#### C. Nursing Notes
*   **Types**: Progress Notes, Observation Notes, Shift Notes, Escalation Notes.
*   **Governance**: Notes are immutable once saved. Any corrections require an addendum, preserving the original text and audit trail.

#### D. Clinical Task Management
*   **Task Types**: Medication Task (links to MAR), Investigation Task, Sample Collection Task, Procedure Task, Dressing Task, Doctor Review Task, Discharge Task.
*   **Status Lifecycle**: `Pending` → `Assigned` → `In Progress` → `Completed`.
    *   *Exceptions*: `Cancelled`, `Escalated`.
*   **Assignment Tracking**: Assigned To (Nurse ID), Assigned By, Assigned Time, Completed Time.

#### E. Doctor Order Management
*   **Workflow**: `New Orders` (from Doctor) → `Order Acknowledgement` (by Nurse) → `Order Execution` (Task Creation) → `Order Completion`.
*   Ensures nurses explicitly acknowledge new instructions before acting on them.

#### F. Escalation Workflow
*   **Types**: Clinical Escalation (patient deterioration), Vital Escalation (critical BP), Medication Escalation (pharmacy delay), Bed Escalation (maintenance issue).
*   **Tracking**: Raised By, Assigned To (e.g., Duty Doctor), Response Time, Resolution Time.

#### G. Shift Handover
*   Structured digital handover process tracking: Shift Start, Shift End, Pending Tasks, Outstanding Medications, Critical Patients, and Special Instructions.

#### H. Nursing Checklists
*   Standardized, mandatory checklists for critical transitions: Admission Checklist, Transfer Checklist (Ward to ICU), Procedure Checklist, Discharge Checklist.

#### I. Future-Ready Foundations (Architecture Only)
*   **Early Warning Score (EWS)**: Schema support for automated calculation of NEWS2, MEWS, and Pediatric Scores based on vital sign inputs.
*   **Bedside Mobile Workflow**: API readiness for mobile vitals entry, task completion, and MAR integration at the point of care.

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: All ward data, tasks, and notes are strictly scoped by `CompanyId`.
*   **Ward/Bed-Aware**: The UI automatically filters the dashboard and task lists based on the nurse's currently assigned Ward.
*   **Auditability**: 100% traceability of who entered vitals, completed tasks, and acknowledged orders.
*   **Localization**: UI, task names, and checklists support EN, BN, AR, UR, HI with RTL rendering.

### 6. Screen List
1.  Nursing Dashboard (Ward Overview)
2.  Patient Census Screen
3.  Vitals Entry Screen (with Trend Chart)
4.  Nursing Notes Screen
5.  Clinical Task Board (Kanban style)
6.  Escalation Screen
7.  Shift Handover Screen
8.  Mobile Nursing View

### 7. Detailed ASCII Mockups
*(See `docs/27-NursingStationClinicalTaskManagement/Mockups/WireframeMockup.md`)*

### 8. Workflow Diagrams
*(See `docs/27-NursingStationClinicalTaskManagement/Mockups/ScreenFlow.md`)*

### 9. Business Rules
*   **CompanyId Mandatory**: No patient data or task exists outside a tenant context.
*   **Order Acknowledgement**: A clinical task generated from a doctor's order cannot be started until the order is digitally acknowledged by a nurse.
*   **Critical Vitals Hard-Stop**: Entering a vital sign in the `Critical` range automatically prompts the user to initiate a Clinical Escalation.
*   **Handover Enforcement**: A nurse cannot end their shift in the system without completing the digital Shift Handover protocol.

### 10. Database Design

**Table: NursingStation** (Master)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| StationId | INT (PK) | Yes | Identity |
| CompanyId | INT | Yes | Tenant Context |
| BranchId | INT | Yes | |
| WardId | INT (FK) | Yes | Link to WardMaster |
| StationName | NVARCHAR(100)| Yes | e.g., 3rd Floor East Station |

**Table: PatientVitals**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| VitalId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| PatientId | BIGINT (FK)| Yes | |
| AdmissionId | BIGINT (FK)| Yes | |
| RecordedTime | DATETIME | Yes | |
| RecordedBy | INT (FK) | Yes | Nurse UserId |
| Temperature | DECIMAL | No | |
| Pulse | INT | No | |
| BloodPressure| NVARCHAR(20) | No | e.g., 120/80 |
| SpO2 | INT | No | |
| Status | NVARCHAR(20) | Yes | Normal, Abnormal, Critical |

**Table: NursingNote**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| NoteId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| PatientId | BIGINT (FK)| Yes | |
| AdmissionId | BIGINT (FK)| Yes | |
| NoteType | NVARCHAR(50) | Yes | Progress, Observation, Shift |
| NoteText | NVARCHAR(MAX)| Yes | |
| WrittenBy | INT (FK) | Yes | |
| WrittenOn | DATETIME | Yes | |

**Table: ClinicalTask**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| TaskId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| PatientId | BIGINT (FK)| Yes | |
| TaskType | NVARCHAR(50) | Yes | Dressing, Sample, Meds |
| Description | NVARCHAR(200)| Yes | |
| DueTime | DATETIME | Yes | |
| Status | NVARCHAR(20) | Yes | Pending, In Progress, Completed |

**Table: TaskAssignment**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| AssignmentId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| TaskId | BIGINT (FK)| Yes | |
| AssignedTo | INT (FK) | Yes | Nurse UserId |
| AssignedBy | INT (FK) | Yes | Ward In-Charge |
| AssignedOn | DATETIME | Yes | |
| CompletedOn | DATETIME | No | |

**Table: DoctorOrderAcknowledgement**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| AckId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| OrderId | BIGINT (FK)| Yes | Link to Doctor Order |
| AcknowledgedBy| INT (FK) | Yes | Nurse UserId |
| AcknowledgedOn| DATETIME | Yes | |
| Remarks | NVARCHAR(200)| No | |

**Table: ClinicalEscalation**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| EscalationId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| PatientId | BIGINT (FK)| Yes | |
| EscalationType| NVARCHAR(50) | Yes | Clinical, Vital, Medication |
| RaisedBy | INT (FK) | Yes | Nurse UserId |
| RaisedOn | DATETIME | Yes | |
| AssignedTo | INT (FK) | No | Doctor UserId |
| ResolutionTime| DATETIME | No | |
| Status | NVARCHAR(20) | Yes | Open, Acknowledged, Resolved |

**Table: ShiftHandover**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| HandoverId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| WardId | INT (FK) | Yes | |
| OutgoingNurseId| INT (FK) | Yes | |
| IncomingNurseId| INT (FK) | Yes | |
| HandoverTime | DATETIME | Yes | |
| ShiftNotes | NVARCHAR(MAX)| Yes | |

**Table: NursingChecklist**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ChecklistId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| PatientId | BIGINT (FK)| Yes | |
| ChecklistType | NVARCHAR(50) | Yes | Admission, Discharge, Transfer |
| CompletedBy | INT (FK) | Yes | |
| CompletedOn | DATETIME | Yes | |
| JsonPayload | NVARCHAR(MAX)| Yes | Stores the checked items |

*Note: All tables include `CreatedBy`, `CreatedOn`, `ModifiedBy`, `ModifiedOn`, `IsActive`.*
*Index Recommendations: Non-clustered indexes on `CompanyId`, `WardId`, `PatientId`, `Status`, and `DueTime`.*

### 11. Reports
*   **Nursing Activity Report**: Volume of tasks completed per nurse.
*   **Vitals Report**: Patient vital sign history and trend analysis.
*   **Escalation Report**: Audit of critical escalations and doctor response times (SLA).
*   **Task Completion Report**: SLA tracking for task execution (e.g., time from order to sample collection).
*   **Shift Handover Report**: Legal record of care transition between shifts.
*   **Critical Patient Report**: Daily census of patients triggering EWS or vital alerts.

### 12. Dashboard Cards
*   Active Patients (Count)
*   Critical Patients (Count / Red Alert)
*   Due Medications (Count - Link to MAR)
*   Pending Tasks (Count)
*   Escalations (Count - Open/Unresolved)
*   New Orders (Count - Awaiting Acknowledgement)

### 13. Acceptance Criteria
*   **Nursing Workflow**: A nurse can view a filtered list of patients and tasks specific only to their assigned ward.
*   **Vitals Management**: Entering a BP of 70/40 automatically flags the vital as `Critical` and suggests an escalation.
*   **Task Management**: Tasks can be assigned to specific nurses, and completion timestamps are permanently logged.
*   **Escalation Workflow**: An open escalation remains highly visible on the dashboard until a doctor acknowledges and resolves it.
*   **Shift Handover**: The system generates a summary of all pending tasks and critical patients for the incoming nurse to review and accept.
*   **Auditability**: Every note, vital entry, and order acknowledgement is immutably tied to the user's ID and timestamp.
*   **SaaS Tenant Isolation**: Ward layouts, checklists, and patient data are strictly isolated by `CompanyId`.
*   **Multilingual Readiness**: Nursing notes and task descriptions support RTL text entry (Arabic/Urdu).

### Appendix A – Enterprise Nursing Governance

#### 1. NEWS2 Integration Roadmap
*   **Architecture**: National Early Warning Score 2 integration. The system will automatically calculate a clinical risk score based on the 6 physiological parameters (Respiration, SpO2, Systolic BP, Pulse, Consciousness, Temperature) entered in the Vitals screen, triggering automated clinical response pathways based on the score.

#### 2. Nursing KPI Framework
*   **Architecture**: Advanced analytics tracking Key Performance Indicators such as Task Completion TAT, Medication Administration TAT, Escalation Response Times, and Handover Compliance rates to evaluate nursing productivity and ward efficiency.

#### 3. Bedside Device Integration Roadmap
*   **Architecture**: Future HL7/IoT integration with patient monitors (e.g., Philips, GE). Vitals will flow directly from the bedside monitor into the `PatientVitals` table without manual data entry, reducing transcription errors.

#### 4. Smart Alert Engine
*   **Architecture**: A rules-based engine that pushes notifications (SMS/App Push) to the Ward In-Charge or Duty Doctor if a critical task is delayed beyond a configured threshold (e.g., Stat Medication not given within 15 minutes).

#### 5. Clinical Pathway Management
*   **Architecture**: Support for standardized, evidence-based care plans (e.g., Sepsis Pathway, Stroke Pathway). When a pathway is activated by a doctor, the system automatically generates a multi-day sequence of nursing tasks, vitals schedules, and MAR entries.

#### 6. Magnet Hospital Readiness
*   **Architecture**: Database design ensures all data points required for Magnet Recognition (nursing excellence, quality indicators, patient safety metrics) are captured and easily exportable for accreditation reporting.

#### 7. Intake & Output Chart
*   **Architecture**: A dedicated fluid balance tracking system. Nurses log all oral/IV fluid intake and urine/drainage output over a 24-hour period. The system automatically calculates the net fluid balance (positive/negative) and triggers alerts if the patient is severely dehydrated or fluid overloaded.

#### 8. Pressure Ulcer Risk Assessment
*   **Architecture**: Integration of standardized scales (e.g., Braden Scale or Waterlow Score). The system prompts nurses to assess sensory perception, moisture, activity, mobility, nutrition, and friction/shear. High-risk scores automatically generate nursing tasks for regular patient repositioning and skin care.

#### 9. Fall Risk Assessment
*   **Architecture**: Integration of standardized scales (e.g., Morse Fall Scale). Evaluates history of falling, secondary diagnoses, ambulatory aids, IV therapy, gait, and mental status. High scores automatically trigger visual indicators on the Nursing Dashboard and generate tasks for implementing fall precautions (e.g., bed rails up, bed alarm on).

#### 10. Isolation & Infection Control Flags
*   **Architecture**: Visual alerts across the Nursing Station and Patient Census for patients requiring specific isolation protocols (e.g., Contact, Droplet, Airborne). Ensures all staff are aware of required PPE (Personal Protective Equipment) before entering the room.

#### 11. Restraint Monitoring Governance
*   **Architecture**: A strict medico-legal workflow for patients placed in physical or chemical restraints. Requires logging the doctor's order, the reason for restraint, and forces mandatory, time-stamped nursing check-ins (e.g., every 15 minutes) to assess circulation, skin integrity, and the continued need for the restraint.

#### 12. Bedside Care Plan / Whiteboard Roadmap
*   **Architecture**: Future integration to cast critical, non-sensitive patient information (e.g., Attending Doctor, Diet (NPO), Fall Risk, Daily Goals) from the Nursing Station directly to a digital whiteboard or tablet mounted in the patient's room, keeping the patient and family informed.