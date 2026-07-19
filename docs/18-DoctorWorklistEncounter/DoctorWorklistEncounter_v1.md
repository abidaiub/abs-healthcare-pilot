## MODULE 18: Doctor Worklist & Clinical Encounter Management

### 1. Executive Summary
The Doctor Worklist & Clinical Encounter Management module is the clinical core of ABSHealthcareLite. It provides doctors with a centralized dashboard to manage their patient queue and a structured environment for recording clinical encounters. The module supports comprehensive assessments, vitals tracking, SOAP notes, and ICD-10 ready diagnoses, ensuring a high standard of clinical documentation and patient care.

### 2. Business Purpose
To streamline the clinical workflow for medical practitioners, ensuring that patient consultations are recorded accurately, efficiently, and securely. This module bridges the gap between administrative scheduling and clinical care, providing a seamless transition from appointment to encounter, and ultimately to prescription and investigation orders.

### 3. Actors
*   **Doctor / Consultant**: Primary user; manages worklist and records encounters.
*   **Nurse**: Records vitals and assists in clinical assessments.
*   **Reception**: Monitors patient status in the worklist.
*   **Department Manager**: Oversees departmental workload and productivity.
*   **Medical Officer**: Assists in recording history and preliminary assessments.
*   **Telemedicine Doctor**: Conducts remote consultations.

### 4. Functional Requirements

#### Doctor Worklist
*   **Queue Management**: Real-time display of Waiting, Current, Completed, and Follow-up patients.
*   **Filtering**: Advanced filters by Date, Branch, Department, Doctor, and Status.
*   **Patient Calling**: One-click action to call the next patient into the encounter.

#### Clinical Encounter
*   **Encounter Lifecycle**: Manage the transition from `Encounter Open` to `Consultation`, `Prescription`, and `Encounter Close`.
*   **Assessment**: Structured entry for Chief Complaint, History of Present Illness (HPI), Past Medical/Surgical History, Family/Social History, and Allergies.
*   **Vitals Tracking**: Capture Height, Weight, BMI, Temp, Pulse, BP, SpO2, and Pain Score.
*   **Diagnosis**: Support for Provisional and Final diagnoses with ICD-10 integration.
*   **Clinical Notes**: Standardized SOAP (Subjective, Objective, Assessment, Plan) format.
*   **Follow-up**: Integrated scheduling for follow-up visits (3, 7, 15, 30 days or custom).

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: Strict `CompanyId` scoping for all clinical data.
*   **Performance**: Rapid loading of patient history and worklists (< 500ms).
*   **Security**: Role-based access to sensitive clinical information.
*   **Mobility**: Optimized for tablet use during rounds or consultations.

### 6. Screen List
1.  **Doctor Worklist**: Main queue management dashboard.
2.  **Encounter Dashboard**: 360-degree view of the current consultation.
3.  **Vitals Entry**: Specialized screen for rapid vitals capture.
4.  **Clinical Assessment**: Multi-tab form for patient history.
5.  **Diagnosis Entry**: Searchable ICD-10 diagnosis interface.
6.  **SOAP Notes**: Rich-text or structured note entry.
7.  **Follow-up Planner**: Quick-scheduling for future visits.

### 7. Detailed ASCII Mockups

**Doctor Worklist (Desktop)**
```
--------------------------------------------------------------------------------
Doctor Worklist > Dr. Ahmed Khan | Dept: Cardiology | Date: 2026-06-07
--------------------------------------------------------------------------------
[ Status: Waiting v ] [ Branch: Main v ] [ Refresh ]

| Token | Patient Name    | Age/Sex | Type      | Status     | Action     |
|-------|-----------------|---------|-----------|------------|------------|
| 042   | John Doe        | 39/M    | OPD       | Waiting    | [Call]     |
| 043   | Jane Smith      | 28/F    | Follow-up | Waiting    | [Call]     |
| 038   | Mike Ross       | 45/M    | Telemed   | In-Consult | [Resume]   |

[ Completed Patients ] [ Emergency Queue ] [ Telemedicine Queue ]
--------------------------------------------------------------------------------
```

