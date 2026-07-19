## MODULE 32: Telemedicine & Virtual Consultation

### 1. Executive Summary
The Telemedicine & Virtual Consultation module extends the physical hospital into the digital realm. It provides a secure, integrated platform for remote patient-doctor interactions. By seamlessly connecting with the Patient Portal, Appointment Management, and Doctor Worklist modules, it ensures that virtual care is treated with the same clinical rigor, billing accuracy, and medico-legal compliance as an in-person visit.

### 2. Business Purpose
To increase healthcare accessibility, reduce unnecessary physical hospital visits, and open new revenue streams for the hospital. Telemedicine improves continuity of care for chronic patients and post-op follow-ups. This module ensures that virtual consults are legally protected via digital consent, clinically effective via integrated prescriptions/orders, and operationally efficient via virtual waiting rooms.

### 3. Actors
*   **Patient / Guardian**: Initiates booking, signs consent, uploads documents, and attends the virtual consult.
*   **Doctor**: Reviews triage data, conducts the consult, and issues remote prescriptions.
*   **Nurse / Telemedicine Coordinator**: Performs pre-consultation triage and manages the virtual waiting room.
*   **Appointment Desk Officer**: Assists with manual telemedicine bookings.
*   **Billing Officer**: Manages telemedicine consultation fees.
*   **Hospital Administrator**: Monitors virtual consult volumes and TAT.
*   **System Administrator**: Configures video provider integrations and consent templates.

### 4. Functional Requirements

#### A. Telemedicine Appointment Creation
*   **Integration**: Directly utilizes Module 31 (Appointment Management) with the `VisitType` flagged as `Telemedicine`.
*   **Booking**: Can be self-booked via Patient Portal or hospital-assisted.

#### B. Digital Telemedicine Consent
*   **Mandatory Gate**: The patient cannot enter the Virtual Waiting Room until they digitally accept:
    *   Telemedicine Consent (acknowledging limitations of remote care).
    *   Privacy/Recording Consent (if applicable).
*   **Tracking**: Consent version, accepted timestamp, and IP address.

#### C. Virtual Waiting Room
*   **Patient View**: Displays queue status, estimated wait time, and connection readiness.
*   **Coordinator View**: Allows triage, no-show marking, and manual queue adjustments.

#### D. Video / Audio Consultation Readiness (Architecture)
*   **Integration Support**: Schema designed to store external meeting links (e.g., Zoom, Google Meet) or future WebRTC session tokens.
*   **Modes**: Video, Audio-only, or Secure Chat.

#### E. Telemedicine Encounter (Doctor Workspace)
*   **Clinical Tools**: Unified view of patient profile, past prescriptions, and uploaded reports.
*   **Outputs**: Doctor can record complaints, diagnosis, consultation notes, issue ePrescriptions, order investigations, and recommend follow-ups.

#### F. Pre-Consultation Triage
*   **Workflow**: A coordinator can interact with the patient before the doctor joins to collect chief complaints, home vitals (if available), and verify uploaded documents.

#### G. Patient Document Upload
*   **Capabilities**: Patient can upload past reports, photos (e.g., dermatology), or insurance docs via the portal before the consult.

#### H. Remote Prescription & Investigation Order
*   **Integration**: Seamlessly connects to Module 19 (Prescription) and Module 20 (Pharmacy). Generates a multilingual PDF prescription accessible immediately in the Patient Portal.

#### I. Emergency Escalation
*   **Safety Protocol**: If red flags are identified during triage or consult, the system supports an immediate escalation workflow to advise an ER visit and convert the session to a physical referral.

#### J. Recording & Storage Governance
*   If video recording is enabled by the tenant: requires explicit consent, strict access restrictions, defined retention periods, and legal hold capabilities.

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: All sessions, recordings, and consents are strictly scoped by `CompanyId`.
*   **Auditability**: 100% traceability of session joins, leaves, consent agreements, and prescription issuances.
*   **Localization**: Consent forms, UI, and prescriptions support EN, BN, AR, UR, HI with RTL rendering.

