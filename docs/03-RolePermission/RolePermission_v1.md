## MODULE 03: Role & Permission Management

### 1. Executive Summary
The Role & Permission Management module provides a granular authorization framework for ABSHealthcareLite. It implements a Role-Based Access Control (RBAC) system that allows administrators to define exactly what actions different users can perform across the platform. This module ensures that sensitive healthcare functions and data are only accessible to qualified personnel, maintaining the principle of least privilege.

### 2. Business Purpose
To protect patient data and system integrity by controlling access to specific pages, buttons, reports, and data operations. This module reduces the risk of unauthorized data modification, ensures compliance with healthcare regulations, and simplifies user administration by grouping permissions into logical roles.

### 3. Actors
*   **Host Admin**: Manages global/system-level roles and permissions across all tenants.
*   **Company Admin**: Manages company-specific roles and assigns permissions within their tenant's scope.
*   **Auditor**: Reviews permission assignments and access logs for compliance.

### 4. Functional Requirements
*   **Role Definition**: Create, edit, and deactivate roles (e.g., Senior Doctor, Junior Nurse).
*   **Permission Mapping**: Map specific permissions (View, Create, Edit, Delete, Approve, Print) to roles.
*   **Granular Control**: Control access at the Page level, Component level (Buttons/Tabs), and Report level.
*   **Hierarchical Roles**: (Optional/Future) Support for role inheritance.
*   **Permission Matrix**: A grid-based view to manage permissions across multiple roles simultaneously.
*   **Approval Levels**: Define which roles can approve specific transactions (e.g., Discount Approval, Refund Approval).

### 5. Non-Functional Requirements
*   **Security**: Permission checks must be enforced at both the UI (hiding elements) and the API/Server level.
*   **Performance**: Authorization checks must be cached to ensure zero latency during navigation.
*   **Isolation**: Tenant roles must be strictly separated by `CompanyId`.
*   **Auditability**: Every change to a role's permissions must be logged.

### 6. Screen List
1.  **Role List**: Overview of all defined roles.
2.  **Role Entry**: Form for creating/editing role names and descriptions.
3.  **Permission Matrix**: Centralized grid for mapping permissions to roles.
4.  **Page/Menu Access**: Configure which roles can see specific menu items.
5.  **Action Permissions**: Configure button-level access (Save, Delete, Approve).
6.  **Report Access**: Control visibility of specific analytical reports.

### 7. ASCII Mockups

**Permission Matrix**
```
--------------------------------------------------------------------------------
Role & Permission > Permission Matrix
--------------------------------------------------------------------------------
Module: [ Billing v ]  Role: [ Cashier v ]  [ Load Matrix ]

| Page / Action       | View | Create | Edit | Delete | Approve | Print |
|---------------------|------|--------|------|--------|---------|-------|
| Counter Billing     | [x]  | [x]    | [x]  | [ ]    | [ ]     | [x]   |
| Refund Processing   | [x]  | [ ]    | [ ]  | [ ]    | [ ]     | [ ]   |
| Discount Approval   | [ ]  | [ ]    | [ ]  | [ ]    | [ ]     | [ ]   |
| Daily Collection    | [x]  | [ ]    | [ ]  | [ ]    | [ ]     | [x]   |

[ Save Permissions ] [ Reset ] [ Export Matrix ]
--------------------------------------------------------------------------------
```

**Role Entry**
```
--------------------------------------------------------------------------------
Role Entry: [ Edit: Senior Doctor ]
--------------------------------------------------------------------------------
Role Name: [ Senior Doctor       ]  Status: (x) Active  ( ) Inactive
Description: [ Full clinical access including prescription approval ]

Copy Permissions From: [ Junior Doctor v ] [ Copy ]

[ Save Role ] [ Cancel ] [ Delete Role (Soft) ]
--------------------------------------------------------------------------------
```

### 8. Workflow
1.  **Define Role**: Admin creates a new role (e.g., "Lab Manager").
2.  **Assign Permissions**: Admin uses the Permission Matrix to check "View", "Create", and "Approve" for Lab-related pages.
3.  **Assign User**: Admin assigns the "Lab Manager" role to a specific user.
4.  **Access Enforcement**: When the user logs in, the system filters the menu and hides "Delete" buttons based on the assigned role.

### 9. Business Rules
*   **Company Scoping**: Roles created by a Company Admin are only visible within that company.
*   **Global Roles**: Host Admin can create "System Roles" that are available to all tenants.
*   **Immutable Admin**: The "Company Admin" role cannot have its core permissions revoked.
*   **Soft Delete**: Roles are never physically deleted; they are marked as `IsActive = 0`.
*   **Conflict Resolution**: If a user has multiple roles, permissions are additive (Union).

### 10. Database Design

**Table: AI_Role**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| RoleID | INT (Identity) | Yes | Primary Key |
| RoleName | NVARCHAR(100) | Yes | Display name |
| CompanyId | INT | No | NULL for Global, else Tenant ID |
| Description | NVARCHAR(500) | No | Role purpose |
| IsActive | BIT | Yes | Logical delete flag |

**Table: AI_Page**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| PageID | INT (Identity) | Yes | Primary Key |
| PageName | NVARCHAR(100) | Yes | Internal name |
| DisplayName | NVARCHAR(100) | Yes | Multilingual display |
| ModuleName | NVARCHAR(50) | Yes | e.g., Billing, LIS |
| Url | NVARCHAR(200) | Yes | Page path |

**Table: AI_Permission**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| PermissionID | INT (Identity) | Yes | Primary Key |
| RoleID | INT | Yes | FK to AI_Role |
| PageID | INT | Yes | FK to AI_Page |
| CanView | BIT | Yes | Read access |
| CanCreate | BIT | Yes | Insert access |
| CanEdit | BIT | Yes | Update access |
| CanDelete | BIT | Yes | Soft-delete access |
| CanApprove | BIT | Yes | Workflow approval access |
| CanPrint | BIT | Yes | Reporting access |

### 11. Security Design
*   **Server-Side Validation**: Every API request and Page_Load must verify permissions against the user's session roles.
*   **Token-Based Claims**: User roles and key permissions should be embedded in the JWT (for future API migration).

### 12. Audit Design
*   **Permission Changes**: Log every change in `AI_Permission` (Old Value vs New Value).
*   **Role Assignment**: Log when a user is added to or removed from a role.

### 13. API Ready Design
*   **Endpoints**: `/api/v1/roles`, `/api/v1/permissions/matrix`, `/api/v1/user/effective-permissions`.
*   **Middleware**: Authorization attributes on controllers to enforce role checks.

### 14. Mobile Ready Design
*   **Feature Flags**: Mobile app uses the same permission API to enable/disable modules (e.g., Doctor can see "Prescribe", Nurse cannot).

### 15. Localization Requirements
*   **Role Names**: Support for Bangla/Arabic translations in the database or resource files.
*   **UI Labels**: Matrix headers and page names must be localized.

### 16. Future Expansion Plan
*   **Data-Level Permissions**: Control access to specific records (e.g., Doctor can only see their own patients).
*   **Temporary Permissions**: Grant access for a specific duration.

### 17. Acceptance Criteria
*   **Isolation**: Company A cannot see Company B's custom roles.
*   **Enforcement**: User with "View Only" role cannot see the "Save" button.
*   **Audit**: Changing "CanDelete" for a role must be recorded in the audit log.
