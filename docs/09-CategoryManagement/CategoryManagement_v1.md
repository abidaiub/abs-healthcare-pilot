## MODULE 09: Category Management

### 1. Executive Summary
The Category Management module provides a secondary level of classification for services and items (e.g., Pathology -> Blood Test, Pharmacy -> Antibiotics). It helps in fine-grained organization and reporting.

### 2. Business Purpose
To allow for better organization of services and inventory items within departments, facilitating easier search and specialized reporting (e.g., revenue from "Blood Tests" vs "Imaging").

### 3. Actors
*   **Host Admin**: Manages global categories.
*   **Company Admin**: Manages company-specific categories.

### 4. Functional Requirements
*   **Create/Edit Category**: Define Category Name, Code, and parent Department.
*   **Category Status**: Activate/Deactivate categories.
*   **Type Mapping**: Define if the category is for Services, Pharmacy, or Inventory.

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: Categories are scoped by `CompanyId`.
*   **Usability**: Categories must be easily searchable during service selection.

### 6. Screen List
1.  **Category List**: Grid view of all categories.
2.  **Category Entry**: Form for category details.

### 7. ASCII Mockups
**Category List**
```
--------------------------------------------------------------------------------
Category Management > Category List
--------------------------------------------------------------------------------
[Search Category...               ] [Dept: All v] [Search]

| Code | Category Name | Department | Type    | Status   | Actions |
|------|---------------|------------|---------|----------|---------|
| BLD  | Blood Test    | Pathology  | Service | Active   | [Edit]  |
| XRAY | X-Ray         | Radiology  | Service | Active   | [Edit]  |
| ANT  | Antibiotics   | Pharmacy   | Item    | Active   | [Edit]  |

[+ Add Category]                                             [Export]
--------------------------------------------------------------------------------
```

### 8. Workflow
`Admin` -> `Select Department` -> `Create Category` -> `Activate`.

### 9. Business Rules
*   Categories must be linked to a Department.
*   Category names must be unique within a Department.
*   Soft delete only.

### 10. Database Design
**Table: MasterCategory**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| CategoryId | INT (Identity) | Yes | Primary Key |
| CompanyId | INT | No | NULL for Global, else Tenant ID |
| DepartmentId | INT | Yes | FK to MasterDepartment |
| CategoryCode | NVARCHAR(20) | Yes | Unique code |
| Name | NVARCHAR(200) | Yes | Category name |
| CategoryType | NVARCHAR(50) | Yes | Service, Item, etc. |
| IsActive | BIT | Yes | Logical active flag |

### 11. Security Design
*   Access restricted by `CompanyId`.

### 12. Audit Design
*   Log all changes to category definitions.

### 13. API Ready Design
*   Endpoints: `/api/v1/categories`.

### 14. Mobile Ready Design
*   Categorized lists for mobile service selection.

### 15. Localization Requirements
*   Multilingual support for Category Names.

### 16. Future Expansion Plan
*   Sub-category support (3rd level nesting).

### 17. Acceptance Criteria
*   Admin can create a category under a department.
*   Category is available when creating a new service.
