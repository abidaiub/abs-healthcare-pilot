## MODULE 16: Patient Profile & Unified Patient Ledger

### 1. Executive Summary
The Patient Profile & Unified Patient Ledger module provides a comprehensive 360-degree view of a patient's interaction with the healthcare facility. It consolidates demographic data, clinical history, and financial transactions into a single, unified interface. This module is the central hub for clinicians to understand a patient's health journey and for administrators to manage the patient's financial standing.

### 2. Business Purpose
To provide a holistic view of the patient, improving clinical decision-making and financial transparency. By unifying clinical and financial data, the system ensures that healthcare providers have all necessary context at the point of care, while also providing patients and administrators with a clear, audited record of all services and payments.

### 3. Actors
*   **Doctor**: Accesses the profile for clinical history, allergies, and chronic conditions.
*   **Nurse**: Updates vitals, allergies, and monitors the clinical timeline.
*   **Cashier / Accountant**: Manages the financial ledger, payments, and dues.
*   **Receptionist**: Views demographics and appointment history.
*   **Patient**: Views their own profile, timeline, and ledger via the portal.
*   **Company Admin**: Oversees data integrity and high-level patient analytics.

### 4. Functional Requirements

#### Patient Profile (360-Degree View)
*   **Demographics**: Full name, age, gender, blood group.
*   **Photo**: Visual identification of the patient.
*   **Contacts & Address**: Phone numbers, email, present and permanent addresses.
*   **Guardian & Family**: Mapping relationships (e.g., Spouse, Parent, Child) for family-based care.
*   **Preferred Language**: Setting for communication (English, Bangla, Arabic, Urdu, Hindi).
*   **Clinical Alerts**: High-visibility flags for allergies, chronic conditions (e.g., Diabetes, Hypertension), and critical risks.

#### Clinical Ledger
*   **Chronological History**: A unified list of all clinical events:
    *   Appointments (Scheduled, Completed, Cancelled).
    *   Prescriptions (Medications, Instructions).
    *   Investigations (Orders and Results).
    *   Admissions (IPD stays, Ward/Bed history).
    *   Procedures (OT, Minor procedures).
    *   Clinical Reports (Uploaded or system-generated).

#### Financial Ledger
*   **Unified Account View**: A single ledger showing all debits and credits:
    *   **Debits**: Registration fees, consultation fees, investigation charges, pharmacy bills, admission/OT charges.
    *   **Credits**: Payments (Cash, Card, Mobile Banking), Refunds, and approved Discounts.
    *   **Balance**: Real-time calculation of "Due" amount.
*   **Transaction Linking**: Every ledger item must link back to a specific service or order.

#### Patient Timeline
*   **Visual Journey**: A vertical or horizontal timeline showing the patient's path:
    `Registration → Appointment → Consultation → Investigation → Billing → Result → Admission → Discharge`

### 5. Database Design

**Table: PatientProfile (Extended Identity)**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ProfileId | BIGINT (Identity)| Yes | Primary Key |
| PatientId | BIGINT | Yes | FK to MasterPatient (MPI) |
| PreferredLanguage| NVARCHAR(10) | Yes | en, bn, ar, ur, hi |
| Allergies | NVARCHAR(MAX) | No | Comma-separated or JSON |
| ChronicConditions| NVARCHAR(MAX) | No | Comma-separated or JSON |
| FamilyId | GUID | No | Grouping ID for family units |

**Table: PatientLedger (Financial Summary)**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| LedgerId | BIGINT (Identity)| Yes | Primary Key |
| PatientId | BIGINT | Yes | FK to MasterPatient |
| CompanyId | INT | Yes | Tenant Context |
| TotalDebit | DECIMAL(18,2) | Yes | Total charges |
| TotalCredit | DECIMAL(18,2) | Yes | Total payments/discounts |
| CurrentDue | DECIMAL(18,2) | Yes | Calculated balance |
| LastUpdated | DATETIME | Yes | Timestamp |

**Table: PatientLedgerItem (Transaction Detail)**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ItemId | BIGINT (Identity)| Yes | Primary Key |
| LedgerId | BIGINT | Yes | FK to PatientLedger |
| TransactionType | NVARCHAR(20) | Yes | DEBIT, CREDIT |
| Category | NVARCHAR(50) | Yes | Consultation, Pharmacy, etc. |
| ReferenceId | NVARCHAR(50) | Yes | InvoiceNo, OrderNo, etc. |
| Amount | DECIMAL(18,2) | Yes | Transaction value |
| TransactionDate | DATETIME | Yes | |
| CreatedBy | INT | Yes | User ID |

