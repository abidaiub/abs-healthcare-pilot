## MODULE 21: Sample Collection & Laboratory Workflow

### 1. Executive Summary
The Sample Collection & Laboratory Workflow module controls the complete lifecycle of a clinical specimen, from the moment an investigation is ordered to the point it is ready for result entry. It bridges the gap between patient billing/ordering and the laboratory, ensuring accurate identification via barcode labels, strict chain of custody, and efficient routing to specialized lab departments.

### 2. Business Purpose
To eliminate pre-analytical errors (such as mislabeling or lost samples) and ensure a seamless, auditable flow of specimens through the hospital. By enforcing barcode-driven workflows and structured rejection/recollection protocols, this module guarantees patient safety and improves laboratory turnaround times (TAT).

### 3. Actors
*   **Patient**: Provides the sample.
*   **Reception / Billing User**: Generates the investigation order.
*   **Phlebotomist / Sample Collector**: Prints labels and physically collects the sample.
*   **Lab Reception User**: Receives samples into the laboratory.
*   **Lab Technologist**: Processes the sample in specific departments.
*   **Lab Supervisor**: Monitors queues, approves rejections, and oversees TAT.
*   **Doctor**: Views sample status (e.g., "Pending Collection", "Processing").
*   **Tenant Admin**: Configures branch-specific lab workflows.
*   **Host Admin**: Manages global sample types and container catalogs.

### 4. Functional Requirements

#### A. Sample & Container Management
*   **Sample Types**: Blood, Urine, Stool, Sputum, Swab, Semen, CSF, Biopsy, Histopathology specimen, Culture sample.
*   **Container/Tube Types**: EDTA tube, Plain tube, Fluoride tube, Citrate tube, Urine container, Stool container, Swab container, Histopathology container.

#### B. Multi-Sample Support
*   One order can contain multiple tests.
*   One test may require one specific sample.
*   Multiple tests (e.g., CBC and HbA1c) can share a single sample (e.g., one EDTA tube).
*   One order can generate multiple tubes routed to different departments.

#### C. Barcode & Label Workflow
*   **Generation**: System automatically determines required tubes based on ordered tests and generates unique barcodes.
*   **Label Content**: Patient Name, Patient ID, Order No, Sample No, Barcode/QR, Test Name/Group, Sample Type, Collection DateTime, Branch, Department.

#### D. Sample Status Lifecycle
*   `Ordered` → `Pending Collection` → `Collected` → `In Transit` → `Received` → `Processing` → `Completed`.
*   **Exception Statuses**: `Rejected`, `Recollection Required`, `Cancelled`.

#### E. Rejection & Recollection
*   **Reasons**: Hemolyzed sample, Insufficient quantity, Wrong container, Wrong label, Broken container, Delayed transport, Contaminated sample, Patient not prepared, Fasting requirement not met.
*   **Workflow**: Marking a sample as `Rejected` triggers a `Recollection Required` status, notifying the patient/phlebotomist and linking the new sample to the original order.

#### F. Lab Department Routing
*   Samples are routed to specific queues: Hematology, Biochemistry, Microbiology, Immunology, Serology, Histopathology.

#### G. Chain of Custody
*   Track every touchpoint: Collected By/At, Received By/At, Transferred By/At, Rejected By/At, along with Reasons and Remarks.

#### H. LIS / Analyzer Readiness (Future Roadmap)
*   Architecture supports future mapping of `SampleBarcode` to `MachineSampleID`.
*   Interface queues for HL7 bidirectional communication with analyzers.

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: All data strictly scoped by `CompanyId`.
*   **Branch-Aware**: Samples collected at Branch A can be transferred to Branch B (Central Lab).
*   **Auditability**: 100% traceability of status changes.
*   **Localization**: UI supports EN, BN, AR, UR, HI with RTL rendering.

### 6. Screen List
1.  **Sample Collection Dashboard**: Overview of pending collections.
2.  **Order Search Screen**: Find orders ready for collection.
3.  **Sample Collection Screen**: Barcode generation and collection confirmation.
4.  **Lab Receiving Screen**: Bulk barcode scanning to mark samples as `Received`.
5.  **Department Queue Screen**: Worklist for lab technologists.
6.  **Sample Rejection / Recollection Screen**: Interface for handling exceptions.