### 6. Screen List
1.  Telemedicine Dashboard (Coordinator View)
2.  Patient Virtual Waiting Room
3.  Doctor Telemedicine Worklist
4.  Pre-Consultation Triage Screen
5.  Virtual Consultation Screen (Doctor Workspace)
6.  Document Upload & Review Screen
7.  Telemedicine Billing Screen
8.  Follow-Up & Prescription Summary Screen
9.  Emergency Escalation Screen
10. Recording & Consent Management Screen

### 7. Detailed ASCII Mockups
*(See `docs/32-TelemedicineVirtualConsultation/Mockups/WireframeMockup.md`)*

### 8. Workflow Diagrams
*(See `docs/32-TelemedicineVirtualConsultation/Mockups/ScreenFlow.md`)*

### 9. Business Rules
*   **Consent Mandate**: A telemedicine session URL cannot be generated or accessed until the `TelemedicineConsent` is digitally signed.
*   **Data Isolation**: A patient can only access the session link tied to their specific `PatientId` and `AppointmentId`.
*   **Emergency Conversion**: Converting a telemedicine visit to an emergency physical visit automatically waives the telemedicine fee (configurable) and alerts the ER desk.
*   **Prescription Linkage**: Any prescription generated during a virtual consult must be permanently linked to the `TelemedicineSession` ID for audit purposes.

### 10. Database Design

**Table: TelemedicineSession** (Header)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| SessionId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | Tenant Context |
| BranchId | INT | Yes | |
| ApptId | BIGINT (FK)| Yes | Link to Module 31 |
| PatientId | BIGINT (FK)| Yes | |
| DoctorId | INT (FK) | Yes | |
| SessionLink | NVARCHAR(500)| No | External URL (Zoom/Meet) |
| ActualStartTime| DATETIME | No | |
| ActualEndTime | DATETIME | No | |
| Status | NVARCHAR(50) | Yes | Waiting, In Progress, Completed |

**Table: TelemedicineConsent**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ConsentId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| SessionId | BIGINT (FK)| Yes | |
| PatientId | BIGINT (FK)| Yes | |
| ConsentVersion| NVARCHAR(20) | Yes | |
| IsAccepted | BIT | Yes | |
| AcceptedTime | DATETIME | Yes | |
| IPAddress | NVARCHAR(50) | Yes | |

**Table: TelemedicineWaitingRoom**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| WaitRoomId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| SessionId | BIGINT (FK)| Yes | |
| PatientJoinedAt| DATETIME | No | |
| DoctorJoinedAt | DATETIME | No | |
| QueuePosition | INT | No | |
| EstimatedWait | INT | No | Minutes |

**Table: TelemedicineTriage**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| TriageId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| SessionId | BIGINT (FK)| Yes | |
| ChiefComplaint| NVARCHAR(MAX)| Yes | |
| HomeVitals | NVARCHAR(MAX)| No | JSON payload (BP, Temp) |
| TriagedBy | INT (FK) | Yes | Coordinator UserId |
| TriageTime | DATETIME | Yes | |

**Table: TelemedicineDocumentUpload**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| DocUploadId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| SessionId | BIGINT (FK)| Yes | |
| PatientId | BIGINT (FK)| Yes | |
| DocumentType | NVARCHAR(50) | Yes | Report, Photo, Insurance |
| FilePath | NVARCHAR(500)| Yes | |
| UploadedTime | DATETIME | Yes | |
| IsReviewed | BIT | Yes | Marked by Doctor |

**Table: TelemedicineCallLog** (Audit)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| LogId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| SessionId | BIGINT (FK)| Yes | |
| Action | NVARCHAR(50) | Yes | Patient Join, Doctor Drop |
| ActorId | BIGINT | Yes | PatientId or UserId |
| ActionTime | DATETIME | Yes | |

