## MODULE 22: Result Entry & Analyzer Integration

### 1. Executive Summary
The Result Entry and Analyzer Integration module is the core clinical engine of the laboratory. It captures laboratory results originating either from manual entry by technologists or via automated interfaces from diagnostic analyzers. The module ensures that all results undergo rigorous validation, critical values are immediately escalated, and a comprehensive, immutable audit trail is maintained for every data point entered or modified.

### 2. Business Purpose
To provide a secure, accurate, and highly structured environment for recording diagnostic findings. By standardizing reference ranges, enforcing critical value acknowledgments, and establishing a future-proof architecture for machine integration, this module minimizes clinical errors, accelerates turnaround times (TAT), and ensures patient safety.

### 3. Actors
*   **Lab Technologist**: Performs manual data entry and reviews analyzer imports.
*   **Lab Scientist**: Validates complex results (e.g., Microbiology, Histopathology).
*   **Lab Supervisor**: Approves result corrections, monitors TAT, and manages analyzer queues.
*   **Pathologist**: Performs final verification and digital signature.
*   **Doctor**: Receives critical alerts and views finalized results.
*   **Tenant Admin**: Configures branch-specific reference ranges and analyzer mappings.
*   **Host Admin**: Manages global analyzer master lists and standard test codes.

### 4. Functional Requirements

#### A. Result Entry Types & Data Types
*   **Entry Types**: Numeric Result, Text Result, Positive/Negative, Detected/Not Detected, Culture Result, Histopathology Narrative, Radiology Narrative Placeholder, Calculated Result (e.g., LDL calculated from Total Cholesterol, HDL, and Triglycerides).
*   **Data Types**: Integer, Decimal, Text, Long Text, Boolean, Option List.

#### B. Reference Range Management
*   Support for complex, multi-dimensional reference ranges based on:
    *   Gender (Male, Female)
    *   Age-specific (Child, Neonatal, Adult, Geriatric)
    *   Physiological state (Pregnancy trimesters)
*   System automatically flags results outside the reference range (e.g., 'H' for High, 'L' for Low).

#### C. Critical Value Management
*   **Alert Levels**: Critical Low, Critical High, Panic Value.
*   **Tracking**: When a critical value is entered/imported, the system forces an alert workflow tracking:
    *   Alert Time
    *   Notified To (Doctor/Nurse)
    *   Notified By (Lab User)
    *   Acknowledged By (Clinical User)

#### D. Result Status Lifecycle
*   `Pending` → `Draft` → `Entered` → `Validated` → `Verification Pending` → `Approved`.
*   **Exception Statuses**: `Rejected` (sample issue), `Corrected` (post-approval amendment).

#### E. Result Correction Workflow
*   If an `Approved` result needs changing:
    *   Original Result is locked.
    *   Correction Request is initiated.
    *   Supervisor Approval is required.
    *   New Version is created and marked as `Corrected`.
    *   Full history is preserved and visible on the final report.

#### F. Analyzer Integration Foundation (Architecture Only)
*   Future-ready schema to support unidirectional and bidirectional interfaces.
*   **Components**: Analyzer Master, Analyzer Mapping (Test to Machine Code), Sample ID Mapping (Barcode to Machine ID), Import Queue (raw data), Error Queue (unmapped or failed data).
*   **Examples**: Hematology, Chemistry, Immunology, and Coagulation Analyzers.

#### G. Advanced Clinical Foundations (Architecture Only)
*   **Delta Check**: Compares Current Result vs Previous Result for the same patient/test. Flags abnormal variances (e.g., Hb dropped by 3g/dL in 24 hours).
*   **Reflex Test**: Rule-based triggers (e.g., if TSH is Abnormal → automatically suggest/order FT3 & FT4).
*   **Quality Control (QC)**: Internal QC, External QC, Calibration Logs, and Maintenance Logs.

#### H. Specialized Department Support
*   **Microbiology**: Organism Identification, Antibiogram, Sensitivity (S/I/R), Resistance tracking.
*   **Histopathology**: Narrative workflow covering Gross Description, Microscopic Description, and Final Diagnosis.

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: All results strictly scoped by `CompanyId`.
*   **Branch/Department-Aware**: Results are tied to the specific branch and lab department where they were processed.
*   **Auditability**: 100% traceability of who entered, validated, and verified the result.
*   **Localization**: UI and narrative templates support EN, BN, AR, UR, HI with RTL rendering.