**Table: PatientAlert**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| AlertId | INT (Identity) | Yes | Primary Key |
| PatientId | BIGINT | Yes | FK to MasterPatient |
| AlertType | NVARCHAR(50) | Yes | Allergy, Risk, Chronic |
| Description | NVARCHAR(200) | Yes | e.g., Penicillin Allergy |
| Severity | NVARCHAR(10) | Yes | Low, Medium, High |

**Table: PatientRelationship**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| RelId | INT (Identity) | Yes | Primary Key |
| PatientId | BIGINT | Yes | Primary Patient |
| RelatedPatientId | BIGINT | Yes | Related Patient |
| RelationshipType | NVARCHAR(50) | Yes | Spouse, Child, etc. |

### 6. Business Rules
*   **PatientId Scoping**: Every profile and ledger record **must** be linked to a `PatientId` from the Master Patient Index (MPI).
*   **Financial Integrity**: The `CurrentDue` must always equal `TotalDebit - TotalCredit`.
*   **Alert Visibility**: Clinical alerts (Allergies/Risks) must be prominently displayed in red on all clinical screens.
*   **Immutable Ledger**: Ledger items cannot be deleted; corrections must be made via "Refund" or "Adjustment" entries.
*   **Family Context**: Relationships allow for "Family Billing" where one member pays for another.

### 7. Security & Privacy
*   **Role-Based Access**: Doctors see clinical data; Cashiers see financial data; Admins see both.
*   **Audit Trail**: Every view of the patient profile and every ledger transaction is logged.

### 8. Localization Requirements
*   **Multilingual Support**: English, Bangla, Arabic, Urdu, Hindi.
*   **RTL Layout**: Mandatory for Arabic and Urdu.
*   **Format**: Currency and dates must follow regional settings defined in the company profile.

### 9. Acceptance Criteria
*   Profile displays all demographic and clinical alert data correctly.
*   Ledger accurately reflects all billing and payment transactions.
*   Timeline correctly sequences patient events from registration to discharge.
*   Switching to Arabic flips the UI to RTL and translates all labels.
*   Any financial transaction automatically updates the `PatientLedger` summary.

### 10. Extended Functional Requirements

#### 10.1 PatientAlert Center
*   **Centralized Alert Management**: A dedicated dashboard for managing all patient alerts (Allergies, Clinical Risks, Behavioral Flags).
*   **Severity Levels**: Categorize alerts as Low, Medium, or High (Critical).
*   **Auto-Expiry**: Set expiry dates for temporary alerts (e.g., "Post-Surgical Restriction").
*   **Acknowledgment**: Track when a clinician has acknowledged a critical alert.

#### 10.2 PatientRiskProfile
*   **Risk Scoring**: Automated or manual scoring for chronic conditions (e.g., Fall Risk, Cardiac Risk).
*   **Visual Indicators**: Color-coded risk badges on the profile header.
*   **History**: Track changes in risk profile over time.

#### 10.3 PatientConsent
*   **Consent Registry**: Digital capture of patient consent for:
    *   Data Sharing (with other providers).
    *   Marketing/Notifications.
    *   Clinical Procedures (Informed Consent).
*   **Digital Signature**: Integration for capturing digital or tablet-based signatures.
*   **Version Control**: Track historical versions of signed consents.

#### 10.4 PatientDocument Vault
*   **Secure Storage**: Encrypted storage for scanned medical reports, ID copies, and external prescriptions.
*   **Categorization**: Group documents by type (Clinical, Financial, Identity).
*   **Access Control**: Restrict sensitive documents to specific roles (e.g., only Doctors can see "Psychiatric Evaluation").

#### 10.5 PatientCoverage (Insurance/Corporate)
*   **Coverage Management**: Track insurance policies or corporate memberships.
*   **Policy Details**: Store Policy Number, Group ID, Validity Dates, and Coverage Limits.
*   **Direct Billing**: Flag patients for direct corporate billing vs. individual payment.

#### 10.6 PreferredLanguage & Communication
*   **Language Preference**: Support for English, Bangla, Arabic, Urdu, and Hindi.
*   **Communication Channels**: Preferred method for notifications (SMS, WhatsApp, Email, In-App).
*   **Time Slots**: Preferred time for receiving non-urgent notifications.

