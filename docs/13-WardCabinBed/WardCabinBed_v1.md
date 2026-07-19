## MODULE 13: Ward / Cabin / Bed Management

### 1. Executive Summary
The Ward / Cabin / Bed Management module defines the physical inpatient infrastructure of the hospital. It tracks the hierarchy of wards, cabins (private rooms), and individual beds, including their types and pricing.

### 2. Business Purpose
To manage hospital bed capacity, enabling accurate inpatient admissions, transfers, and bed-based billing.

### 3. Actors
*   **Company Admin**: Configures the ward/bed hierarchy and pricing.
*   **Admission Officer**: Views bed availability for patient admission.
*   **Nurse**: Updates bed status (Occupied, Cleaning, Maintenance).

### 4. Functional Requirements
*   **Ward Definition**: Create Wards (e.g., General Ward, ICU, CCU).
*   **Cabin/Room Definition**: Create private rooms or cabins.
*   **Bed Definition**: Define individual beds, their types (Standard, Semi-Private, VIP), and pricing.
*   **Bed Status Tracking**: Available, Occupied, Cleaning, Maintenance.
*   **Pricing Management**: Daily rent per bed type.
*   **Branch Mapping**: Link wards/beds to specific branches.

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: Bed data is scoped by `CompanyId`.
*   **Real-time Visibility**: Bed status must be updated instantly to avoid double-booking.

### 6. Screen List
1.  **Ward/Bed List**: Hierarchical or grid view of all beds.
2.  **Ward/Bed Entry**: Form for defining wards, cabins, and beds.
3.  **Bed Occupancy Board**: Visual dashboard showing real-time bed status.

### 7. ASCII Mockups
**Bed Occupancy Board**
```
--------------------------------------------------------------------------------
Bed Occupancy Board > Main Branch
--------------------------------------------------------------------------------
Ward: [ ICU v ] [ Status: All v ] [ Refresh ]

| Bed No | Type | Status      | Patient Name       | Since      | Action |
|--------|------|-------------|--------------------|------------|--------|
| ICU-01 | VIP  | Occupied    | John Doe           | 2026-06-05 | [View] |
| ICU-02 | STD  | Available   | -                  | -          | [Admit]|
| ICU-03 | STD  | Cleaning    | -                  | -          | [Ready]|
| ICU-04 | STD  | Maintenance | -                  | -          | [Edit] |

[ Legend: ( ) Avail (x) Occ (/) Clean (!) Maint ]             [ Total: 4 ]
--------------------------------------------------------------------------------
```

### 8. Workflow
`Admin` -> `Create Ward` -> `Define Bed Types/Prices` -> `Add Beds` -> `Status: Available`.

### 9. Business Rules
*   Every bed must belong to a Ward or Cabin.
*   Bed pricing is used for daily IPD billing.
*   A bed cannot be "Occupied" if its status is "Cleaning" or "Maintenance".

### 10. Database Design
**Table: MasterWard**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| WardId | INT (Identity) | Yes | Primary Key |
| CompanyId | INT | Yes | FK to Company |
| BranchId | INT | Yes | FK to MasterBranch |
| Name | NVARCHAR(100) | Yes | e.g., ICU, Female Ward |
| IsActive | BIT | Yes | Logical active flag |

**Table: MasterBed**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| BedId | INT (Identity) | Yes | Primary Key |
| WardId | INT | Yes | FK to MasterWard |
| BedNo | NVARCHAR(50) | Yes | e.g., B-101 |
| BedType | NVARCHAR(50) | Yes | VIP, Standard, etc. |
| DailyRent | DECIMAL(18,2) | Yes | Price per day |
| Status | NVARCHAR(20) | Yes | Available, Occupied, etc. |
| IsActive | BIT | Yes | Logical active flag |

### 11. Security Design
*   Access restricted by `CompanyId` and `BranchId`.

### 12. Audit Design
*   Log all bed status changes and price updates.

### 13. API Ready Design
*   Endpoints: `/api/v1/wards`, `/api/v1/beds`, `/api/v1/beds/occupancy`.

### 14. Mobile Ready Design
*   Mobile view for nurses to update bed status during rounds.

### 15. Localization Requirements
*   Multilingual support for Ward Names and Bed Types.

### 16. Future Expansion Plan
*   Automated bed cleaning alerts.
*   Predictive bed occupancy analytics.

### 17. Acceptance Criteria
*   Admin can create a ward and add beds with pricing.
*   Bed status changes correctly during Admission and Discharge.
*   Bed rent is correctly calculated in the IPD final bill.
