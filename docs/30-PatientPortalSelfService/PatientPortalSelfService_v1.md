## MODULE 30: Patient Portal & Self Service

### 1. Executive Summary
The Patient Portal & Self Service module is the digital front door of ABSHealthcareLite. It empowers patients and their authorized delegates to actively participate in their healthcare journey. By providing secure, 24/7 access to medical records, appointments, billing, and direct communication channels, this module enhances patient satisfaction, reduces administrative overhead for the hospital, and ensures seamless continuity of care post-discharge.

### 2. Business Purpose
To transition routine administrative tasks (e.g., booking appointments, requesting reports, paying bills) from hospital staff to the patients themselves. A robust patient portal increases patient retention, improves clinical outcomes through better medication adherence and follow-up compliance, and positions the hospital as a modern, patient-centric enterprise.

### 3. Actors
*   **Patient**: The primary user accessing their own health data.
*   **Guardian / Family Member**: Authorized delegate accessing a dependent's data.
*   **Doctor / Nurse**: Responds to secure messages and reviews patient-uploaded data.
*   **Billing Officer**: Processes online payments and resolves billing queries.
*   **Customer Service Officer**: Manages portal enrollment, feedback, and support.
*   **Telemedicine Coordinator**: Facilitates virtual consultations.
*   **Hospital Administrator**: Monitors portal adoption and patient satisfaction metrics.
*   **Tenant Admin**: Configures portal branding, features, and access rules per hospital.
*   **Host Admin**: Manages the global portal infrastructure and security.

### 4. Functional Requirements

#### A. Patient Registration & Portal Enrollment
*   **Methods**: Self-registration (matching against existing hospital records), Hospital-assisted registration (at the counter).
*   **Verification**: Mandatory OTP verification via Mobile or Email for activation.

#### B. Secure Authentication
*   **Methods**: Username/Password, Mobile OTP, Email OTP.
*   **Security**: Session timeout, device tracking, login history, and future MFA/Biometric/Social login support.

#### C. Patient Dashboard
*   **Overview**: Profile summary, upcoming appointments, active prescriptions, recent reports, outstanding balances, follow-up reminders, and unread notifications.

#### D. Profile Management
*   **Updates**: Personal information, emergency contacts.
*   **Preferences**: Language preference (EN, BN, AR, UR, HI), communication preference (SMS, Email, WhatsApp), and privacy settings.

#### E. Appointment Self-Service
*   **Capabilities**: Book, reschedule, or cancel appointments. Join waitlists. View historical visits.
*   **Integration**: Directly updates Module 17 (Appointment Management).

#### F. Investigation & Report Access
*   **Access**: Lab reports, radiology reports, discharge summaries, referral letters, medical certificates.
*   **Actions**: Download PDF, secure sharing (generating a time-limited link), QR verification.

#### G. Prescription Access
*   **View**: Current and historical prescriptions with medication instructions. Supports multilingual display for dosage instructions.

#### H. Billing & Payment Portal
*   **View**: Itemized bills, receipts, outstanding dues, and payment history.
*   **Future**: Online payment gateway integration and installment plan management.

#### I. Follow-Up & Continuity of Care
*   **Tracking**: Follow-up appointments, medication refill reminders, investigation reminders, and active care plans.

#### J. Secure Messaging
*   **Channels**: Patient ↔ Hospital (Admin), Patient ↔ Doctor, Patient ↔ Care Coordinator.
*   **Features**: Read receipts, secure attachments, and escalation workflows.

#### K. Family & Caregiver Access (Delegation)
*   **Use Cases**: Parent managing a child's profile, adult child managing an elderly parent.
*   **Governance**: Strict role-based restrictions and consent tracking.

#### L. Notifications Center
*   **Channels**: In-portal alerts, SMS, Email, WhatsApp, Push notifications.

#### M. Medical Timeline
*   **Visualization**: A chronological feed of all hospital interactions: Visits, Admissions, Investigations, Procedures, Prescriptions, Discharges.

#### N. Health Document Vault
*   **Storage**: Central repository for hospital-generated reports and patient-uploaded external documents (e.g., past records from other clinics).

