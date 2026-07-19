## MODULE 02: User Management – Functional Requirement Documentation

### 1. Executive Summary
The User Management module is the central Identity and Access Management (IAM) hub for ABSHealthcareLite. It provides a robust, multi-tenant framework for managing user identities, authentication, and granular authorization. Designed for enterprise healthcare environments, it ensures that every actor—from Host Administrators to Patient Portal Users—operates within a secure, audited, and company-isolated context.

### 2. Business Purpose
To secure the platform by ensuring only authorized personnel can access sensitive healthcare data. This module facilitates operational efficiency by mapping digital identities to physical healthcare roles (Doctors, Nurses, Technicians), enforcing security policies (password complexity, account lockout), and providing a comprehensive audit trail for compliance with international healthcare data standards.

### 3. Actors
*   **Host Admin**: Global controller; manages all companies and their respective administrators.
*   **Company Admin**: Tenant-level controller; manages users, roles, and permissions within their specific company.
*   **Department Manager**: Oversees departmental staff and views department-specific logs.
*   **Doctor**: Accesses clinical modules, patient records, and prescriptions.
*   **Nurse**: Accesses patient care, vitals, and nursing service modules.
*   **Reception**: Manages patient registration and appointments.
*   **Cashier**: Handles billing and payment collections.
*   **Lab Technician**: Manages investigation orders and result entry.
*   **Pharmacist**: Manages medicine inventory and sales.
*   **Store Manager**: Oversees inventory, GRN, and stock transfers.
*   **Accountant**: Manages vouchers, ledgers, and financial reports.
*   **HR Officer**: Manages employee records and payroll.
*   **Patient Portal User**: External user (patient) accessing their own health records and bills.

### 4. Functional Requirements

#### User Lifecycle
*   **Create User**: Register new users with unique credentials, linked to a specific `CompanyId`.
*   **Edit User**: Modify profile details, contact info, and system settings.
*   **Activate/Deactivate**: Toggle user access without deleting historical data (Soft Delete).
*   **Lock/Unlock**: Manual or automated account locking due to security violations or failed attempts.
*   **Reset Password**: Administrative password reset with temporary credential generation.
*   **Force Password Change**: Flag a user to change their password upon the next successful login.

#### User Profile
*   **Employee Mapping**: Link a user account to a record in the HR/Employee Master.
*   **Doctor Mapping**: Link a user account to a specific Doctor ID for clinical signature and worklist routing.
*   **Department Mapping**: Assign users to one or more departments for data filtering.
*   **Branch Mapping**: Assign users to one or more physical branches/locations.

#### Role Assignment
*   **Multiple Roles**: Support for a user holding multiple roles (e.g., Doctor and Department Manager).
*   **Primary Role**: Designation of one role as the default for UI layout and permission priority.
*   **Effective Date**: Track when roles were assigned for historical auditing.

#### Security
*   **Password Policy**: Enforce complexity (length, special characters, casing) and expiry.
*   **Login Attempt Control**: Track failed attempts and trigger automated account lockout.
*   **Session Management**: Control session timeouts and allow administrators to terminate active sessions.
*   **Device & IP Tracking**: Log the physical device fingerprint and IP address for every login attempt.

### 5. Non-Functional Requirements
*   **Tenant Isolation**: Strict `CompanyId` partitioning at the database and application layers.
*   **Multilingual UI**: Architecture must support LTR (English, Bangla, Hindi) and RTL (Arabic, Urdu) without code changes.
*   **Performance**: User authentication and permission checks must resolve in < 200ms.
*   **Auditability**: 100% of administrative changes must be logged in the `UserAuditLog`.
*   **Scalability**: Support for 100,000+ users across multiple tenants.

### 6. Complete Screen List
1.  **User List**: Searchable grid of all users within the company.
2.  **User Entry**: Form for creating/editing user credentials and core settings.
3.  **User Profile**: Detailed view of employee/doctor mapping and personal info.
4.  **User Role Assignment**: Interface for managing multiple roles and setting the primary role.
5.  **User Branch Assignment**: Interface for mapping users to multiple hospital branches.
6.  **Login History**: Searchable log of all successful and failed login attempts.
7.  **Session Monitor**: Real-time view of active users with "Force Logout" capability.
8.  **User Audit Log**: Detailed trail of changes made to user records.