**Table: TelemedicineRecording**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| RecordingId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| SessionId | BIGINT (FK)| Yes | |
| FilePath | NVARCHAR(500)| Yes | |
| FileSizeMB | DECIMAL | Yes | |
| RetentionExpiry| DATETIME | Yes | |
| IsLegalHold | BIT | Yes | |

**Table: TelemedicineEscalation**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| EscalationId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| SessionId | BIGINT (FK)| Yes | |
| Reason | NVARCHAR(MAX)| Yes | e.g., Chest Pain |
| EscalatedBy | INT (FK) | Yes | Doctor/Coordinator |
| ActionTaken | NVARCHAR(50) | Yes | ER Referral, Ambulance Call |
| EscalationTime| DATETIME | Yes | |

*Note: All tables include `CreatedBy`, `CreatedDate`, `ModifiedBy`, `ModifiedDate`, `IsActive`.*
*Index Recommendations: Non-clustered indexes on `CompanyId`, `PatientId`, `DoctorId`, `ApptId`, and `Status`.*

### 11. Reports
*   **Daily Telemedicine Consultation Report**: Volume and completion status.
*   **Doctor/Department-wise Telemedicine Report**: Utilization analytics.
*   **Patient No-Show Report**: Virtual no-show tracking.
*   **Average Waiting Time Report**: Time spent in the Virtual Waiting Room.
*   **Average Consultation Duration Report**: Efficiency metric.
*   **Telemedicine Revenue Report**: Financial reconciliation.
*   **Emergency Escalation Report**: Quality and safety audit.
*   **Consent Compliance Report**: Legal audit.

### 12. Dashboard Cards
*   Scheduled Today (Count)
*   In Waiting Room (Count)
*   In Consultation (Count)
*   Completed (Count)
*   Average Wait Time (Minutes)
*   Emergency Escalations (Alert)

### 13. Acceptance Criteria
*   **Secure Session Lifecycle**: A session link cannot be accessed by anyone other than the authenticated patient and the assigned doctor.
*   **Consent Enforcement**: The system hard-blocks entry to the waiting room until the digital consent form is accepted.
*   **Prescription Integration**: A doctor can generate a valid ePrescription directly from the virtual consultation screen, which instantly appears in the Patient Portal.
*   **Emergency Escalation**: A doctor can instantly flag a session as a medical emergency, triggering an alert to the physical ER desk.
*   **Auditability**: Every join, drop, document upload, and consent signature is permanently timestamped in the `TelemedicineCallLog`.
*   **SaaS Tenant Isolation**: Consents, documents, and recordings are strictly isolated by `CompanyId`.
*   **Localization**: The patient-facing waiting room and consent forms dynamically switch to RTL for Arabic/Urdu users.

### Appendix A – Enterprise Enhancements

#### 1. Native WebRTC Video Platform
*   **Architecture**: Transitioning from external links (Zoom/Meet) to a fully embedded, HIPAA-compliant WebRTC video engine hosted within the ERP, ensuring video data never leaves the hospital's secure perimeter.

#### 2. AI Symptom Pre-Screening
*   **Architecture**: An intelligent chatbot that interacts with the patient in the Virtual Waiting Room, collecting symptoms and generating a structured clinical summary for the doctor to review before joining the call.

#### 3. AI Consultation Summary Drafting
*   **Architecture**: Ambient voice AI that listens to the audio consultation (with consent) and automatically drafts the SOAP (Subjective, Objective, Assessment, Plan) notes for the doctor's review.

#### 4. Remote Patient Monitoring Integration
*   **Architecture**: API links to clinical-grade home devices (e.g., Bluetooth BP cuffs, digital stethoscopes) allowing the doctor to view real-time telemetry during the video call.

#### 5. Wearable Device Data Integration
*   **Architecture**: Pulling historical health data (steps, heart rate, sleep) from Apple HealthKit or Google Fit directly into the doctor's consultation workspace.

#### 6. Multilingual Live Captioning
*   **Architecture**: Real-time speech-to-text translation during the video call, allowing a doctor speaking English to communicate with a patient reading Arabic captions.

