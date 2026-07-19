## MODULE 28: Bed, Ward, Room & Occupancy Management

### 1. Executive Summary
The Bed, Ward, Room & Occupancy Management module is the logistical core of the Inpatient Department (IPD). It tracks the physical location and status of every bed across the hospital's hierarchy (Building → Floor → Ward → Room → Bed). By managing reservations, real-time occupancy, transfers, and housekeeping workflows, this module ensures optimal patient flow, maximizes revenue generation, and provides a clear, auditable trail of a patient's physical journey through the facility.

### 2. Business Purpose
To provide absolute visibility and control over hospital capacity. Beds are the primary revenue-generating assets for IPD; poor occupancy tracking leads to lost revenue, delayed admissions, and billing errors. This module eliminates manual bed boards, automates the housekeeping turnaround cycle, and ensures accurate billing durations for every bed a patient occupies.

### 3. Actors
*   **Admission Officer**: Reserves and allocates beds during the admission process.
*   **Bed Manager**: Oversees hospital-wide capacity and resolves bottlenecks.
*   **Ward In-Charge**: Manages transfers and discharges at the ward level.
*   **Staff Nurse**: Initiates transfer requests and discharge clearances.
*   **Housekeeping**: Receives cleaning requests and marks beds as available.
*   **Billing Officer**: Relies on accurate occupancy timestamps for invoicing.
*   **Tenant Admin**: Configures the location hierarchy and bed pricing categories.
*   **Host Admin**: Manages global system architecture.

### 4. Functional Requirements

#### A. Location Hierarchy
*   Strict hierarchical structure: `Hospital (Branch)` → `Building` → `Floor` → `Ward` → `Room` → `Bed`.

#### B. Bed Categories & Room Management
*   **Bed Categories**: General Bed, Cabin, Deluxe Cabin, ICU Bed, HDU Bed, NICU Bed, PICU Bed, Isolation Bed, Emergency Observation Bed.
*   **Room Attributes**: Room Number, Room Type, Capacity (number of beds), Gender Restriction (Male/Female/Mixed), Isolation Flag, VIP Flag.

#### C. Bed Status Lifecycle
*   `Available` → `Reserved` → `Occupied` → `Transfer Pending` → `Cleaning Required` → `Cleaning In Progress` → `Available`.
*   **Exception Statuses**: `Maintenance Hold`, `Blocked`, `Out Of Service`.

