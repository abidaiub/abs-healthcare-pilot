## MODULE 01: Company/Tenant Management

### 1. Executive Summary
The Company/Tenant Management module is the foundational core of the ABSHealthcareLite multi-tenant SaaS platform. It governs the lifecycle of every hospital, clinic, and diagnostic center (tenants) onboarded to the system. This module ensures strict data isolation, manages subscription-based access, and provides granular control over company-specific branding and reporting configurations.

### 2. Business Purpose
To provide a centralized administrative interface for host-level management of tenants while allowing individual companies to customize their operational environment. It facilitates the transition from trial to active status, manages license enforcement, and ensures that all tenant-specific data is securely partitioned using a robust `CompanyId` scoping mechanism.

### 3. Actors
- **Host Admin**: Global administrator with full visibility and control over all tenants, licenses, and system-wide configurations.
- **Company Admin**: Tenant-level administrator restricted to managing their own company’s users, settings, and reports.
- **Auditor**: Read-only access to audit logs and usage snapshots for compliance and verification purposes.

### 4. Functional Requirements
- **Tenant Onboarding**: Create and configure new companies with unique codes and metadata.
- **Lifecycle Management**: Manage company status (Trial, Active, Suspended, Expired, Archived).
- **License Control**: Define subscription tiers, license durations, user limits, and branch limits.
- **Branding & Report Setup**: Configure logos, report headers/footers, and print layouts (margins, orientation).
- **Feature Toggling**: Enable or disable specific modules/features per company.
- **Usage Monitoring**: Track active users and system utilization via snapshots.
- **Audit Logging**: Capture every administrative change made to company settings or licenses.

### 5. Non-Functional Requirements
- **Data Isolation**: Strict row-level security using `CompanyId`.
- **Portability**: Schema uses standard SQL Server types to ensure future database portability.
- **Scalability**: Support for thousands of concurrent tenants with minimal performance overhead.
- **Localization Ready**: Support for English, Bangla, and Arabic (RTL) layouts in reports and UI.

### 6. Complete Screen List
- **Company List**: Overview of all tenants with status filters.
- **Company Entry**: Form for creating and editing core company metadata.
- **License & Subscription**: Management of tiers, dates, and resource limits.
- **Report/Branding Setup**: Visual and layout configuration for company documents.
- **Feature Toggle**: Checkbox-based interface for enabling/disabling module access.
- **Usage Dashboard**: Visual summary of tenant activity and resource consumption.
- **Company Audit Log**: Historical trail of all changes to company configurations.

### 7. Detailed Screen Mockups (ASCII)

**Company List**
```
--------------------------------------------------------------------------------
Company/Tenant Catalog
--------------------------------------------------------------------------------
[Search Company Name/Code...       ] [Status: All v] [Tier: All v] [Search]

| Code | Company Name         | Type       | Status    | Tier       | Actions  |
|------|----------------------|------------|-----------|------------|----------|
| H001 | City General Hosp    | Hospital   | Active    | Enterprise | [Edit]   |
| C042 | Lakeside Clinic      | Clinic     | Suspended | Standard   | [Edit]   |
| D009 | QuickLab Diagnostic  | Diagnostic | Expired   | Pro        | [Edit]   |

[+ Create New Company]                                         [Export Report]
--------------------------------------------------------------------------------
```

**Report/Branding Setup**
```
--------------------------------------------------------------------------------
Report & Branding Configuration: City General Hosp
--------------------------------------------------------------------------------
Logo URL: [ http://storage.abs.com/h001/logo.png ] [Browse]
Theme Color: [#0055AA]

Report Header Text:
[ Main Branch, 123 Healthcare Ave, Dhaka                                     ]
Report Footer Text:
[ Thank you for choosing City General Hospital                                ]

Layout Settings:
Paper Size: [A4 v]   Orientation: [Portrait v]   Language: [English v]
Top Margin: [0.5"]   Bottom Margin: [0.5"]       Header Height: [1.2"]
Left Margin: [0.7"]  Right Margin: [0.7"]       Footer Height: [0.8"]

[x] Use Pre-Printed Pad (Hide Header/Footer on Print)

Signature 1: [ Medical Officer ]    Signature 2: [ Lab In-Charge ]

[Save Configuration] [Preview Sample Report] [Cancel]
--------------------------------------------------------------------------------
```

