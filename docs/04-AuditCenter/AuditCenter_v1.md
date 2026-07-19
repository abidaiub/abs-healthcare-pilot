## MODULE 04: Audit Center

### 1. Executive Summary
The Audit Center is the transparency and compliance layer of ABSHealthcareLite. It tracks all significant activities across the platform, including data modifications, login events, and administrative changes. It provides a tamper-evident record of "Who did What, When, and from Where," which is critical for healthcare regulatory compliance and internal security.

### 2. Business Purpose
To ensure accountability, detect unauthorized access, and provide a historical record for troubleshooting and legal verification. In a healthcare context, auditing is mandatory to track access to sensitive patient health information (PHI) and financial transactions.

### 3. Actors
*   **Host Admin**: Views global audit logs across all tenants.
*   **Company Admin**: Monitors activities within their own company.
*   **Auditor / Compliance Officer**: Specialized role for reviewing logs and generating compliance reports.

### 4. Functional Requirements
*   **Data Audit (CRUD)**: Track changes to database records (Old Value, New Value, Field Name).
*   **Login Audit**: Record successful logins, failed attempts, and account lockouts.
*   **Security Audit**: Log changes to roles, permissions, and security settings.
*   **Access Audit**: Track who viewed sensitive patient profiles.
*   **Audit Search**: Advanced filtering by Date, User, Company, Module, and Action Type.
*   **Audit Export**: Export logs to PDF/Excel for external reporting.
*   **Retention Management**: Configure how long logs are kept before archiving.

### 5. Non-Functional Requirements
*   **Immutability**: Audit logs must be read-only; no user (including admins) can edit or delete them.
*   **Performance**: Auditing should be asynchronous or highly optimized to avoid slowing down main transactions.
*   **Storage Efficiency**: Use structured JSON or compressed formats for storing large "Old/New" value sets.
*   **Real-time**: Logs should be available for viewing within seconds of the action.

### 6. Screen List
1.  **Audit Dashboard**: Visual summary of recent activities and security alerts.
2.  **Data Change Log**: Detailed view of record-level modifications.
3.  **Login History**: Log of all authentication events.
4.  **Security Event Log**: Changes to permissions and system configurations.
5.  **Audit Settings**: Configure log retention and sensitivity levels.

### 7. ASCII Mockups

**Data Change Log**
```
--------------------------------------------------------------------------------
Audit Center > Data Change Log
--------------------------------------------------------------------------------
Date Range: [ 2026-06-01 ] to [ 2026-06-07 ]  User: [ All v ]  Module: [ Billing v ]

| Timestamp           | User      | Action | Table        | Record ID | Details |
|---------------------|-----------|--------|--------------|-----------|---------|
| 2026-06-07 10:15:22 | cashier01 | UPDATE | ServiceSale  | INV-9901  | [View]  |
| 2026-06-07 09:45:10 | admin_co  | INSERT | AI_User      | 105       | [View]  |
| 2026-06-06 14:20:05 | dr.ahmed  | UPDATE | Prescription | RX-552    | [View]  |

[ Export PDF ] [ Export Excel ] [ Refresh ]
--------------------------------------------------------------------------------
```

**Change Detail View (Popup)**
```
--------------------------------------------------------------------------------
Change Detail: ServiceSale (INV-9901)
--------------------------------------------------------------------------------
User: cashier01 | Date: 2026-06-07 10:15:22 | IP: 192.168.1.55

| Field Name     | Old Value      | New Value      |
|----------------|----------------|----------------|
| DiscountAmount | 0.00           | 50.00          |
| TotalAmount    | 500.00         | 450.00         |
| Remarks        | NULL           | Staff Discount |

[ Close ]
--------------------------------------------------------------------------------
```

### 8. Workflow
1.  **Action Triggered**: A user saves a change (e.g., updates a patient's address).
2.  **Capture Change**: The application layer compares the old entity with the new entity.
3.  **Write Log**: A record is inserted into `AI_AuditLog` with the timestamp, user ID, and the diff.
4.  **Review**: An auditor searches the logs to verify the change.

### 9. Business Rules
*   **Company Scoping**: Audit logs must always include `CompanyId`.
*   **No Delete**: Physical deletion of audit records is strictly prohibited.
*   **Sensitive Fields**: Passwords and credit card numbers must **never** be stored in audit logs (even hashed).
*   **Retention**: Default retention is 1 year, after which logs move to cold storage.

### 10. Database Design

**Table: AI_AuditLog**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| AuditID | BIGINT (Identity)| Yes | Primary Key |
| CompanyId | INT | No | NULL for Host, else Tenant ID |
| UserID | INT | Yes | Actor who performed the action |
| ActionType | NVARCHAR(20) | Yes | INSERT, UPDATE, DELETE, LOGIN, etc. |
| TableName | NVARCHAR(100) | No | Database table affected |
| RecordID | NVARCHAR(100) | No | Primary key of the affected record |
| ChangeData | NVARCHAR(MAX) | No | JSON or XML of changes (Old vs New) |
| IPAddress | NVARCHAR(50) | Yes | Source IP of the actor |
| UserAgent | NVARCHAR(MAX) | No | Browser/Device info |
| CreatedDate | DATETIME | Yes | Timestamp of the event |

### 11. Security Design
*   **Tamper Evidence**: (Future) Use cryptographic hashing to link audit records, ensuring any deletion or modification is detectable.
*   **Access Control**: Only users with the "Auditor" or "Company Admin" role can view the Audit Center.

### 12. Audit Design
*   **Self-Auditing**: The Audit Center must audit access to itself (i.e., log when an auditor views the logs).

### 13. API Ready Design
*   **Endpoints**: `/api/v1/audit/logs`, `/api/v1/audit/summary`.
*   **Streaming**: (Future) Support for streaming logs to external SIEM tools.

### 14. Mobile Ready Design
*   **Alerts**: Push notifications for critical audit events (e.g., "Admin Password Changed").

### 15. Localization Requirements
*   **Action Names**: "UPDATE", "INSERT" should be translated in the UI.
*   **Timestamps**: Display in the user's local timezone and format.

### 16. Future Expansion Plan
*   **AI Anomaly Detection**: Automatically flag "impossible" actions or bulk data exports.
*   **Blockchain Integration**: Store audit hashes on a private ledger for ultimate immutability.

### 17. Acceptance Criteria
*   **Completeness**: Every change to the `Company` or `AI_User` table is logged.
*   **Integrity**: No UI exists to delete audit logs.
*   **Searchability**: Auditor can find all changes made by "User X" on "Date Y".
*   **Clarity**: The "Old Value" vs "New Value" view is easy to read.