### 6. Screen List
1.  Result Entry Screen (Master)
2.  Numeric Result Entry (Grid view)
3.  Microbiology Result Screen
4.  Histopathology Result Screen
5.  Analyzer Queue Screen
6.  Critical Alert Screen
7.  Validation Dashboard
8.  Mobile Result Review View

### 7. Detailed ASCII Mockups
*(See `docs/22-ResultEntryAnalyzerIntegration/Mockups/WireframeMockup.md`)*

### 8. Workflow Diagrams
*(See `docs/22-ResultEntryAnalyzerIntegration/Mockups/ScreenFlow.md`)*

### 9. Business Rules
*   **CompanyId Mandatory**: No result exists outside a tenant context.
*   **Validation Gate**: Results cannot proceed to `Verification Pending` without being `Validated` by an authorized technologist.
*   **Critical Alert Lock**: A result containing a Panic Value cannot be finalized until the Critical Alert workflow (notification) is completed.
*   **Immutable History**: Once `Approved`, a result row cannot be updated. It must be superseded by a new `LabResultVersion`.

### 10. Database Design

**Table: LabReferenceRange**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| RangeId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | Tenant Context |
| TestId | BIGINT (FK)| Yes | Link to Master Service |
| Gender | NVARCHAR(10) | No | M, F, Both |
| MinAgeDays | INT | No | |
| MaxAgeDays | INT | No | |
| NormalLow | DECIMAL | No | |
| NormalHigh | DECIMAL | No | |
| CriticalLow | DECIMAL | No | |
| CriticalHigh | DECIMAL | No | |

**Table: LabResult** (Header)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ResultId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| BranchId | INT | Yes | |
| OrderId | BIGINT (FK)| Yes | Link to Investigation Order |
| PatientId | BIGINT (FK)| Yes | Link to Patient |
| BarcodeId | BIGINT (FK)| Yes | Link to Sample |
| DepartmentId | INT (FK) | Yes | |
| Status | NVARCHAR(20) | Yes | Entered, Validated, Approved |
| ValidatedBy | INT | No | UserId |
| VerifiedBy | INT | No | UserId |

**Table: LabResultItem** (Line Items)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ResultItemId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ResultId | BIGINT (FK)| Yes | |
| TestId | BIGINT (FK)| Yes | |
| ResultValue | NVARCHAR(MAX)| No | The actual result |
| ResultFlag | NVARCHAR(10) | No | H, L, Panic |
| IsAnalyzerImport| BIT | Yes | 1 if from machine |
| AnalyzerId | INT (FK) | No | |

**Table: LabResultVersion** (Correction History)
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| VersionId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ResultItemId | BIGINT (FK)| Yes | |
| OldValue | NVARCHAR(MAX)| Yes | |
| NewValue | NVARCHAR(MAX)| Yes | |
| Reason | NVARCHAR(200)| Yes | |
| ApprovedBy | INT (FK) | Yes | Supervisor |

**Table: CriticalValueAlert**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| AlertId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ResultItemId | BIGINT (FK)| Yes | |
| AlertTime | DATETIME | Yes | |
| NotifiedTo | NVARCHAR(100)| Yes | Doctor/Nurse Name |
| NotifiedBy | INT (FK) | Yes | Lab User |
| AcknowledgedBy | INT (FK) | No | Clinical User |

**Table: AnalyzerMaster**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| AnalyzerId | INT (PK) | Yes | Identity |
| CompanyId | INT | No | NULL for Host |
| AnalyzerName | NVARCHAR(100)| Yes | e.g., Sysmex XN-1000 |
| Protocol | NVARCHAR(50) | Yes | HL7, ASTM |

**Table: AnalyzerMapping**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| MappingId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| AnalyzerId | INT (FK) | Yes | |
| MachineTestCode| NVARCHAR(50) | Yes | e.g., WBC |
| SystemTestId | BIGINT (FK)| Yes | Link to Master Service |

**Table: AnalyzerImportQueue**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| QueueId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| AnalyzerId | INT (FK) | Yes | |
| MachineSampleId| NVARCHAR(50) | Yes | Barcode read by machine |
| RawPayload | NVARCHAR(MAX)| Yes | Full HL7/ASTM message |
| ProcessedStatus| NVARCHAR(20) | Yes | Pending, Success, Error |

**Table: AnalyzerErrorQueue**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ErrorId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| QueueId | BIGINT (FK)| Yes | |
| ErrorMessage | NVARCHAR(500)| Yes | e.g., "Unmapped Test Code" |

