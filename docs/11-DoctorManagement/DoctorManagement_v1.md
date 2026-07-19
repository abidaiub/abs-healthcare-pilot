## MODULE 11: Doctor Management

### 1. Executive Summary
The Doctor Management module maintains the registry of all medical practitioners associated with the healthcare facility. It tracks their credentials, specializations, schedules, and links them to system user accounts.

### 2. Business Purpose
To manage the primary clinical actors of the system, ensuring that consultations, prescriptions, and surgeries are correctly attributed to qualified professionals.

### 3. Actors
*   **Company Admin**: Manages the doctor registry for their company.
*   **HR Manager**: Updates doctor profiles and credentials.
*   **Doctor**: Views their own profile and schedule.

### 4. Functional Requirements
*   **Create/Edit Doctor Profile**: Name, Specialization, Degree, Registration Number, Contact Info.
*   **Doctor Status**: Active/Inactive/On Leave.
*   **Department Mapping**: Assign doctors to one or more clinical departments.
*   **User Account Linking**: Link doctor profiles to `AI_User` accounts for system access.
*   **Consultation Settings**: Define consultation fees and time slots.

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: Doctors are scoped by `CompanyId`.
*   **Privacy**: Sensitive contact details and registration numbers must be protected.

### 6. Screen List
1.  **Doctor List**: Searchable grid of all doctors.
2.  **Doctor Entry**: Form for doctor profile and settings.
3.  **Doctor Schedule**: Interface for managing consultation hours.

### 7. ASCII Mockups
**Doctor List**
```
--------------------------------------------------------------------------------
Doctor Management > Doctor List
--------------------------------------------------------------------------------
[Search Doctor Name...            ] [Dept: All v] [Search]

| Code | Doctor Name       | Specialization | Department | Status | Actions |
|------|-------------------|----------------|------------|--------|---------|
| D001 | Dr. Ahmed Khan    | Cardiology     | Cardiology | Active | [Edit]  |
| D002 | Dr. Sarah Evans   | Pediatrics     | Pediatrics | Active | [Edit]  |
| D003 | Dr. John Doe      | Orthopedics    | Surgery    | Leave  | [Edit]  |

[+ Add Doctor]                                               [Export]
--------------------------------------------------------------------------------
```

### 8. Workflow
`Admin` -> `Create Doctor Profile` -> `Assign Specialization/Dept` -> `Link User Account` -> `Set Fees/Schedule`.

### 9. Business Rules
*   Every doctor must have a unique `DoctorCode` or `RegistrationNumber`.
*   A doctor must be linked to a `Department` to appear in the OPD worklist.
*   Soft delete only.

### 10. Database Design
**Table: MasterDoctor**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| DoctorId | INT (Identity) | Yes | Primary Key |
| CompanyId | INT | Yes | FK to Company |
| DoctorCode | NVARCHAR(20) | Yes | Unique ID |
| Name | NVARCHAR(200) | Yes | Full name |
| Specialization | NVARCHAR(100) | Yes | e.g., Cardiology |
| Degree | NVARCHAR(200) | No | e.g., MBBS, MD |
| RegNo | NVARCHAR(50) | Yes | Medical license number |
| DepartmentId | INT | Yes | Primary FK to MasterDepartment |
| UserId | INT | No | FK to AI_User |
| ConsultationFee | DECIMAL(18,2) | Yes | Standard fee |
| IsActive | BIT | Yes | Logical active flag |

### 11. Security Design
*   Access restricted by `CompanyId`.
*   Doctor-specific data (e.g., private phone) hidden from non-HR roles.

### 12. Audit Design
*   Log all changes to doctor profiles and fee structures.

### 13. API Ready Design
*   Endpoints: `/api/v1/doctors`, `/api/v1/doctors/schedule`.

### 14. Mobile Ready Design
*   Doctor profile view for patient mobile app.

### 15. Localization Requirements
*   Multilingual support for Doctor Names, Degrees, and Specializations.

### 16. Future Expansion Plan
*   Doctor commission tracking.
*   Online appointment booking integration.

### 17. Acceptance Criteria
*   Doctor profile can be created and linked to a department.
*   Doctor appears in the Appointment scheduling dropdown.