**Encounter Dashboard (Tablet)**
```
--------------------------------------------------------------------------------
Encounter: John Doe (P-10001) | Status: In-Consultation
--------------------------------------------------------------------------------
[ Summary ] [ Vitals ] [ Assessment ] [ Diagnosis ] [ Plan ] [ Follow-up ]
--------------------------------------------------------------------------------
Chief Complaint: [ Chest pain since yesterday...                       ]
Vitals: BP: [ 120/80 ] Pulse: [ 72 ] Temp: [ 98.6 ] SpO2: [ 98% ]
History: [ History of hypertension, non-smoker...                      ]

[ Provisional Diagnosis: I20.9 - Angina pectoris, unspecified v ]

[ Save Draft ] [ Open Prescription ] [ Close Encounter ]
--------------------------------------------------------------------------------
```

### 8. Workflow Diagrams
`Appointment` -> `Check In` -> `Encounter Open` -> `Consultation` -> `Prescription` -> `Investigation Order` -> `Follow-up` -> `Encounter Close`.

### 9. Business Rules
*   **Identity Binding**: Every encounter must have a valid `CompanyId`, `PatientId`, and `DoctorId`.
*   **Sequence Enforcement**: Encounter must be opened before issuing prescriptions or investigation orders.
*   **Immutability**: Clinical history and encounter logs cannot be physically deleted.
*   **Auditability**: All changes to diagnoses and clinical notes must be version-tracked and audited.
*   **Closure Rule**: Closing an encounter requires a completion reason or summary.

### 10. Database Design

**Table: Encounter**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| EncounterId | BIGINT (Identity)| Yes | Primary Key |
| CompanyId | INT | Yes | Tenant Context |
| PatientId | BIGINT | Yes | FK to MasterPatient |
| DoctorId | INT | Yes | FK to MasterDoctor |
| EncounterType | NVARCHAR(20) | Yes | OPD, Follow-up, etc. |
| Status | NVARCHAR(20) | Yes | Open, Closed, etc. |
| OpenDate | DATETIME | Yes | |
| CloseDate | DATETIME | No | |

**Table: EncounterVital**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| VitalId | BIGINT (Identity)| Yes | Primary Key |
| EncounterId | BIGINT | Yes | FK to Encounter |
| Temperature | DECIMAL(5,2) | No | |
| Pulse | INT | No | |
| BP_Systolic | INT | No | |
| BP_Diastolic | INT | No | |
| SpO2 | INT | No | |

### 11. Security Design
*   **Clinical Privacy**: Only the assigned doctor and authorized medical staff can view encounter details.
*   **Data Encryption**: Clinical notes and diagnoses are encrypted at rest.

### 12. Audit Design
*   **Version Tracking**: Every save of `EncounterNote` creates a new version in `EncounterHistory`.
*   **Access Audit**: Log every time a clinical record is viewed.

### 13. API Ready Design
*   Endpoints: `/api/v1/encounters/open`, `/api/v1/encounters/{id}/vitals`, `/api/v1/encounters/{id}/close`.

### 14. Mobile Ready Design
*   Responsive worklist for mobile phones.
*   Touch-optimized vitals entry for bedside nurses.

### 15. Localization Requirements
*   **Multilingual**: Support for EN, BN, AR, UR, HI.
*   **RTL Support**: Full layout mirroring for Arabic and Urdu.

### 16. Future Expansion Plan
*   **AI Ready**: Integration for clinical summaries, risk alerts, and drug interaction checks.
*   **Telemedicine**: Built-in video/audio consultation controls within the encounter dashboard.

### 17. Acceptance Criteria
*   Doctor can successfully call a patient from the worklist.
*   Vitals are correctly saved and displayed in the encounter summary.
*   Encounter cannot be closed without a diagnosis or plan.
*   All clinical notes are versioned and accessible for audit.

---

## Appendix A – Enterprise Clinical Encounter Enhancements

### 1. Functional Requirements