#### O. Patient Feedback & Satisfaction
*   **Engagement**: Post-visit ratings, surveys, complaints, and suggestion boxes.

#### P. Future Readiness (Architecture Only)
*   **Telemedicine**: Schema support for virtual consultation links and video visits.
*   **Mobile App**: API-first design to support native Android, iOS, and Tablet applications.

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: A patient logging into Hospital A's portal cannot see data from Hospital B unless explicitly linked via a global Health Exchange. All data is scoped by `CompanyId`.
*   **Localization**: The entire portal UI must dynamically switch between English, Bangla, Arabic, Urdu, and Hindi, including full RTL layout mirroring.
*   **Read-Only Clinical Data**: Patients cannot modify hospital-generated medical records.

### 6. Screen List
1.  Patient Dashboard
2.  Login / Registration Screen
3.  Appointment Booking Screen
4.  Report Center (Vault)
5.  Prescription Viewer
6.  Billing Portal
7.  Messaging Center
8.  Medical Timeline
9.  Family Access Management
10. Mobile Responsive View

### 7. Detailed ASCII Mockups
*(See `docs/30-PatientPortalSelfService/Mockups/WireframeMockup.md`)*

### 8. Workflow Diagrams
*(See `docs/30-PatientPortalSelfService/Mockups/ScreenFlow.md`)*

### 9. Business Rules
*   **Data Ownership**: Patients may access only their own records or records explicitly delegated to them.
*   **Release Holds**: Sensitive reports (e.g., Biopsy, HIV) may require explicit doctor approval before appearing in the portal.
*   **Audit Trail**: Every document download or secure share must be logged.
*   **Suspension**: Hospital administrators can suspend portal access for security or administrative reasons.

### 10. Database Design

**Table: PatientPortalAccount**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| AccountId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | Tenant Context |
| PatientId | BIGINT (FK)| Yes | Link to Master Patient Index |
| Username | NVARCHAR(100)| Yes | Email or Mobile |
| PasswordHash | NVARCHAR(256)| Yes | |
| IsVerified | BIT | Yes | Mobile/Email OTP verified |
| LastLoginDate| DATETIME | No | |

**Table: PatientPortalLoginHistory**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| LoginId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| AccountId | BIGINT (FK)| Yes | |
| LoginTime | DATETIME | Yes | |
| IPAddress | NVARCHAR(50) | Yes | |
| DeviceInfo | NVARCHAR(200)| No | Browser, OS, Mobile App |
| IsSuccess | BIT | Yes | Tracks failed attempts |

**Table: PatientPortalSession**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| SessionId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| AccountId | BIGINT (FK)| Yes | |
| SessionToken | NVARCHAR(256)| Yes | |
| ExpiryTime | DATETIME | Yes | |
| IsRevoked | BIT | Yes | |

**Table: PatientPortalDelegation** (Family Access)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| DelegationId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| GrantorPatientId| BIGINT (FK)| Yes | The patient granting access |
| GranteeAccountId| BIGINT (FK)| Yes | The family member logging in |
| Relationship | NVARCHAR(50) | Yes | Parent, Child, Spouse |
| AccessLevel | NVARCHAR(50) | Yes | Full, Read-Only, Billing Only |

**Table: PatientPortalDocument** (Vault)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| DocumentId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| PatientId | BIGINT (FK)| Yes | |
| DocType | NVARCHAR(50) | Yes | Lab Report, External Upload |
| SourceId | BIGINT | No | Link to internal ERP record |
| FilePath | NVARCHAR(500)| Yes | |
| UploadedBy | NVARCHAR(50) | Yes | System vs Patient |

**Table: PatientPortalMessage**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| MessageId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| PatientId | BIGINT (FK)| Yes | |
| SenderType | NVARCHAR(20) | Yes | Patient, Doctor, Admin |
| SenderId | BIGINT | Yes | AccountId or EmployeeId |
| RecipientId | BIGINT | Yes | AccountId or EmployeeId |
| Subject | NVARCHAR(200)| Yes | |
| Body | NVARCHAR(MAX)| Yes | |
| IsRead | BIT | Yes | |