### 7. Detailed ASCII Mockups
*(See `docs/21-SampleCollectionLaboratoryWorkflow/Mockups/WireframeMockup.md`)*

### 8. Workflow Diagrams
*(See `docs/21-SampleCollectionLaboratoryWorkflow/Mockups/ScreenFlow.md`)*

### 9. Business Rules
*   **CompanyId Mandatory**: No sample exists outside a tenant context.
*   **No Physical Delete**: Cancelled or rejected samples are soft-deleted or status-updated.
*   **Label Mandatory**: A sample cannot be marked `Collected` until its barcode is generated.
*   **Receive Gate**: A sample cannot enter `Processing` until it is marked `Received` by the lab.
*   **Recollection Linkage**: A recollected sample must tie back to the original financial order to prevent double billing.

### 10. Database Design

**Table: SampleType** (Master)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| SampleTypeId | INT (PK) | Yes | Identity |
| CompanyId | INT | No | NULL for Host |
| TypeName | NVARCHAR(100) | Yes | Blood, Urine, etc. |

**Table: SampleContainer** (Master)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ContainerId | INT (PK) | Yes | Identity |
| CompanyId | INT | No | NULL for Host |
| ContainerName| NVARCHAR(100) | Yes | EDTA, Plain Tube |
| ColorCode | NVARCHAR(20) | No | Purple, Red (for UI) |

**Table: SampleCollection** (Header)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| CollectionId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | Tenant Context |
| BranchId | INT | Yes | Branch Context |
| OrderId | BIGINT (FK)| Yes | Link to Investigation Order |
| PatientId | BIGINT (FK)| Yes | Link to Patient |
| TotalSamples | INT | Yes | Number of tubes |
| Status | NVARCHAR(20) | Yes | Pending, Collected, etc. |

**Table: SampleBarcode** (The physical tube)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| BarcodeId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| CollectionId | BIGINT (FK)| Yes | |
| BarcodeNo | NVARCHAR(50) | Yes | Unique printed ID |
| SampleTypeId | INT (FK) | Yes | |
| ContainerId | INT (FK) | Yes | |
| DepartmentId | INT (FK) | Yes | Lab routing |
| Status | NVARCHAR(20) | Yes | Collected, Received, Rejected |
| CollectedBy | INT | No | UserId |
| CollectedOn | DATETIME | No | |
| ReceivedBy | INT | No | UserId |
| ReceivedOn | DATETIME | No | |

**Table: SampleCollectionItem** (Mapping tests to a tube)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ItemId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| BarcodeId | BIGINT (FK)| Yes | Link to physical tube |
| OrderItemId | BIGINT (FK)| Yes | Link to specific test |

**Table: SampleRejection**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| RejectionId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| BarcodeId | BIGINT (FK)| Yes | |
| Reason | NVARCHAR(200) | Yes | Hemolyzed, etc. |
| Remarks | NVARCHAR(MAX) | No | |
| RejectedBy | INT | Yes | |
| RejectedOn | DATETIME | Yes | |
| IsRecollected| BIT | Yes | Flag if new sample drawn |

**Table: SampleStatusHistory** (Audit Trail)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| HistoryId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| BarcodeId | BIGINT (FK)| Yes | |
| OldStatus | NVARCHAR(20) | Yes | |
| NewStatus | NVARCHAR(20) | Yes | |
| ChangedBy | INT | Yes | |
| ChangedOn | DATETIME | Yes | |

*Note: All tables include `CreatedBy`, `CreatedOn`, `ModifiedBy`, `ModifiedOn`, `IsActive`.*
*Index Recommendations: Non-clustered indexes on `CompanyId`, `BarcodeNo`, `OrderId`, and `Status`.*

