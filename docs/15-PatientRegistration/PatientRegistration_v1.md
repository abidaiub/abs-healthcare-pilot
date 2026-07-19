## MODULE 15: Patient Registration & Master Patient Index (MPI)

### 1. Executive Summary
The Patient Registration & Master Patient Index (MPI) module is the primary entry point and identity management system for ABSHealthcareLite. It ensures that every patient has a unique, persistent identity across all branches of a tenant. By implementing a robust MPI, the system prevents duplicate records, maintains a longitudinal health record, and ensures patient safety through accurate identification.

### 2. Business Purpose
To establish a "Single Source of Truth" for patient identity. This module streamlines the registration process, captures essential demographic and legal information, and provides the foundation for all clinical and financial transactions. It is designed to handle high-volume registration while maintaining data integrity and privacy.

### 3. Actors
*   **Receptionist / Registration Officer**: Primary actor for data entry and search.
*   **Company Admin**: Manages registration policies and duplicate merge approvals.
*   **Doctor / Nurse**: Views patient profiles for clinical context.
*   **Patient**: Accesses their own profile via the Patient Portal.
*   **Auditor**: Reviews registration logs and identity verification trails.

### 4. Functional Requirements
*   **New Patient Registration**: Capture Name, DOB, Gender, Contact, Address.
*   **Identity Verification**: Support for National ID (NID), Passport, and Birth Certificate.
*   **Master Patient Index (MPI)**: Generate a unique, permanent Patient ID (MRN - Medical Record Number).
*   **Duplicate Detection**: Real-time checking based on Name, Phone, and NID.
*   **Guardian & Emergency Contact**: Capture details for minors or emergency situations.
*   **Patient Photo**: Capture or upload patient image for visual identification.
*   **Barcode / QR Generation**: Print patient ID cards or labels for quick scanning.
*   **Advanced Search**: Search by Name, Phone, ID, or Barcode.
*   **Patient Status**: Manage active, inactive, or deceased status.
*   **Merge Records**: Tools to merge duplicate patient profiles into a single MPI.

### 5. Patient Registration Workflow
1.  **Search First**: Always search for existing records before creating a new one.
2.  **Capture Demographics**: Enter basic info and verify with a legal ID.
3.  **Duplicate Check**: System flags potential matches.
4.  **Assign MPI**: System generates a unique Patient ID.
5.  **Print Card**: Generate a barcode/QR-enabled patient card.

### 6. Duplicate Patient Detection
The system uses a weighted matching algorithm:
*   **Exact Match**: NID, Passport, or Phone Number (High Priority).
*   **Fuzzy Match**: Name + DOB + Gender (Medium Priority).
*   **Alert**: If a match is found, the system prompts the user to "Use Existing" or "Create New" (requires justification).

### 7. Master Patient Index (MPI)
The MPI is a global identifier within the tenant (`CompanyId`). Even if a patient visits different branches, their MPI remains the same, ensuring all visits are linked to one longitudinal record.

### 8. National ID / Passport / Birth Certificate Support
*   Fields for ID Type and ID Number.
*   Ability to upload a scanned copy or photo of the ID.

### 9. Guardian Information
Mandatory for patients under a certain age (e.g., 18). Includes Guardian Name, Relation, and Contact.

### 10. Emergency Contact
Capture Name, Relation, and Phone for every patient to ensure safety during critical events.

### 11. Patient Photo
Integrated webcam support for live capture during registration or file upload.

### 12. Patient Barcode / QR
Every patient is assigned a unique Barcode/QR code. This is printed on:
*   Patient ID Cards
*   Wristbands (for IPD)
*   Sample Labels (for LIS)

### 13. Patient Search
Multi-parameter search:
*   `Quick Search`: Single box for Name/Phone/ID.
*   `Advanced Search`: Filter by Gender, DOB range, Address, or ID Type.

### 14. Merge Duplicate Patients
A controlled process where a Company Admin can select two records and merge them.
*   `Survivor Record`: The primary record that remains.
*   `Source Record`: The duplicate record that is archived.
*   All visits, bills, and lab results are re-linked to the Survivor Record.

### 15. Patient Status
*   **Active**: Regular status.
*   **Inactive**: No visits for a long period.
*   **Archived**: Soft-deleted.
*   **Deceased**: Stops all future appointments and notifications.

### 16. Security & Privacy
*   **Data Masking**: Phone numbers and IDs masked for unauthorized users.
*   **Consent Tracking**: Record patient consent for data sharing.
*   **HIPAA/GDPR Ready**: Architecture supports data privacy standards.

### 17. Audit Trail
*   Log every new registration.
*   Log every profile edit (Old Value vs New Value).
*   Log every search attempt (to detect snooping).
*   Log all merge operations.

### 18. Database Design (Core Tables)

**Table: MasterPatient (MPI Table)**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| PatientId | BIGINT (Identity)| Yes | Primary Key (MPI) |
| CompanyId | INT | Yes | Tenant ID |
| PatientCode | NVARCHAR(20) | Yes | Unique MRN (e.g., P-10001) |
| FirstName | NVARCHAR(100) | Yes | Multilingual |
| LastName | NVARCHAR(100) | Yes | Multilingual |
| DOB | DATE | Yes | Date of Birth |
| Gender | NVARCHAR(10) | Yes | Male, Female, Other |
| BloodGroup | NVARCHAR(5) | No | A+, B-, etc. |
| NID | NVARCHAR(50) | No | National ID |
| PassportNo | NVARCHAR(50) | No | Passport Number |
| Phone | NVARCHAR(20) | Yes | Primary Contact |
| Email | NVARCHAR(150) | No | Email Address |
| PhotoUrl | NVARCHAR(500) | No | Path to image |
| Status | NVARCHAR(20) | Yes | Active, Deceased, etc. |
| CreatedBy | INT | Yes | User ID |
| CreatedDate | DATETIME | Yes | Timestamp |

**Table: PatientAddress**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| AddressId | BIGINT (Identity)| Yes | Primary Key |
| PatientId | BIGINT | Yes | FK to MasterPatient |
| AddressType | NVARCHAR(20) | Yes | Present, Permanent |
| HouseNo | NVARCHAR(100) | No | |
| Area | NVARCHAR(100) | No | |
| City | NVARCHAR(100) | Yes | |
| Country | NVARCHAR(100) | Yes | |

**Table: PatientGuardian**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| GuardianId | BIGINT (Identity)| Yes | Primary Key |
| PatientId | BIGINT | Yes | FK to MasterPatient |
| Name | NVARCHAR(200) | Yes | |
| Relation | NVARCHAR(50) | Yes | Father, Mother, etc. |
| Phone | NVARCHAR(20) | Yes | |

### 19. API Ready Design
*   Endpoints: `/api/v1/patients`, `/api/v1/patients/search`, `/api/v1/patients/{id}/history`.

### 20. Mobile Ready Design
*   QR-based patient check-in for mobile apps.
*   Simplified registration form for mobile front-desk tablets.

### 21. Localization Requirements
*   **Multilingual Names**: Store names in Unicode to support Bangla, Arabic, etc.
*   **RTL Support**: Arabic and Urdu layouts flip the registration form.

### 22. Acceptance Criteria
*   System generates a unique MRN for every new patient.
*   Duplicate alert triggers if the same NID or Phone is entered.
*   Patient photo is captured and visible in the profile.
*   Barcode prints correctly on the registration slip.
*   Search returns results in < 1 second for 100k+ records.