**Table: PatientPortalFeedback**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| FeedbackId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| PatientId | BIGINT (FK)| Yes | |
| EncounterId | BIGINT (FK)| No | Link to specific visit |
| Rating | INT | Yes | 1 to 5 stars |
| Comments | NVARCHAR(MAX)| No | |
| Status | NVARCHAR(20) | Yes | New, Reviewed, Resolved |

**Table: PatientPortalPreference**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| PrefId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| AccountId | BIGINT (FK)| Yes | |
| Language | NVARCHAR(10) | Yes | EN, AR, BN, etc. |
| SmsAlerts | BIT | Yes | |
| EmailAlerts | BIT | Yes | |

**Table: PatientPortalRequest**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| RequestId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| PatientId | BIGINT (FK)| Yes | |
| RequestType | NVARCHAR(50) | Yes | Profile Update, Record Request |
| Details | NVARCHAR(MAX)| Yes | |
| Status | NVARCHAR(20) | Yes | Pending, Approved, Rejected |

*Note: All tables include `CreatedBy`, `CreatedDate`, `ModifiedBy`, `ModifiedDate`, `IsActive`.*
*Index Recommendations: Non-clustered indexes on `CompanyId`, `PatientId`, `AccountId`, and `Username`.*

### 11. Reports
*   **Portal Usage Report**: Daily/Monthly active users.
*   **Patient Adoption Report**: Percentage of registered patients who activated their portal.
*   **Login Activity Report**: Audit of successful and failed logins (security monitoring).
*   **Document Download Report**: Volume of reports accessed via the portal vs. printed at the counter.
*   **Appointment Self-Service Report**: Percentage of appointments booked online vs. via phone/counter.
*   **Patient Satisfaction Report**: Aggregated feedback ratings and sentiment analysis.
*   **Notification Delivery Report**: Success/Failure rates for SMS and Email alerts.
*   **Feedback Analytics Report**: Resolution times for patient complaints.

### 12. Dashboard Cards (For Hospital Admin)
*   Total Active Portal Users
*   New Registrations (Today)
*   Online Appointments Booked (Today)
*   Unread Patient Messages
*   Pending Profile Update Requests
*   Average Patient Rating (Stars)

### 13. Acceptance Criteria
*   **Security**: The system locks an account after 5 failed login attempts and logs the IP address.
*   **Privacy**: A patient cannot view another patient's records unless a valid `PatientPortalDelegation` record exists.
*   **Auditability**: Every time a patient downloads a PDF report, a record is created in the audit log.
*   **Multi-tenancy**: Portal branding (logos, colors) and data access are strictly isolated by `CompanyId`.
*   **Localization**: A patient selecting 'Arabic' instantly flips the entire portal UI to RTL and translates all static labels.
*   **Mobile Readiness**: The web portal is fully responsive and scales perfectly to smartphone and tablet screens.
*   **API Readiness**: All portal functions (login, fetch appointments, download reports) are exposed via secure REST APIs for future native mobile apps.

### Appendix A – Enterprise Enhancements

#### 1. Patient Mobile Super App
*   **Architecture**: Evolution of the web portal into a native iOS/Android application featuring push notifications, offline caching of critical records, and location-based services (e.g., indoor hospital navigation).

#### 2. AI Health Assistant
*   **Architecture**: Integration of a conversational AI chatbot within the portal to answer basic FAQs, triage symptoms to suggest the right department for an appointment, and provide interactive medication reminders.

#### 3. Personal Health Record (PHR)
*   **Architecture**: Expanding the portal beyond hospital-generated data to allow patients to manually log daily vitals (blood pressure, glucose), track diet, and maintain a comprehensive, self-managed health diary.

#### 4. Wearable Device Integration
*   **Architecture**: API endpoints (e.g., Apple HealthKit, Google Fit) allowing the portal to automatically ingest step counts, heart rate, and sleep data from the patient's smartwatch, making it visible to their doctor.

#### 5. Remote Patient Monitoring
*   **Architecture**: Extending the portal to support clinical-grade IoT devices sent home with the patient post-discharge, streaming continuous telemetry data back to the hospital's chronic care dashboard.