### 11. Reports
*   **Pending Collection Report**: Patients waiting for phlebotomy.
*   **Collected Sample Report**: Samples drawn but not yet in lab.
*   **Received Sample Report**: Samples accepted by the lab.
*   **Rejected Sample Report**: Analytics on rejection reasons (Quality Control).
*   **Recollection Report**: Patients needing to return.
*   **Department Queue Report**: Workload per lab department.
*   **Barcode Print Log**: Audit of label generation.
*   **Sample Turnaround Time (TAT) Report**: Time from `Collected` to `Received` to `Completed`.

### 12. Dashboard Cards
*   Pending Collection (Count)
*   Collected Today (Count)
*   Received Today (Count)
*   Rejected Samples (Count/Alert)
*   Recollection Required (Count/Alert)
*   Department Queue Count (Bar Chart)
*   Delayed Samples (Count exceeding TAT SLA)

### 13. Acceptance Criteria
*   **Sample Lifecycle**: Status transitions correctly from `Ordered` to `Received`.
*   **Barcode Accuracy**: System generates 1 barcode for CBC and HbA1c (shared EDTA tube) but a separate barcode for Urine Routine.
*   **Chain of Custody**: `SampleStatusHistory` records the exact user and timestamp for Collection and Receiving.
*   **Rejection**: Rejecting a sample automatically flags the parent order for `Recollection`.
*   **Department Routing**: A received Biochemistry sample appears only in the Biochemistry department queue.
*   **SaaS Isolation**: Phlebotomist in Company A cannot scan or view barcodes from Company B.
*   **Multilingual**: Rejection reasons and statuses display in the user's selected language (e.g., Arabic RTL).

### Appendix A – Enterprise Sample Collection Enhancements

#### 1. Tube Color Governance
Standardized color-coding ensures phlebotomists use the correct additives for specific investigations:
*   **Red**: Plain / Clot Activator (Serum for Biochemistry/Serology)
*   **Purple**: EDTA (Whole Blood for Hematology, e.g., CBC)
*   **Blue**: Sodium Citrate (Plasma for Coagulation, e.g., PT/APTT)
*   **Black**: Sodium Citrate (Whole Blood for ESR)
*   **Grey**: Sodium Fluoride (Plasma for Glucose)
*   **Green**: Heparin (Plasma for specialized Biochemistry/Cytogenetics)

#### 2. Vacutainer Master
A dedicated master table to manage inventory and specifications of collection tubes:
*   **Attributes**: `VacutainerId`, `Name`, `VolumeCapacity` (e.g., 2ml, 5ml), `AdditiveType`, `ColorCode`, `IsActive`.
*   **Purpose**: Allows the system to calculate if multiple tests can fit in a single tube's volume or if a secondary tube of the same color is required.

#### 3. Investigation-to-Tube Mapping
A relational mapping linking the `InvestigationMaster` to the required `VacutainerMaster` and `SampleType`.
*   **Logic**: When an order is placed, the system queries this mapping to determine exactly how many and which types of tubes to generate barcodes for.
*   **Grouping**: Tests sharing the same `VacutainerId` and `SampleType` are grouped into a single barcode/tube, provided the total required volume does not exceed the tube's `VolumeCapacity`.

#### 4. Order of Draw Roadmap
Future implementation of CLSI (Clinical and Laboratory Standards Institute) standard order of draw to prevent cross-contamination of additives.
*   **Workflow**: The Sample Collection Screen will sequence the generated barcodes in the exact order the phlebotomist must draw the blood (e.g., Blood Cultures → Blue → Red → Green → Purple → Grey).

#### 5. Temperature Controlled Transport
Tracking requirements for samples needing cold chain or specific environmental conditions during transit.
*   **Attributes**: `TransportTemperature` (e.g., Ambient, 2-8°C, Frozen).
*   **Workflow**: Barcode labels will print specific temperature icons. The `SampleReceive` process will include an optional validation step to confirm the sample arrived at the correct temperature.

#### 6. Turnaround Time (TAT) Tracking
Detailed SLA tracking across the entire sample lifecycle to monitor laboratory performance.
*   **Metrics**: 
    *   Collection TAT (Ordered → Collected)
    *   Transit TAT (Collected → Received)
    *   Processing TAT (Received → Completed/Resulted)
*   **Alerts**: Visual indicators (color changes) on the Department Queue Screen when a sample approaches or breaches its configured TAT SLA.