### 8. Workflow Diagrams

**Tenant Onboarding Workflow**
`Host Admin` -> `Create Company` -> `Configure License` -> `Assign Company Admin` -> `Setup Branding` -> `Activate`

**Suspension/Expirations Workflow**
`License Expiry` -> `System Warning` -> `Grace Period` -> `Status: Expired` -> `Restricted Access` -> `Status: Archived`

### 9. Business Rules
- **Data Scoping**: Host/global master data uses `CompanyId NULL`. All tenant-specific data **must** have a valid `CompanyId`.
- **Access Control**: Company Admins are strictly isolated to their own `CompanyId`. Host Admins have cross-tenant visibility.
- **Transaction Restrictions**:
    - **Suspended**: Cannot create new transactions (bills, orders) but can view/print existing reports.
    - **Expired**: Shows persistent license warning; 7-day grace period before moving to Suspended.
    - **Archived**: Entire company context becomes read-only; no new data entry allowed.
- **Immutability**: Existing data must never be physically deleted; use `IsActive = 0` or `Status = 'Archived'`.
- **Audit Requirement**: Any change to `Company`, `CompanyLicense`, or `CompanyBranding` must generate a record in `CompanyAuditLog`.

### 10. Database Design

**Table: Company (Primary Tenant Table)**
| Column | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| CompanyId | INT (Identity) | Yes | Primary Key |
| CompanyCode | NVARCHAR(20) | Yes | Unique short code |
| CompanyName | NVARCHAR(200) | Yes | Display name |
| LegalName | NVARCHAR(200) | No | Registered legal name |
| CompanyType | NVARCHAR(50) | Yes | Hospital, Clinic, etc. |
| Country | NVARCHAR(100) | Yes | Operating country |
| TimeZone | NVARCHAR(100) | Yes | Local timezone |
| PrimaryContactName | NVARCHAR(100) | Yes | Main contact person |
| PrimaryContactEmail | NVARCHAR(150) | Yes | Main contact email |
| PrimaryContactPhone | NVARCHAR(50) | Yes | Main contact phone |
| Address | NVARCHAR(MAX) | No | Physical address |
| Status | NVARCHAR(20) | Yes | Active, Suspended, etc. |
| SubscriptionTier | NVARCHAR(50) | Yes | Standard, Pro, Enterprise |
| LicenseStartDate | DATETIME | Yes | Start of current license |
| LicenseEndDate | DATETIME | Yes | End of current license |
| MaxUsers | INT | Yes | User limit |
| MaxBranches | INT | Yes | Branch limit |
| IsActive | BIT | Yes | Logical active flag |
| IsSuspended | BIT | Yes | Suspension flag |
| SuspensionReason | NVARCHAR(500) | No | Reason for suspension |
| CreatedBy | INT | Yes | User ID of creator |
| CreatedDate | DATETIME | Yes | Timestamp of creation |
| ModifiedBy | INT | No | User ID of last modifier |
| ModifiedDate | DATETIME | No | Timestamp of last modification |

**Table: CompanyBrandingSetting**
| Column | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| BrandingId | INT (Identity) | Yes | Primary Key |
| CompanyId | INT | Yes | FK to Company |
| LogoUrl | NVARCHAR(500) | No | Path to logo image |
| ReportHeaderText | NVARCHAR(MAX) | No | Custom header text |
| ReportFooterText | NVARCHAR(MAX) | No | Custom footer text |
| PaperSize | NVARCHAR(20) | Yes | A4, Letter, etc. |
| Orientation | NVARCHAR(20) | Yes | Portrait, Landscape |
| HeaderHeight | DECIMAL(5,2) | Yes | Height in inches |
| FooterHeight | DECIMAL(5,2) | Yes | Height in inches |
| TopBlankSpace | DECIMAL(5,2) | Yes | Space for pre-printed pads |
| BottomBlankSpace | DECIMAL(5,2) | Yes | Space for pre-printed pads |
| LeftMargin | DECIMAL(5,2) | Yes | Margin in inches |
| RightMargin | DECIMAL(5,2) | Yes | Margin in inches |
| UsePrePrintedPad | BIT | Yes | Toggle header/footer visibility |
| SignatureBlock1 | NVARCHAR(100) | No | Label for signature 1 |
| SignatureBlock2 | NVARCHAR(100) | No | Label for signature 2 |
| DefaultLanguage | NVARCHAR(10) | Yes | EN, BN, AR |
| ThemeColor | NVARCHAR(10) | No | Hex code |