#### 6. Smart Medication Adherence
*   **Architecture**: Gamified medication tracking within the portal. Patients check off doses as they take them, earning adherence scores. The system alerts the care coordinator if a patient misses critical doses for consecutive days.

#### 7. Digital Health Passport
*   **Architecture**: A secure, offline-verifiable QR code generated within the portal that contains a summary of the patient's critical health data (blood type, allergies, major diagnoses, vaccination status) for use in emergencies while traveling.

#### 8. National Health Exchange Integration
*   **Architecture**: Allowing patients to authorize the portal to pull in their medical records from other hospitals connected to a national or regional health information exchange (HIE).

#### 9. Family Health Management
*   **Architecture**: A unified dashboard allowing a "Head of Household" to seamlessly switch between the profiles of their spouse, children, and elderly parents without logging out, managing appointments and bills for the entire family.

#### 10. Patient Digital Wallet
*   **Architecture**: A secure financial module within the portal storing pre-paid balances, saved credit cards (tokenized), insurance policy details, and digital vouchers/coupons for hospital services.

### Appendix B – Enterprise Patient Engagement Enhancements

#### 1. Consent & Privacy Management
*   **Overview**: A centralized hub for patients to manage their legal and clinical permissions.
*   **Capabilities**: View consent history, grant consent, withdraw consent, approve document sharing, approve family access, and approve telemedicine participation.
*   **Suggested Entities**: `PatientConsent`, `PatientConsentHistory`. (Must include `CompanyId`).

#### 2. Medical Record Access Governance
*   **Overview**: Strict controls over what clinical data is exposed to the patient portal to prevent psychological harm or privacy breaches.
*   **Capabilities**: Sensitive report restrictions, mental health document restrictions, HIV-related document restrictions, and workflows requiring explicit doctor release approval before portal publishing.
*   **New Field**: `DocumentAccessLevel` (Values: `PublicToPatient`, `Restricted`, `DoctorApprovalRequired`, `LegalHold`).

#### 3. Health Goal & Wellness Tracking
*   **Overview**: Empowering patients to track their own wellness metrics between hospital visits.
*   **Capabilities**: Patient may track Weight, BMI, Blood pressure, Blood sugar, Exercise, and Sleep.
*   **Architecture**: Designed to prepare for future direct wearable integration (Apple Health/Google Fit).

#### 4. Vaccination & Immunization Wallet
*   **Overview**: A dedicated digital record for all immunizations.
*   **Capabilities**: Support for childhood vaccines, adult vaccines, travel vaccines, and COVID records. Features include vaccine history, due reminders, and downloadable vaccine certificates.

#### 5. Medication Adherence Tracking
*   **Overview**: Interactive tools to help patients follow their discharge medication plans.
*   **Capabilities**: Allow patient to mark medication as taken, report missed doses, and schedule their own reminders. Lays the groundwork for future AI adherence scoring.

#### 6. Health Questionnaire Engine
*   **Overview**: A dynamic form builder allowing the hospital to push clinical surveys directly to the patient's portal.
*   **Capabilities**: Publish pre-visit forms, follow-up surveys, chronic disease assessments, and Patient Reported Outcome Measures (PROMs).

#### 7. Patient Generated Health Data (PGHD)
*   **Overview**: Allowing patients to upload clinical data generated at home for doctor review.
*   **Capabilities**: Upload home glucose readings, BP readings, pulse oximeter readings, and weight records. Includes a clinical review workflow for the care team.

#### 8. Digital Check-In
*   **Overview**: Streamlining the physical hospital arrival process via the portal.
*   **Capabilities**: Pre-arrival registration, insurance verification, demographic verification, and consent completion to drastically reduce front desk workload.

#### 9. Emergency Access Card
*   **Overview**: A quick-access digital asset for critical situations.
*   **Capabilities**: Generate a patient QR code containing emergency allergies, blood group, emergency contacts, and chronic diseases. Designed as a future mobile app lock-screen feature.

#### 10. Patient Engagement Analytics
*   **Overview**: Advanced KPIs to measure the success of the portal deployment.
*   **KPIs**: Portal adoption rate, active users, download activity, follow-up compliance, medication adherence, satisfaction score, and message response rate.