### 7. Detailed ASCII Mockups

**User List**
```
--------------------------------------------------------------------------------
User Management > User List
--------------------------------------------------------------------------------
[Search Username/Name...       ] [Status: All v] [Role: All v] [Search]

| Username    | Full Name       | Primary Role | Status   | Last Login        |
|-------------|-----------------|--------------|----------|-------------------|
| dr.ahmed    | Ahmed Mansour   | Doctor       | Active   | 2026-06-07 09:15  |
| nurse.lily  | Lily Evans      | Nurse        | Active   | 2026-06-06 18:30  |
| admin.abs   | Al Baraka Admin | Admin        | Locked   | 2026-06-01 10:00  |

[+ Create New User] [Export to Excel] [Refresh]
--------------------------------------------------------------------------------
```

**User Entry**
```
--------------------------------------------------------------------------------
User Entry: [ New / Edit ]
--------------------------------------------------------------------------------
Login Info:
Username: [ ahmed_01       ]  Email: [ ahmed@hospital.com ]
Password: [ ********       ]  Confirm: [ ********       ]

Status:
(x) Active  ( ) Inactive  ( ) Locked  [x] Force Password Change

Mappings:
Employee: [ EMP-102: Ahmed Mansour v]  Doctor: [ DOC-55: Dr. Ahmed v]
Primary Dept: [ Cardiology v]          Primary Branch: [ Main Branch v]

[Save User] [Cancel] [Reset Password]
--------------------------------------------------------------------------------
```

**User Role Assignment**
```
--------------------------------------------------------------------------------
Role Assignment: Ahmed Mansour (dr.ahmed)
--------------------------------------------------------------------------------
Available Roles:             Assigned Roles:
[ Reception        ] [ >> ]  [ Doctor (Primary)    ] [Set Primary]
[ Pharmacist       ] [ << ]  [ Department Manager  ] [Remove]
[ Accountant       ]

Effective Date: [ 2026-06-07 ]

[Save Roles] [Back to List]
--------------------------------------------------------------------------------
```

### 8. Workflow Diagrams

**User Creation Workflow**
`Host/Company Admin` -> `Enter User Details` -> `Map to Employee/Doctor` -> `Assign Roles` -> `Assign Branches` -> `System Generates Welcome Email` -> `User Logs in & Changes Password`.

**Security Lockout Workflow**
`User Login Attempt` -> `Failure` -> `Log Attempt` -> `Count > 5?` -> `Update Status to 'Locked'` -> `Notify Admin` -> `Admin Verification` -> `Manual Unlock`.

### 9. Business Rules
*   **Company Isolation**: Host Admins (CompanyId NULL) can manage all users. Company Admins can only manage users where `CompanyId` matches their own.
*   **Soft Delete**: Users are never deleted from `AI_User`. `IsActive` is set to 0 and `Status` to 'Archived'.
*   **Primary Constraint**: Every user must have exactly one `PrimaryRole` and one `PrimaryBranch`.
*   **Mapping Integrity**: A user cannot be mapped to a Doctor ID that is already assigned to another active user.
*   **Password History**: Users cannot reuse their last 3 passwords.
*   **Session Timeout**: Inactive sessions are automatically terminated after 30 minutes (configurable per company).

### 10. Database Design

**Table: AI_User (Core User Table)**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| UserID | INT (Identity) | Yes | Primary Key |
| Username | NVARCHAR(50) | Yes | Unique login name |
| PasswordHash | NVARCHAR(MAX) | Yes | Salted and hashed password |
| Email | NVARCHAR(150) | Yes | Contact email |
| Phone | NVARCHAR(50) | No | Contact phone |
| CompanyId | INT | No | NULL for Host Admin, else Tenant ID |
| UserStatus | NVARCHAR(20) | Yes | Active, Locked, Suspended, Archived |
| IsHostAdmin | BIT | Yes | Flag for global access |
| IsActive | BIT | Yes | Logical delete flag |
| ForcePasswordChange| BIT | Yes | Force change on next login |
| CreatedBy | INT | Yes | UserID of creator |
| CreatedDate | DATETIME | Yes | Timestamp |