#### 10.7 Family Health Tree
*   **Genetic Mapping**: Link family members to track hereditary conditions.
*   **Visual Tree**: A diagrammatic representation of family relationships and shared health alerts (e.g., "Family History of Hypertension").

#### 10.8 AI Ready Patient Health Summary
*   **Structured Data Export**: Generate a machine-readable summary (JSON/FHIR) for AI analysis.
*   **Summarization**: AI-ready prompts for generating concise clinical summaries of the patient's entire ledger.

### 11. Updated Database Design (Additional Tables)

**Table: PatientConsent**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ConsentId | BIGINT (Identity)| Yes | Primary Key |
| PatientId | BIGINT | Yes | FK to MasterPatient |
| ConsentType | NVARCHAR(50) | Yes | DATA_SHARING, PROCEDURE, etc. |
| IsGranted | BIT | Yes | |
| SignedDate | DATETIME | No | |
| DocumentUrl | NVARCHAR(500) | No | Link to signed document |

**Table: PatientDocument**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| DocId | BIGINT (Identity)| Yes | Primary Key |
| PatientId | BIGINT | Yes | FK to MasterPatient |
| Category | NVARCHAR(50) | Yes | IDENTITY, CLINICAL, etc. |
| FilePath | NVARCHAR(500) | Yes | Encrypted storage path |
| UploadedBy | INT | Yes | User ID |
| UploadedDate | DATETIME | Yes | |

**Table: PatientCoverage**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| CoverageId | INT (Identity) | Yes | Primary Key |
| PatientId | BIGINT | Yes | FK to MasterPatient |
| ProviderType | NVARCHAR(20) | Yes | INSURANCE, CORPORATE |
| ProviderName | NVARCHAR(200) | Yes | |
| PolicyNo | NVARCHAR(100) | No | |
| ExpiryDate | DATE | No | |

### 12. Updated Business Rules
*   **Critical Alert Block**: The system must prompt for confirmation if a clinician attempts to prescribe a medication listed in the `PatientAlert` (Allergy).
*   **Consent Enforcement**: Data sharing via API is blocked unless `IsGranted = 1` in `PatientConsent`.
*   **Coverage Priority**: If a patient has multiple coverages, the "Primary Coverage" is used for billing defaults.
*   **Vault Encryption**: All files in the `PatientDocument` vault must be encrypted at rest.

### 13. Updated Security Design
*   **Encryption at Rest**: Sensitive demographic data (NID, Passport) and Document Vault files are encrypted.
*   **Break-Glass Access**: Emergency access to clinical data for patients who haven't granted consent, with mandatory justification and audit logging.
*   **PII Masking**: Masking of phone numbers and emails in the UI for non-administrative roles.

### 14. Updated Acceptance Criteria
*   **Alert Center**: High-severity alerts appear as a persistent red banner on all patient-related screens.
*   **Consent**: Attempting to export patient data without active consent triggers a security warning.
*   **Vault**: Documents can be uploaded, categorized, and retrieved only by authorized roles.
*   **Coverage**: Billing module correctly identifies and applies corporate/insurance discounts based on `PatientCoverage`.
*   **AI Summary**: System generates a valid JSON health summary for a given `PatientId`.

---

## Appendix A – Enterprise Patient 360 Enhancements

### 1. Functional Requirements

#### 1.1 PatientAlert Center
*   **Centralized Alert Management**: A dedicated dashboard for managing all patient alerts (Allergies, Clinical Risks, Behavioral Flags).
*   **Severity Levels**: Categorize alerts as Low, Medium, or High (Critical).
*   **Auto-Expiry**: Set expiry dates for temporary alerts (e.g., "Post-Surgical Restriction").
*   **Acknowledgment**: Track when a clinician has acknowledged a critical alert.

#### 1.2 PatientRiskProfile
*   **Risk Scoring**: Automated or manual scoring for chronic conditions (e.g., Fall Risk, Cardiac Risk).
*   **Visual Indicators**: Color-coded risk badges on the profile header.
*   **History**: Track changes in risk profile over time.

#### 1.3 PatientConsent
*   **Consent Registry**: Digital capture of patient consent for:
    *   Data Sharing (with other providers).
    *   Marketing/Notifications.
    *   Clinical Procedures (Informed Consent).
