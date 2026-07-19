## MODULE 10: Master Service Catalog

### 1. Executive Summary
The Master Service Catalog is the central repository for all billable services and investigations offered by the healthcare provider. It defines pricing, departmental ownership, and clinical parameters for each service.

### 2. Business Purpose
To standardize service definitions and pricing across the organization, ensuring consistent billing and accurate clinical ordering.

### 3. Actors
*   **Host Admin**: Manages the global service catalog (CompanyId NULL).
*   **Company Admin**: Manages company-specific services and overrides global prices.
*   **Billing Officer**: Views services for invoicing.
*   **Doctor/Nurse**: Views services for ordering investigations.

### 4. Functional Requirements
*   **Service Definition**: Name, Code, Short Name, Department, Category.
*   **Pricing Management**: Base Price, Default Price, and Tenant-specific price overrides.
*   **Service Attributes**: IsLabTest, IsSampleRequired, ResultMode (Numeric/Text/Template).
*   **Search & Filter**: Advanced filtering by Dept, Category, and Status.
*   **Service Status**: Activate/Deactivate services.

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: Services are scoped by `CompanyId`. Global services have `CompanyId NULL`.
*   **Performance**: High-speed lookup for billing and ordering screens.

### 6. Screen List
1.  **Service Catalog**: Main list of all services.
2.  **Service Entry**: Form for creating/editing services (HostMasterServiceEntry style).
3.  **Price Manager**: Bulk update for service prices.

### 7. ASCII Mockups
**Service Catalog**
```
--------------------------------------------------------------------------------
Master Service Catalog
--------------------------------------------------------------------------------
[Search Service...                ] [Dept: All v] [Cat: All v] [Search]

| Code | Service Name      | Department | Category   | Price   | Status |
|------|-------------------|------------|------------|---------|--------|
| CBC  | Complete Blood    | Pathology  | Blood Test | 500.00  | Active |
| XRY1 | Chest X-Ray       | Radiology  | X-Ray      | 1200.00 | Active |
| CONS | Consultation      | OPD        | General    | 800.00  | Active |

[+ Add Service]                                              [Print Catalog]
--------------------------------------------------------------------------------
```

### 8. Workflow
`Admin` -> `Define Service` -> `Assign Dept/Category` -> `Set Pricing` -> `Activate`.

### 9. Business Rules
*   Every service must have a unique `ServiceCode`.
*   Global services (CompanyId NULL) are visible to all tenants but prices can be overridden.
*   Lab tests must have `IsLabTest = 1` to appear in the LIS module.

### 10. Database Design
**Table: MasterService**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ServiceId | INT (Identity) | Yes | Primary Key |
| CompanyId | INT | No | NULL for Global, else Tenant ID |
| DepartmentId | INT | Yes | FK to MasterDepartment |
| CategoryId | INT | Yes | FK to MasterCategory |
| ServiceCode | NVARCHAR(20) | Yes | Unique code |
| ServiceName | NVARCHAR(200) | Yes | Display name |
| ShortName | NVARCHAR(50) | No | Abbreviation |
| BasePrice | DECIMAL(18,2) | Yes | Standard cost |
| DefaultPrice | DECIMAL(18,2) | Yes | Default selling price |
| IsLabTest | BIT | Yes | LIS integration flag |
| IsSampleRequired| BIT | Yes | Sample collection flag |
| IsActive | BIT | Yes | Logical active flag |

### 11. Security Design
*   Tenant-specific data isolation.
*   Only Admins can modify pricing.

### 12. Audit Design
*   Log all price changes and service status updates.

### 13. API Ready Design
*   Endpoints: `/api/v1/services`, `/api/v1/services/pricing`.

### 14. Mobile Ready Design
*   Searchable service list for mobile ordering.

### 15. Localization Requirements
*   Multilingual support for Service Names and Descriptions.

### 16. Future Expansion Plan
*   Service bundling (Packages).
*   AI-based dynamic pricing suggestions.

### 17. Acceptance Criteria
*   New service can be created and appears in Billing.
*   Service price can be updated and reflects in new invoices.