#### 7. Interpreter / Translator Support
*   **Architecture**: A multi-party video architecture allowing a certified medical translator to join the session as a third participant with specific role-based access.

#### 8. Home Sample Collection Booking
*   **Architecture**: A one-click workflow for the doctor to order lab tests and immediately dispatch a phlebotomist to the patient's home address.

#### 9. Digital Triage Bot
*   **Architecture**: A pre-booking AI that evaluates patient symptoms and determines if they are suitable for telemedicine or if they must visit the physical ER.

#### 10. International Second Opinion Consultation
*   **Architecture**: A specialized workflow for cross-border telemedicine, handling international time zones, multi-currency billing, and secure sharing of massive DICOM radiology files prior to the consult.

### Appendix B – Enterprise Virtual Care Enhancements

#### 1. Cross-Border Consultation Governance
*   **Overview**: Legal and operational framework for international telemedicine.
*   **Capabilities**: Enforces country restrictions, licensing restrictions, and time zone management. Displays mandatory jurisdiction warnings to both patient and doctor.
*   **Required Fields**: `CompanyId`, `PatientCountry`, `ConsultationCountry`, `TimeZone`, `LicensingJurisdiction`, `CrossBorderConsentAccepted` (BIT).

#### 2. Interpreter & Translation Services
*   **Overview**: Workflow to bridge language barriers during virtual care.
*   **Capabilities**: Live interpreter assignment, language matching algorithms, translation request workflows, and dedicated fields for consultation translation notes.

#### 3. Virtual Multidisciplinary Consultation
*   **Overview**: Collaborative virtual care sessions.
*   **Capabilities**: Supports multiple doctors, specialist participation, nurse participation, and care coordinator participation in a single session. Tracks precise join/leave times for all participants for billing and audit purposes.

#### 4. Home Healthcare Referral Workflow
*   **Overview**: Extending care beyond the virtual session into the patient's home.
*   **Capabilities**: Allows the telemedicine encounter to directly generate a home nursing referral, home sample collection order, home physiotherapy request, or home medication delivery order.

#### 5. Remote Patient Monitoring (RPM) Enrollment
*   **Overview**: Transitioning from episodic virtual care to continuous monitoring.
*   **Capabilities**: Support enrollment for Diabetes, Hypertension, COPD, and Cardiac patients. Tracks the specific monitoring plan, device assignment, and clinical escalation thresholds.

#### 6. Telemedicine Quality Indicators
*   **Overview**: Advanced KPIs to measure the effectiveness of the virtual care program.
*   **KPIs**: Average waiting time, Average consultation duration, Consultation completion rate, Technical failure rate, Follow-up compliance, Emergency escalation rate, and Patient satisfaction score.

#### 7. Telemedicine Technical Audit
*   **Overview**: IT-level tracking to ensure the reliability of the virtual platform.
*   **Capabilities**: Track network quality, device type, browser type, connection failures, and call interruptions to aid in troubleshooting and platform optimization.

#### 8. Clinical Escalation Governance
*   **Overview**: Structured pathways for handling patient deterioration during a virtual call.
*   **Escalation Levels**: Routine, Urgent, Emergency, Immediate ER Referral.
*   **Capabilities**: Capture the escalation reason, escalation outcome, and mandatory escalation acknowledgement by the receiving physical department.

#### 9. E-Prescription Fulfillment Readiness
*   **Overview**: Closing the loop on remote prescribing.
*   **Capabilities**: Support future integration with the internal hospital pharmacy, external retail pharmacies, and home delivery networks. Tracks the prescription fulfillment status (e.g., "Dispensed", "Delivered").

#### 10. Virtual Care Analytics Dashboard
*   **Overview**: Executive-level reporting on the telemedicine business unit.
*   **Capabilities**: Support analytics for doctor utilization, telemedicine revenue, chronic care enrollment, RPM enrollment, follow-up adherence, and geographic patient distribution.