*   **Digital Signature**: Integration for capturing digital or tablet-based signatures.
*   **Version Control**: Track historical versions of signed consents.

#### 1.4 PatientDocument Vault
*   **Secure Storage**: Encrypted storage for scanned medical reports, ID copies, and external prescriptions.
*   **Categorization**: Group documents by type (Clinical, Financial, Identity).
*   **Access Control**: Restrict sensitive documents to specific roles (e.g., only Doctors can see "Psychiatric Evaluation").

#### 1.5 PatientCoverage (Insurance/Corporate)
*   **Coverage Management**: Track insurance policies or corporate memberships.
*   **Policy Details**: Store Policy Number, Group ID, Validity Dates, and Coverage Limits.
*   **Direct Billing**: Flag patients for direct corporate billing vs. individual payment.

#### 1.6 PreferredLanguage & Communication
*   **Language Preference**: Support for English, Bangla, Arabic, Urdu, and Hindi.
*   **Communication Channels**: Preferred method for notifications (SMS, WhatsApp, Email, In-App).
*   **Time Slots**: Preferred time for receiving non-urgent notifications.

#### 1.7 Family Health Tree
*   **Genetic Mapping**: Link family members to track hereditary conditions.
*   **Visual Tree**: A diagrammatic representation of family relationships and shared health alerts (e.g., "Family History of Hypertension").

#### 1.8 AI Ready Patient Health Summary
*   **Structured Data Export**: Generate a machine-readable summary (JSON/FHIR) for AI analysis.
*   **Summarization**: AI-ready prompts for generating concise clinical summaries of the patient's entire ledger.

### 2. Database Design (Additional Tables)

**Table: PatientConsent**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ConsentId | BIGINT (Identity)| Yes | Primary Key |
| PatientId | BIGINT | Yes | FK to MasterPatient |
| ConsentType | NVARCHAR(50) | Yes | DATA_SHARING, PROCEDURE, etc. |
| IsGranted | BIT | Yes | |
| SignedDate | DATETIME | No | |
| DocumentUrl | NVARCHAR(500) | No | Link to signed document |

**Table: PatientDocument**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| DocId | BIGINT (Identity)| Yes | Primary Key |
| PatientId | BIGINT | Yes | FK to MasterPatient |
| Category | NVARCHAR(50) | Yes | IDENTITY, CLINICAL, etc. |
| FilePath | NVARCHAR(500) | Yes | Encrypted storage path |
| UploadedBy | INT | Yes | User ID |
| UploadedDate | DATETIME | Yes | |

**Table: PatientCoverage**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| CoverageId | INT (Identity) | Yes | Primary Key |
| PatientId | BIGINT | Yes | FK to MasterPatient |
| ProviderType | NVARCHAR(20) | Yes | INSURANCE, CORPORATE |
| ProviderName | NVARCHAR(200) | Yes | |
| PolicyNo | NVARCHAR(100) | No | |
| ExpiryDate | DATE | No | |

### 3. Business Rules
*   **Critical Alert Block**: The system must prompt for confirmation if a clinician attempts to prescribe a medication listed in the `PatientAlert` (Allergy).
*   **Consent Enforcement**: Data sharing via API is blocked unless `IsGranted = 1` in `PatientConsent`.
*   **Coverage Priority**: If a patient has multiple coverages, the "Primary Coverage" is used for billing defaults.
*   **Vault Encryption**: All files in the `PatientDocument` vault must be encrypted at rest.

### 4. Security Design
*   **Encryption at Rest**: Sensitive demographic data (NID, Passport) and Document Vault files are encrypted.
*   **Break-Glass Access**: Emergency access to clinical data for patients who haven't granted consent, with mandatory justification and audit logging.
*   **PII Masking**: Masking of phone numbers and emails in the UI for non-administrative roles.

### 5. Acceptance Criteria
*   **Alert Center**: High-severity alerts appear as a persistent red banner on all patient-related screens.
*   **Consent**: Attempting to export patient data without active consent triggers a security warning.
*   **Vault**: Documents can be uploaded, categorized, and retrieved only by authorized roles.
*   **Coverage**: Billing module correctly identifies and applies corporate/insurance discounts based on `PatientCoverage`.
*   **AI Summary**: System generates a valid JSON health summary for a given `PatientId`.
