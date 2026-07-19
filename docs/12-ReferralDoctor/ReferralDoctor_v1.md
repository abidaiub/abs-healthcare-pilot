## MODULE 12: Referral Doctor Management

### 1. Executive Summary
The Referral Doctor Management module tracks external medical practitioners who refer patients to the facility. It manages their contact information and tracks the volume of referrals.

### 2. Business Purpose
To build and maintain relationships with external doctors, ensuring they are correctly attributed for patient referrals, which is essential for marketing and business development.

### 3. Actors
*   **Company Admin**: Manages the referral doctor list.
*   **Marketing Officer**: Updates referral doctor contact info and visits.
*   **Receptionist**: Selects referral doctors during patient registration.

### 4. Functional Requirements
*   **Create/Edit Referral Doctor**: Name, Hospital/Clinic Name, Contact Info, Address.
*   **Referral Tracking**: Link patients/investigations to a referral doctor.
*   **Status Management**: Active/Inactive referral partners.
*   **Category Mapping**: Group referral doctors (e.g., General Practitioner, Specialist).

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: Referral doctors are scoped by `CompanyId`.
*   **Usability**: Quick search for referral doctors during the registration process.

### 6. Screen List
1.  **Referral Doctor List**: Grid view of all external partners.
2.  **Referral Doctor Entry**: Form for partner details.

### 7. ASCII Mockups
**Referral Doctor List**
```
--------------------------------------------------------------------------------
Referral Doctor Management
--------------------------------------------------------------------------------
[Search Name/Clinic...            ] [Category: All v] [Search]

| Code | Doctor Name       | Clinic/Hospital   | Contact No | Status | Actions |
|------|-------------------|-------------------|------------|--------|---------|
| R001 | Dr. Kamal Uddin   | Green Life Clinic | 01711...   | Active | [Edit]  |
| R002 | Dr. Maria Gomez   | City Medical      | 01822...   | Active | [Edit]  |
| R003 | Dr. S. Rahman     | Private Practice  | 01933...   | Active | [Edit]  |

[+ Add Referral Doctor]                                      [Referral Report]
--------------------------------------------------------------------------------
```

### 8. Workflow
`Marketing/Admin` -> `Create Referral Doctor` -> `Tag Category` -> `Select during Registration/Billing`.

### 9. Business Rules
*   Referral doctors are external and do not have system `AI_User` accounts.
*   Referral data is used for reporting and commission calculation (if enabled).
*   Soft delete only.

### 10. Database Design
**Table: MasterReferralDoctor**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ReferralId | INT (Identity) | Yes | Primary Key |
| CompanyId | INT | Yes | FK to Company |
| RefCode | NVARCHAR(20) | Yes | Unique code |
| Name | NVARCHAR(200) | Yes | Full name |
| ClinicName | NVARCHAR(200) | No | External workplace |
| Phone | NVARCHAR(50) | Yes | Contact number |
| Address | NVARCHAR(MAX) | No | Location |
| IsActive | BIT | Yes | Logical active flag |

### 11. Security Design
*   Access restricted by `CompanyId`.

### 12. Audit Design
*   Log changes to referral doctor contact information.

### 13. API Ready Design
*   Endpoints: `/api/v1/referral-doctors`.

### 14. Mobile Ready Design
*   Referral doctor selection in mobile registration forms.

### 15. Localization Requirements
*   Multilingual support for Names and Clinic Names.

### 16. Future Expansion Plan
*   Referral commission automated tracking.
*   Partner portal for referral doctors to view patient status.

### 17. Acceptance Criteria
*   Referral doctor can be created and appears in the "Referred By" dropdown.
*   Referral report shows patient counts per referral doctor.