#### D. Bed Reservation & Waitlist
*   **Reservation Types**: Admission Request, Future Reservation (e.g., planned surgery), Emergency Hold.
*   **Tracking**: Reserved By, Reserved Time, Expiry Time (auto-release if patient doesn't arrive).
*   **Waitlist**: Manages Admission Queue and Priority Admissions when the hospital is at full capacity.

#### E. Bed Assignment & Transfer Workflow
*   **Assignment**: Links Patient, Admission ID, Bed ID, Start Time, and End Time.
*   **Transfers**: Ward to Ward (e.g., ICU downgrade), Room to Room, Bed to Bed.
*   **Governance**: A transfer requires a mandatory reason and updates the occupancy timestamps for both the old and new beds to ensure accurate billing.

#### F. Housekeeping Workflow
*   When a patient is transferred or discharged, the old bed automatically changes to `Cleaning Required`.
*   **Tracking**: Requested By, Assigned To (Housekeeping staff), Completed By, Completion Time.
*   Only Housekeeping (or an Admin) can change the status back to `Available`.

#### G. Maintenance Workflow
*   Beds requiring repair (e.g., broken motor, monitor issue) can be placed on `Maintenance Hold`.
*   System tracks maintenance history and prevents allocation until resolved.

#### H. Isolation Management
*   Rooms/Beds can be flagged for Contact, Droplet, or Airborne isolation.
*   **Rule**: If a multi-bed room has an Airborne isolation patient, the system must block the remaining beds in that room from being allocated to non-isolated patients.

#### I. Bed Charge Governance
*   Occupancy timestamps (Start/End) drive the billing engine.
*   Supports Hourly, Daily, and Package-Based billing rules.

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: All buildings, wards, and beds are strictly scoped by `CompanyId`.
*   **Branch-Aware**: A tenant with multiple physical hospitals manages them as separate branches within the hierarchy.
*   **Auditability**: 100% traceability of status changes, transfers, and cleaning cycles.
*   **Localization**: UI and master data support EN, BN, AR, UR, HI with RTL rendering.

### 6. Screen List
1.  Bed Occupancy Dashboard (KPIs)
2.  Visual Bed Board (Color-coded map)
3.  Bed Reservation Screen
4.  Bed Transfer Screen
5.  Housekeeping Screen (Task list)
6.  Maintenance Screen
7.  Waitlist Screen
8.  Mobile Occupancy View

### 7. Detailed ASCII Mockups
*(See `docs/28-BedWardRoomOccupancyManagement/Mockups/WireframeMockup.md`)*

### 8. Workflow Diagrams
*(See `docs/28-BedWardRoomOccupancyManagement/Mockups/ScreenFlow.md`)*

### 9. Business Rules
*   **CompanyId Mandatory**: No location or bed exists outside a tenant context.
*   **Double Occupancy Prevention**: A bed cannot be allocated if its status is `Occupied`, `Reserved`, `Cleaning Required`, or `Maintenance Hold`.
*   **Gender Restriction**: The system prevents allocating a male patient to a room flagged as `Female Only`.
*   **Transfer Billing**: A transfer automatically closes the billing duration for the previous bed and starts the clock for the new bed.

### 10. Database Design

**Table: HospitalBuilding**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| BuildingId | INT (PK) | Yes | Identity |
| CompanyId | INT | Yes | Tenant Context |
| BranchId | INT | Yes | |
| BuildingName | NVARCHAR(100)| Yes | e.g., Main Tower |

**Table: HospitalFloor**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| FloorId | INT (PK) | Yes | Identity |
| CompanyId | INT | Yes | |
| BuildingId | INT (FK) | Yes | |
| FloorName | NVARCHAR(50) | Yes | e.g., 3rd Floor |

**Table: HospitalWard**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| WardId | INT (PK) | Yes | Identity |
| CompanyId | INT | Yes | |
| FloorId | INT (FK) | Yes | |
| WardName | NVARCHAR(100)| Yes | e.g., General Medical |

**Table: HospitalRoom**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| RoomId | INT (PK) | Yes | Identity |
| CompanyId | INT | Yes | |
| WardId | INT (FK) | Yes | |
| RoomNumber | NVARCHAR(50) | Yes | |
| RoomType | NVARCHAR(50) | Yes | General, Cabin, ICU |
| GenderRestriction| NVARCHAR(10)| No | M, F, Mixed |
| IsIsolation | BIT | Yes | |

**Table: HospitalBed**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| BedId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| RoomId | INT (FK) | Yes | |
| BedNumber | NVARCHAR(50) | Yes | |
| CategoryId | INT (FK) | Yes | Link to Bed Pricing Category |
| Status | NVARCHAR(50) | Yes | Available, Occupied, Cleaning... |

**Table: BedReservation**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ReservationId| BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| BedId | BIGINT (FK)| Yes | |
| PatientId | BIGINT (FK)| Yes | |
| ReservedBy | INT (FK) | Yes | |
| ReservedTime | DATETIME | Yes | |
| ExpiryTime | DATETIME | Yes | |
| Status | NVARCHAR(20) | Yes | Active, Fulfilled, Expired |

**Table: BedOccupancy** (The core billing driver)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| OccupancyId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| AdmissionId | BIGINT (FK)| Yes | |
| PatientId | BIGINT (FK)| Yes | |
| BedId | BIGINT (FK)| Yes | |
| StartTime | DATETIME | Yes | |
| EndTime | DATETIME | No | NULL means currently occupied |
| Status | NVARCHAR(20) | Yes | Active, Transferred, Discharged |

**Table: BedTransfer**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| TransferId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| AdmissionId | BIGINT (FK)| Yes | |
| FromBedId | BIGINT (FK)| Yes | |
| ToBedId | BIGINT (FK)| Yes | |
| TransferTime | DATETIME | Yes | |
| Reason | NVARCHAR(200)| Yes | |
| RequestedBy | INT (FK) | Yes | |

**Table: BedCleaning**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| CleaningId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| BedId | BIGINT (FK)| Yes | |
| RequestedTime| DATETIME | Yes | |
| AssignedTo | INT (FK) | No | Housekeeping User |
| CompletedTime| DATETIME | No | |
| Status | NVARCHAR(20) | Yes | Pending, In Progress, Completed |

**Table: BedMaintenance**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| MaintenanceId| BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| BedId | BIGINT (FK)| Yes | |
| IssueReported| NVARCHAR(MAX)| Yes | |
| ReportedTime | DATETIME | Yes | |
| ResolvedTime | DATETIME | No | |
| Status | NVARCHAR(20) | Yes | Open, Resolved |

**Table: BedWaitList**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| WaitListId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| PatientId | BIGINT (FK)| Yes | |
| RequiredCategory| INT (FK) | Yes | e.g., Needs ICU Bed |
| Priority | INT | Yes | 1 (High) to 3 (Low) |
| AddedTime | DATETIME | Yes | |
| Status | NVARCHAR(20) | Yes | Waiting, Admitted, Cancelled |

*Note: All tables include `CreatedBy`, `CreatedOn`, `ModifiedBy`, `ModifiedOn`, `IsActive`.*
*Index Recommendations: Non-clustered indexes on `CompanyId`, `BedId`, `AdmissionId`, `Status`, and `RoomId`.*

### 11. Reports
*   **Occupancy Report**: Current and historical occupancy rates by Ward/Category.
*   **Bed Availability Report**: Real-time snapshot of vacant beds.
*   **Transfer Report**: Audit of patient movements and reasons.
*   **Cleaning Report**: Housekeeping TAT (Time from Discharge to Available).
*   **Maintenance Report**: Downtime analysis for broken beds.
*   **ICU Utilization Report**: Specific tracking of critical care capacity.
*   **Length Of Stay (LOS) Report**: Average days spent per admission/ward.

### 12. Dashboard Cards
*   Total Beds (Count)
*   Available Beds (Count)
*   Occupied Beds (Count / Percentage)
*   Reserved Beds (Count)
*   ICU Availability (Count / Critical Alert if 0)
*   Cleaning Pending (Count)

### 13. Acceptance Criteria
*   **Occupancy Management**: The system accurately calculates the total hours/days a patient spent in a specific bed for billing purposes.
*   **Reservation Workflow**: A reserved bed automatically returns to `Available` if the `ExpiryTime` passes without an admission.
*   **Transfer Workflow**: Transferring a patient automatically closes their `BedOccupancy` record for the old bed, opens a new one for the new bed, and sets the old bed to `Cleaning Required`.
*   **Cleaning Workflow**: Housekeeping staff can view a queue of dirty beds and mark them `Available` upon completion.
*   **Maintenance Workflow**: A bed on `Maintenance Hold` cannot be reserved or allocated.
*   **Auditability**: Every status change (Occupied, Cleaning, Available) is timestamped and linked to a User ID.
*   **SaaS Tenant Isolation**: The entire location hierarchy and occupancy data are strictly isolated by `CompanyId`.
*   **Multilingual Readiness**: Ward names, room types, and transfer reasons support RTL text entry (Arabic/Urdu).

### Appendix A – Enterprise Capacity Management

#### 1. Real-Time Bed Command Center
*   **Architecture**: A centralized, large-screen dashboard designed for the hospital's operational command center, providing a macro view of admissions, discharges, ED bottlenecks, and housekeeping TAT across all branches.

#### 2. Predictive Occupancy Forecasting
*   **Architecture**: Future integration of machine learning models to analyze historical admission trends, seasonal variations, and scheduled surgeries to predict bed shortages 24-72 hours in advance.

#### 3. AI Bed Allocation Roadmap
*   **Architecture**: An intelligent routing engine that suggests the optimal bed for a new admission based on diagnosis, gender, isolation requirements, and nursing workload balancing, rather than relying on manual selection.

#### 4. Disaster Surge Capacity Planning
*   **Architecture**: A configuration mode that allows Tenant Admins to instantly activate "Surge Beds" (e.g., converting PACU or hallways into temporary inpatient beds) during mass casualty incidents or pandemics, bypassing standard room capacity limits.

#### 5. Smart Housekeeping Dispatch
*   **Architecture**: Automated, location-aware dispatching of cleaning tasks to housekeeping staff via mobile devices, prioritizing beds needed for patients currently waiting in the Emergency Department or PACU.

#### 6. Smart Admission Queue Management
*   **Architecture**: Advanced waitlist logic that automatically sends SMS/WhatsApp notifications to patients when a bed of their requested category becomes available, managing the queue based on clinical priority and wait time.

#### 7. Bed Rate History
*   **Architecture**: A versioned pricing schema for bed categories. If a patient is admitted on January 1st at $100/day, and the hospital increases the rate to $120/day on January 5th, the billing engine uses the historical rate active on the specific date of occupancy to prevent retrospective billing errors.

#### 8. Gender Allocation Governance
*   **Architecture**: A dynamic rules engine for multi-bed rooms. If a room is designated as "Mixed" but currently empty, admitting a female patient instantly locks the remaining beds in that room to "Female Only" until the room is completely vacant again, preventing accidental mixed-gender allocations.

#### 9. Surge Capacity / Temporary Bed Expansion
*   **Architecture**: A specialized workflow allowing administrators to temporarily map non-traditional spaces (e.g., corridors, recovery rooms) as billable beds during mass casualty events or pandemics, without permanently altering the core architectural blueprint of the hospital.

#### 10. Bed Asset Attachment Management
*   **Architecture**: A relational mapping linking fixed or movable medical equipment (e.g., Ventilators, Infusion Pumps, specialized monitors) directly to a specific `BedId`. Allows the system to track equipment utilization alongside patient occupancy and prevents transferring a patient to a bed that lacks required life-support assets.

#### 11. Infection Control Lockdown Workflow
*   **Architecture**: A macro-level command for the Infection Control team to instantly "Lockdown" an entire Room, Ward, or Floor during an outbreak (e.g., MRSA, COVID-19). This overrides all standard availability, hard-blocking any new admissions or transfers into the locked zone until clinically cleared.

#### 12. Bed Occupancy Timeline Audit
*   **Architecture**: A visual, Gantt-chart style audit log showing the exact minute-by-minute state changes of a bed (e.g., Occupied → Cleaning Required → Cleaning In Progress → Available) over a 24-hour or 7-day period. Essential for resolving billing disputes and analyzing true utilization bottlenecks.