**Table: UserProfile (Extended Info)**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ProfileID | INT (Identity) | Yes | Primary Key |
| UserID | INT | Yes | FK to AI_User |
| FirstName | NVARCHAR(100) | Yes | Multilingual support |
| LastName | NVARCHAR(100) | Yes | Multilingual support |
| Designation | NVARCHAR(100) | No | Job title |
| EmployeeId | INT | No | FK to HR_Employee |
| DoctorId | INT | No | FK to MasterDoctor |
| NurseId | INT | No | FK to MasterNurse |
| ProfilePictureUrl | NVARCHAR(500) | No | Path to image |

**Table: AI_Role**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| RoleID | INT (Identity) | Yes | Primary Key |
| RoleName | NVARCHAR(50) | Yes | e.g., Doctor, Cashier |
| CompanyId | INT | No | NULL for Global roles |
| Description | NVARCHAR(250) | No | Role purpose |

**Table: AI_UserRole**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| UserRoleID | INT (Identity) | Yes | Primary Key |
| UserID | INT | Yes | FK to AI_User |
| RoleID | INT | Yes | FK to AI_Role |
| IsPrimary | BIT | Yes | Default role flag |
| EffectiveDate | DATETIME | Yes | Assignment date |

**Table: UserBranch**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| UserBranchID | INT (Identity) | Yes | Primary Key |
| UserID | INT | Yes | FK to AI_User |
| BranchId | INT | Yes | FK to MasterBranch |
| IsPrimary | BIT | Yes | Default branch flag |

**Table: UserLoginHistory**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| LoginID | BIGINT (Identity)| Yes | Primary Key |
| UserID | INT | Yes | FK to AI_User |
| LoginTime | DATETIME | Yes | Timestamp |
| IPAddress | NVARCHAR(50) | Yes | Source IP |
| UserAgent | NVARCHAR(MAX) | No | Browser/Device info |
| Status | NVARCHAR(20) | Yes | Success, Failed, Locked |

### 11. Security Design
*   **Authentication**: Salted PBKDF2 or BCrypt hashing for passwords.
*   **Authorization**: Role-Based Access Control (RBAC) with hierarchical permission inheritance.
*   **2FA Readiness**: Schema includes `Is2FAEnabled` and `TwoFactorSecret` (for future implementation).
*   **SSO Readiness**: `ExternalProvider` and `ExternalUserId` columns in `AI_User` to support Google/Microsoft/OpenID.

### 12. Audit Design
*   **Change Tracking**: The `UserAuditLog` records the "Before" and "After" state of every column in `AI_User` and `UserProfile`.
*   **Actor Context**: Every log entry captures the `UserID` of the person performing the change and their `IPAddress`.

### 13. Mobile Ready Design
*   **Stateless Auth**: Designed to support JWT (JSON Web Tokens) for mobile API authentication.
*   **Device Fingerprinting**: Captures unique mobile device IDs for trusted device management.

### 14. API Ready Design
*   **RESTful Endpoints**: `/api/v2/users`, `/api/v2/roles`, `/api/v2/auth/login`.
*   **Standard Payloads**: JSON-based request/response with standard HTTP status codes.

### 15. Localization Requirements
*   **Resource Files**: All UI labels, error messages, and role names must be stored in `.resx` or JSON resource files.
*   **Directional CSS**: Support for `dir="rtl"` in Arabic/Urdu layouts.
*   **Unicode Support**: `NVARCHAR` used for all text columns to support Bangla, Hindi, and Arabic characters.

### 16. Future Expansion Plan
*   **Biometric Integration**: Support for fingerprint/face recognition via mobile SDK.
*   **AI-Based Anomaly Detection**: Identify suspicious login patterns (e.g., "Impossible Travel").
*   **Self-Service Portal**: Allow users to update their own contact info and security questions.

### 17. Acceptance Criteria
*   **Isolation**: A Company Admin from "Clinic A" cannot see or edit users from "Hospital B".
*   **Role Enforcement**: A user without the "Cashier" role cannot access the Billing screen.
*   **Lockout**: After 5 failed attempts, the `UserStatus` must automatically change to 'Locked'.
*   **Primary Branch**: A user's data entry must default to their `PrimaryBranch` unless manually changed.
*   **Audit**: Changing a user's `Email` must create a record in `UserAuditLog` showing the old and new email addresses.
*   **Multilingual**: Switching the system language to Arabic must flip the UI to RTL and display Arabic text from resources.
