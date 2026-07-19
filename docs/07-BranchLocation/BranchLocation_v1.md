## MODULE 07: Branch / Location Management

### 1. Executive Summary
The Branch / Location Management module enables multi-branch operations within a single tenant (Company). It allows healthcare organizations to define physical locations, clinics, or hospital branches, each with its own contact details, operational settings, and resource mapping.

### 2. Business Purpose
To support hospital chains and multi-location clinics by providing a unified system where data is partitioned by branch while remaining under a single company umbrella. This ensures accurate reporting, inventory tracking, and patient routing per physical location.

### 3. Actors
*   **Host Admin**: Views all branches across all companies (Global View).
*   **Company Admin**: Manages branches within their own company.
*   **Branch Manager**: Oversees operations and settings for a specific branch.

### 4. Functional Requirements
*   **Create/Edit Branch**: Capture Branch Name, Code, Address, Contact Info, and License details.
*   **Branch Status**: Activate/Deactivate branches (Soft Delete).
*   **Branch Configuration**: Set branch-specific time zones, currency formats, and operational hours.
*   **Primary Branch**: Designate a main branch for the company.
*   **Resource Mapping**: Link departments and users to specific branches.

### 5. Non-Functional Requirements
*   **Tenant Isolation**: All branches must belong to a `CompanyId`.
*   **Performance**: Branch-based data filtering must be optimized using indexed `BranchId` columns.
*   **Scalability**: Support for hundreds of branches per company.

### 6. Screen List
1.  **Branch List**: Searchable grid of all branches.
2.  **Branch Entry**: Form for creating/editing branch details.
3.  **Branch Settings**: Configuration for branch-specific operational rules.

### 7. ASCII Mockups
**Branch List**
```
--------------------------------------------------------------------------------
Branch Management > Branch List
--------------------------------------------------------------------------------
[Search Branch Name/Code...       ] [Status: All v] [Search]

| Code | Branch Name       | Location       | Status   | Actions  |
|------|-------------------|----------------|----------|----------|
| B001 | Main City Branch  | Dhaka Central  | Active   | [Edit]   |
| B002 | North Clinic      | Uttara         | Active   | [Edit]   |
| B003 | South Diagnostic  | Dhanmondi      | Inactive | [Edit]   |

[+ Create New Branch]                                         [Export]
--------------------------------------------------------------------------------
```

### 8. Workflow
`Company Admin` -> `Create Branch` -> `Configure Details` -> `Assign Users/Departments` -> `Activate`.

### 9. Business Rules
*   Every branch must have a unique `BranchCode` within the company.
*   A company must have at least one `Active` branch.
*   Users can be mapped to multiple branches but must have one `PrimaryBranch`.
*   Transactions (Bills, Orders) are strictly tied to a `BranchId`.

### 10. Database Design
**Table: MasterBranch**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| BranchId | INT (Identity) | Yes | Primary Key |
| CompanyId | INT | Yes | FK to Company |
| BranchCode | NVARCHAR(20) | Yes | Unique code |
| BranchName | NVARCHAR(200) | Yes | Display name |
| Address | NVARCHAR(MAX) | No | Physical address |
| Phone | NVARCHAR(50) | No | Contact phone |
| Email | NVARCHAR(150) | No | Contact email |
| IsActive | BIT | Yes | Logical active flag |
| CreatedBy | INT | Yes | User ID |
| CreatedDate | DATETIME | Yes | Timestamp |

### 11. Security Design
*   **Branch-Level Access**: Users can only see data for branches they are assigned to.
*   **Company Isolation**: `CompanyId` is mandatory for all queries.

### 12. Audit Design
*   Log all changes to branch metadata and status in `UserAuditLog`.

### 13. API Ready Design
*   Endpoints: `/api/v1/branches`, `/api/v1/branches/{id}`.

### 14. Mobile Ready Design
*   Responsive branch selection for mobile users.

### 15. Localization Requirements
*   Support for multilingual Branch Names and Addresses (English, Bangla, Arabic, Urdu, Hindi).

### 16. Future Expansion Plan
*   Geofencing for mobile check-ins.
*   Branch-wise profit and loss analytics.

### 17. Acceptance Criteria
*   Admin can create a branch and assign it to a company.
*   Users can switch between assigned branches.
*   Reports can be filtered by `BranchId`.