#### 1.1 PatientProblemList
*   **Longitudinal Problem List**: A persistent list of a patient's chronic and active medical conditions (e.g., Type 2 Diabetes, Hypertension).
*   **Problem Status**: Track status as Active, Resolved, or Inactive.
*   **Historical View**: View when a problem was first identified and by which clinician.

#### 1.2 EncounterProblemList
*   **Encounter-Specific Problems**: Link specific problems from the master `PatientProblemList` to the current clinical encounter.
*   **New Problem Identification**: Ability to add new problems discovered during the encounter directly to the master list.

#### 1.3 Clinical Alert Integration
*   **Real-time Alerts**: Display active clinical alerts (Allergies, High Risks) from Module 16 directly on the `Encounter Dashboard`.
*   **Drug-Allergy Checking**: (Future) Automated warning if a prescribed medication conflicts with the patient's allergy list.

#### 1.4 Clinical Template Library
*   **Reusable Templates**: A library of pre-defined clinical assessment and note templates for different specialties (e.g., "Cardiology Initial Consult", "Post-Op Follow-up").
*   **Template Customization**: Doctors can create and save their own personal favorite templates.

#### 1.5 EncounterAttachment
*   **Document Upload**: Securely attach external documents (Scanned Prescriptions, External Lab Reports, Imaging Photos) to the specific encounter.
*   **Multimedia Support**: Support for image and PDF attachments.

#### 1.6 Clinical Coding Roadmap
*   **Standardized Coding**: Roadmap for integrating SNOMED-CT for clinical findings and LOINC for lab observations alongside ICD-10.
*   **Search Optimization**: Semantic search for clinical codes to improve documentation speed.

#### 1.7 Doctor Dashboard KPI Section
*   **Performance Metrics**: Real-time display of:
    *   Average Consultation Time.
    *   Total Patients Seen (Today/Month).
    *   Pending Follow-ups.
    *   Encounter Completion Rate.

### 2. Updated Database Design (Additional Tables)

**Table: PatientProblem**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ProblemId | BIGINT (Identity)| Yes | Primary Key |
| PatientId | BIGINT | Yes | FK to MasterPatient |
| ProblemCode | NVARCHAR(50) | Yes | ICD-10 or SNOMED code |
| Description | NVARCHAR(250) | Yes | |
| Status | NVARCHAR(20) | Yes | Active, Resolved, Inactive |
| OnsetDate | DATE | No | |

**Table: EncounterAttachment**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| AttachmentId | BIGINT (Identity)| Yes | Primary Key |
| EncounterId | BIGINT | Yes | FK to Encounter |
| FilePath | NVARCHAR(500) | Yes | Encrypted storage path |
| FileType | NVARCHAR(50) | Yes | PDF, JPG, etc. |
| Description | NVARCHAR(200) | No | |

### 3. Updated Business Rules
*   **Problem List Synchronization**: Any problem marked as "Final Diagnosis" in an encounter should prompt the doctor to add it to the `PatientProblemList`.
*   **Alert Acknowledgment**: Critical clinical alerts must be acknowledged (clicked/dismissed) by the doctor before the encounter can be closed.
*   **Attachment Security**: All `EncounterAttachment` files must be encrypted at rest and only accessible via a signed URL.

### 4. Updated Security Design
*   **Role-Based Attachment Access**: Restrict viewing of specific attachment categories (e.g., Sensitive/Psychiatric) to the primary consultant only.
*   **Audit of Problem List**: Every addition or status change in the `PatientProblemList` must record the `DoctorId` and `EncounterId`.

### 5. Updated Acceptance Criteria
*   **Problem List**: Chronic conditions persist across different encounters and are visible in the `Summary` tab.
*   **Templates**: Selecting a "Cardiology Template" correctly pre-fills the `Subjective` and `Objective` sections of the SOAP note.
*   **KPIs**: The doctor's dashboard correctly calculates and displays the "Total Patients Seen" for the current shift.
*   **Attachments**: Uploaded images are viewable in the encounter gallery and are correctly linked to the `EncounterId`.