**Supporting Tables**
- `CompanyFeature`: Maps `CompanyId` to `FeatureCode` and `IsEnabled`.
- `CompanyLicenseHistory`: Historical log of every license renewal or tier change.
- `CompanyNotificationSetting`: Configures SMS/Email/WhatsApp alerts per tenant.
- `CompanyUsageSnapshot`: Periodic capture of `ActiveUserCount`, `TransactionCount`, etc.
- `CompanyAuditLog`: Logs `TableName`, `RecordId`, `OldValue`, `NewValue`, `ActionBy`, `ActionDate`.

### 11. SaaS Licensing Design
- **Tier-Based Access**: Features like "AI Suggestions" or "Advanced Analytics" are restricted to Pro/Enterprise tiers.
- **Resource Quotas**: Hard limits on `MaxUsers` and `MaxBranches` enforced at the application layer.
- **External Key**: A `PublicId (GUID)` is generated for each company for use in external API integrations and public-facing URLs.

### 12. Subscription Model
- **Trial**: 14-day full feature access.
- **Standard**: Core modules (OPD, Billing, Patient Management).
- **Pro**: Standard + Pharmacy, Inventory, LIS.
- **Enterprise**: All modules + AI/Adaptive Engine + Multi-branch support.

### 13. Company Branding Model
The branding model uses a "CSS Variable Injection" approach for the UI (ThemeColor) and a "Template Override" approach for reports. If `UsePrePrintedPad` is enabled, the system suppresses the `ReportHeaderText` and `LogoUrl` during the print process to accommodate physical letterheads.

### 14. Security Requirements
- **Row-Level Security**: Every SQL query must include `AND CompanyId = @CurrentCompanyId`.
- **Admin Isolation**: Company Admins cannot view or modify `SubscriptionTier` or `LicenseEndDate`.
- **Data Encryption**: Sensitive contact information is encrypted at rest.

### 15. Audit Requirements
- All changes to the `Company` and `CompanyBrandingSetting` tables must be captured.
- Audit logs must include the Source IP and User Agent of the administrator making the change.

### 16. Notification Requirements
- **Expiry Alerts**: Automated notifications at 30, 7, and 1 day before `LicenseEndDate`.
- **Suspension Notice**: Immediate email/SMS to `PrimaryContactEmail` when `IsSuspended` is toggled.

### 17. API Ready Design
- All company settings are accessible via a RESTful API (`/api/v1/companies/{id}/settings`).
- Supports JSON-based configuration payloads for bulk onboarding.

### 18. Mobile Ready Design
- The Company Dashboard is optimized for mobile browsers to allow Host Admins to suspend/activate tenants on the go.
- Branding settings include a "Mobile Logo" option for smaller screen headers.

### 19. Future Expansion Plan
- **Multi-Region Support**: Ability to specify `DataRegion` for GDPR/compliance.
- **White-Labeling**: Custom domain mapping (e.g., `portal.cityhospital.com`).
- **AI-Onboarding**: Automated configuration suggestions based on `CompanyType`.

### 20. Acceptance Criteria
- **Onboarding**: Host Admin can successfully save a new company and assign a tier.
- **Isolation**: A user from Company A cannot see any data from Company B.
- **Enforcement**: A company with `Status = 'Suspended'` is blocked from saving a new `InvestigationOrder`.
- **Branding**: Changes to `ReportHeaderText` are immediately reflected in the "Print Preview" of a bill.
- **Audit**: Every change to `MaxUsers` appears in the `CompanyAuditLog` with the correct `OldValue` and `NewValue`.
- **License**: An expired company shows a prominent red banner on all screens.
