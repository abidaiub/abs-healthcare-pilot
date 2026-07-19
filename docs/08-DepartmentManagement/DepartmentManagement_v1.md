## MODULE 08: Department Management

### 1. Executive Summary
The Department Management module defines the functional divisions within a healthcare organization (e.g., Cardiology, Radiology, Accounts). It serves as a grouping mechanism for services, staff, and clinical workflows.

### 2. Business Purpose
To organize the hospital's operations into manageable units, allowing for departmental reporting, resource allocation, and specialized service categorization.

### 3. Actors
*   **Host Admin**: Manages global departments (Master List).
*   **Company Admin**: Manages departments within their company.
*   **Department Manager**: Views departmental performance and staff.

### 4. Functional Requirements
*   **Create/Edit Department**: Define Department Name, Code, and Type (Clinical, Administrative, etc.).
*   **Department Status**: Activate/Deactivate departments.
*   **Branch Mapping**: Link departments to specific branches.
*   **Service Mapping**: Group services under departments.

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: Departments are scoped by `CompanyId`.
*   **Performance**: Fast lookup for dropdowns in clinical and billing screens.

### 6. Screen List
1.  **Department List**: Grid view of all departments.
2.  **Department Entry**: Form for department details.

### 7. ASCII Mockups
**Department List**
```
--------------------------------------------------------------------------------
Department Management > Department List
--------------------------------------------------------------------------------
[Search Department...             ] [Branch: All v] [Search]

| Code | Department Name | Type     | Branch         | Status   | Actions |
|------|-----------------|----------|----------------|----------|---------|
| CARD | Cardiology      | Clinical | Main Branch    | Active   | [Edit]  |
| RAD  | Radiology       | Clinical | Main Branch    | Active   | [Edit]  |
| ACCT | Accounts        | Admin    | North Clinic   | Active   | [Edit]  |

[+ Add Department]                                           [Export]
--------------------------------------------------------------------------------
```

### 8. Workflow
`Admin` -> `Create Department` -> `Assign to Branch` -> `Map Services/Staff`.

### 9. Business Rules
*   Departments can be "Global" (Host-defined) or "Tenant-specific".
*   A department must be active to be selected in other modules.
*   Soft delete only.

### 10. Database Design
**Table: MasterDepartment**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| DepartmentId | INT (Identity) | Yes | Primary Key |
| CompanyId | INT | No | NULL for Global, else Tenant ID |
| DeptCode | NVARCHAR(20) | Yes | Unique code |
| Name | NVARCHAR(200) | Yes | Department name |
| DeptType | NVARCHAR(50) | Yes | Clinical, Admin, etc. |
| IsActive | BIT | Yes | Logical active flag |
| CreatedDate | DATETIME | Yes | Timestamp |

### 11. Security Design
*   Access restricted by `CompanyId`.
*   Role-based access to departmental reports.

### 12. Audit Design
*   Log changes to department names and status.

### 13. API Ready Design
*   Endpoints: `/api/v1/departments`.

### 14. Mobile Ready Design
*   Dropdown support for department selection in mobile apps.

### 15. Localization Requirements
*   Multilingual support for Department Names.

### 16. Future Expansion Plan
*   Departmental budget tracking.
*   AI-based resource optimization per department.

### 17. Acceptance Criteria
*   Admin can create a department and link it to a branch.
*   Department appears in the Service Catalog dropdown.