*Note: All tables include `CreatedBy`, `CreatedOn`, `ModifiedBy`, `ModifiedOn`, `IsActive`.*
*Index Recommendations: Non-clustered indexes on `CompanyId`, `ResultId`, `PatientId`, `MachineSampleId`, and `Status`.*

### 11. Reports
*   **Pending Result Report**: Tests received but not resulted.
*   **Critical Value Report**: Audit of all critical alerts and acknowledgment times.
*   **Corrected Result Report**: Log of all amended reports.
*   **Analyzer Error Report**: Unmapped codes or failed imports.
*   **TAT Report**: Turnaround time from Sample Received to Result Approved.
*   **Validation Report**: Productivity report by Lab Technologist.

### 12. Dashboard Cards
*   Pending Entry (Count)
*   Pending Validation (Count)
*   Critical Alerts (Count/Red Flash)
*   Analyzer Errors (Count)
*   Corrected Results (Count)
*   TAT Breaches (Count exceeding SLA)

### 13. Acceptance Criteria
*   **Result Accuracy**: System accurately flags High/Low based on patient age, gender, and the configured `LabReferenceRange`.
*   **Audit Trail**: Every result entry, validation, and correction is logged with User ID and Timestamp.
*   **Critical Value Escalation**: Entering a value outside the `CriticalLow`/`CriticalHigh` bounds forces the Critical Alert workflow.
*   **Analyzer Readiness**: The database schema fully supports mapping machine test codes to system test codes and queuing raw payloads.
*   **Multi-Department Support**: Hematology results and Microbiology results use specialized UI screens but share the same core architecture.
*   **SaaS Tenant Isolation**: Analyzer mappings and results are strictly isolated by `CompanyId`.
*   **Multilingual Readiness**: Narrative text fields and dropdown options support RTL languages (Arabic/Urdu).
*   **Future Interoperability**: Schema accommodates HL7 message storage for future interface engine implementation.

### Appendix A – Enterprise Result & Integration Enhancements

#### 1. ResultSource Tracking
A robust audit mechanism to identify exactly how a result value was populated.
*   **Attributes**: Add `ResultSource` (Enum/Lookup) to `LabResultItem`.
*   **Sources**: `Manual Entry`, `Analyzer Import`, `Calculated`, `External API / Reference Lab`.
*   **Purpose**: Ensures clinical traceability, allowing pathologists to immediately know if a value was typed by a human or transmitted directly by a machine.

#### 2. Analyzer Raw Message Archive
A compliance and troubleshooting repository for all machine communications.
*   **Concept**: Even after an HL7/ASTM message is successfully parsed from the `AnalyzerImportQueue` and moved to `LabResultItem`, the raw payload must be archived.
*   **Purpose**: Essential for vendor troubleshooting, resolving disputes over what the machine actually transmitted, and complying with strict laboratory accreditation standards (e.g., CAP, ISO 15189).

#### 3. Delta Check Governance
A clinical safety net that compares a patient's current result against their historical result for the same test.
*   **Rules Engine**: Configurable thresholds based on absolute variance (e.g., +/- 2.0) or percentage variance (e.g., +/- 15%).
*   **Workflow**: If a delta check fails, the system automatically flags the result with a 'Delta Alert' and forces a manual review/justification by a Lab Scientist before it can be validated.
*   **Purpose**: Detects potential sample mix-ups, analytical errors, or sudden critical shifts in patient health.

#### 4. Auto Flagging Architecture
The automated logic layer that evaluates results against the `LabReferenceRange` table.
*   **Logic**: Upon result entry/import, the system evaluates the patient's Age, Gender, and Pregnancy Status against the active reference ranges.
*   **Flags**: Automatically applies standard flags (e.g., `H` for High, `L` for Low, `HH` for Panic High, `LL` for Panic Low).
*   **UI Impact**: Flagged results are visually highlighted (e.g., red text, bold) on the Result Entry Screen, Validation Dashboard, and final printed report.

#### 5. Result Formula Engine Roadmap
A future-ready calculation engine to derive results mathematically from other test values within the same order.
*   **Concept**: Tests like LDL Cholesterol, eGFR, or A/G Ratio do not come from the analyzer directly but are calculated.
*   **Architecture**: A `TestFormula` master table storing mathematical expressions (e.g., `[TotalChol] - [HDL] - ([Trig]/5)`).
*   **Execution**: The engine parses the formula, fetches the prerequisite `ResultItemId` values, computes the result, and inserts it with `ResultSource = Calculated`.