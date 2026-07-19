## MODULE 23: Result Verification & Approval

### 1. Executive Summary
The Result Verification & Approval module enforces the clinical governance and medico-legal integrity of all laboratory findings. It ensures that entered results (whether manual or machine-generated) are rigorously reviewed by qualified personnel before they are released to the patient or physician. By supporting multi-level approvals, strict correction protocols, and critical value escalations, this module guarantees that the highest standards of diagnostic accuracy and patient safety are met.

### 2. Business Purpose
To provide a structured, auditable, and configurable workflow for the clinical sign-off of laboratory results. This module prevents erroneous data from reaching the patient portal or billing systems, enforces compliance with laboratory accreditation standards, and provides a clear chain of accountability (who verified, who approved, and when) for every diagnostic report.

### 3. Actors
*   **Lab Technologist**: Performs initial technical verification.
*   **Senior Technologist**: Performs Level 2 verification for routine tests.
*   **Lab Supervisor**: Manages escalations, holds, and correction requests.
*   **Pathologist**: Provides final clinical approval for complex/critical results.
*   **Consultant Pathologist**: Signs out specialized reports (e.g., Histopathology).
*   **Microbiologist**: Approves culture and sensitivity reports.
*   **Radiologist (future)**: Approves imaging narratives.
*   **Doctor**: Receives finalized reports and critical notifications.
*   **Tenant Admin**: Configures approval matrices and department rules.
*   **Host Admin**: Manages global compliance standards.

### 4. Functional Requirements

#### A. Verification Workflow & Levels
*   **Workflow**: `Draft Result` → `Technical Verification` → `Clinical Verification` → `Approved` → `Release Ready`.
*   **Levels (Configurable per department/test)**:
    *   **Level 1**: Technologist Verification (e.g., Routine Urine).
    *   **Level 2**: Supervisor Verification (e.g., Abnormal CBC).
    *   **Level 3**: Pathologist Approval (e.g., Biopsy, Critical Values).

#### B. Result Categories & Approval Matrix
*   Different categories require different sign-off authorities:
    *   **Routine Laboratory**: Senior Technologist.
    *   **Critical Value**: Supervisor or Pathologist.
    *   **Microbiology**: Microbiologist.
    *   **Histopathology**: Consultant Pathologist.
    *   **Molecular Diagnostics**: Specialized Pathologist.
*   System supports escalation if a lower-level verifier is unsure.

#### C. Verification Checklist
*   Before approval, the verifier is presented with an audit checklist:
    *   Patient identity confirmed.
    *   Sample integrity acceptable.
    *   Analyzer flags reviewed.
    *   Reference ranges checked.
    *   Delta check alerts resolved.
    *   Critical value alerts acknowledged.
    *   QC status passed.

#### D. Critical Value Governance
*   **Workflow**: `Critical Result` → `Verification Required` → `Doctor Notification` → `Acknowledgement` → `Approval`.
*   **Tracking**: Must log Notified To, Notified By, Notification Time, and Acknowledgement Time before the result can be marked `Release Ready`.

#### E. Correction Workflow
*   **Rule**: An `Approved` result is immutable. It can never be overwritten.
*   **Workflow**: `Approved Result` → `Correction Request` → `Justification Required` → `Approval Required` → `New Version Created`.
*   Both the original and corrected versions are stored, with the final report clearly indicating "Amended Report".

#### F. Quality Governance & Holds
*   Results can be placed on hold, preventing release:
    *   **QC Failure Hold**: Analyzer calibration failed.
    *   **Verification Hold**: Pending delta check review.
    *   **Approval Hold**: Pending pathologist review.
    *   **Investigation Hold**: Sample integrity questioned.

#### G. Turnaround Time (TAT) Governance
*   **Tracking**: Entry Time, Verification Time, Approval Time, Release Ready Time.
*   **Calculations**: Verification TAT, Approval TAT.
*   **SLA**: System logs reasons for any SLA breaches.

#### H. Digital Signature Foundation (Architecture Only)
*   Database schema supports storing metadata for Verifier Signature, Pathologist Signature, Digital Seal, and Signature Timestamp. (Cryptography implementation is future scope).

### 5. Non-Functional Requirements
*   **Multi-tenant Isolation**: All approvals and matrices are strictly scoped by `CompanyId`.
*   **Branch/Department-Aware**: Verification queues are filtered by the user's assigned branch and department.
*   **Auditability**: 100% traceability of all verification and approval actions.
*   **Localization**: UI supports EN, BN, AR, UR, HI with RTL rendering.

### 6. Screen List
1.  Verification Dashboard
2.  Verification Queue
3.  Verification Screen (Detailed Review)
4.  Critical Result Verification Screen
5.  Approval Dashboard (Pathologist View)
6.  Correction Request Screen
7.  Escalation Screen
8.  Mobile Approval View

### 7. Detailed ASCII Mockups
*(See `docs/23-ResultVerificationApproval/Mockups/WireframeMockup.md`)*

### 8. Workflow Diagrams
*(See `docs/23-ResultVerificationApproval/Mockups/ScreenFlow.md`)*

### 9. Business Rules
*   **CompanyId Mandatory**: No verification exists outside a tenant context.
*   **Segregation of Duties**: The user who entered the result cannot be the final approver (configurable based on tenant size).
*   **Hold Enforcement**: A result with an active `ResultHold` cannot transition to `Approved`.
*   **Correction Justification**: A correction request must include a mandatory text justification.

### 10. Database Design

**Table: ResultVerification**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| VerificationId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | Tenant Context |
| ResultId | BIGINT (FK)| Yes | Link to LabResult |
| VerificationLevel| INT | Yes | 1, 2, or 3 |
| VerifiedBy | INT (FK) | Yes | UserId |
| VerifiedOn | DATETIME | Yes | |
| Status | NVARCHAR(20) | Yes | Verified, Rejected, Escalated |
| Remarks | NVARCHAR(MAX)| No | |

**Table: ResultVerificationChecklist**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ChecklistId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| VerificationId | BIGINT (FK)| Yes | |
| CheckItem | NVARCHAR(100)| Yes | e.g., "Delta Check Cleared" |
| IsChecked | BIT | Yes | |

**Table: ResultApproval**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| ApprovalId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ResultId | BIGINT (FK)| Yes | |
| ApprovedBy | INT (FK) | Yes | Pathologist UserId |
| ApprovedOn | DATETIME | Yes | |
| DigitalSignature | NVARCHAR(MAX)| No | Future hash/token |

**Table: ResultCorrectionRequest**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| RequestId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ResultId | BIGINT (FK)| Yes | |
| RequestedBy | INT (FK) | Yes | |
| RequestedOn | DATETIME | Yes | |
| Justification | NVARCHAR(MAX)| Yes | |
| Status | NVARCHAR(20) | Yes | Pending, Approved, Denied |
| ReviewedBy | INT (FK) | No | Supervisor/Pathologist |

**Table: ResultCorrectionVersion**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| VersionId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| RequestId | BIGINT (FK)| Yes | |
| ResultItemId | BIGINT (FK)| Yes | |
| OldValue | NVARCHAR(MAX)| Yes | |
| NewValue | NVARCHAR(MAX)| Yes | |

**Table: ResultNotificationAudit**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| AuditId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ResultId | BIGINT (FK)| Yes | For Critical Values |
| NotifiedTo | NVARCHAR(100)| Yes | Doctor Name |
| NotifiedBy | INT (FK) | Yes | |
| NotificationTime | DATETIME | Yes | |
| AckTime | DATETIME | No | |

**Table: VerificationEscalation**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| EscalationId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| VerificationId | BIGINT (FK)| Yes | |
| EscalatedToRole | INT (FK) | Yes | e.g., Pathologist Role |
| Reason | NVARCHAR(200)| Yes | |

**Table: ResultHold**
| Column | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| HoldId | BIGINT (PK)| Yes | Identity |
| CompanyId | INT | Yes | |
| ResultId | BIGINT (FK)| Yes | |
| HoldType | NVARCHAR(50) | Yes | QC Failure, Investigation |
| PlacedBy | INT (FK) | Yes | |
| PlacedOn | DATETIME | Yes | |
| ReleasedBy | INT (FK) | No | |
| ReleasedOn | DATETIME | No | |

*Note: All tables include `CreatedBy`, `CreatedOn`, `ModifiedBy`, `ModifiedOn`, `IsActive`.*
*Index Recommendations: Non-clustered indexes on `CompanyId`, `ResultId`, `Status`, and `VerifiedBy`/`ApprovedBy`.*

### 11. Reports
*   **Verification Queue Report**: Aging report of results awaiting verification.
*   **Approval Queue Report**: Results awaiting pathologist sign-off.
*   **Corrected Result Report**: Audit of all amended reports and justifications.
*   **Critical Notification Report**: Compliance report on critical value acknowledgments.
*   **SLA Breach Report**: Analysis of TAT failures during verification/approval.
*   **Verification Productivity Report**: Volume of verifications per user.

### 12. Dashboard Cards
*   Pending Verification (Count)
*   Pending Approval (Count/Urgent)
*   Critical Results (Count/Alert)
*   Corrections Pending (Count)
*   Escalated Results (Count)
*   SLA Breaches (Count)

### 13. Acceptance Criteria
*   **Verification Workflow**: A routine result successfully passes from Entry → Tech Verification → Release Ready.
*   **Approval Workflow**: A Histopathology result requires Pathologist Approval before reaching Release Ready.
*   **Correction Governance**: Editing an approved result forces the creation of a `ResultCorrectionRequest` and preserves the original data.
*   **Critical Result Governance**: A critical result cannot be approved until the `ResultNotificationAudit` shows an acknowledgment time.
*   **Auditability**: Every verification, hold, escalation, and approval is logged with User ID and Timestamp.
*   **SaaS Tenant Isolation**: Pathologists in Company A cannot view or approve results for Company B.
*   **Multilingual Readiness**: Justification fields and remarks support RTL languages (Arabic/Urdu).

### Appendix A – Enterprise Pathology Governance

#### 1. Auto-verification Roadmap
*   **Architecture**: A future rules engine that automatically verifies and approves normal, routine results (e.g., a completely normal CBC with no flags and passing delta checks) without human intervention, drastically reducing TAT.

#### 2. Verification Rules Engine
*   **Architecture**: A configurable logic layer allowing Tenant Admins to define complex boolean rules (e.g., `IF Test = Troponin AND Result > 0.04 THEN Require Level 3 Approval`).

#### 3. Peer Review Workflow
*   **Architecture**: Support for blind peer reviews where a percentage of a pathologist's approved cases are randomly routed to a second pathologist for quality assurance and concordance scoring.

#### 4. CAP/CLIA Accreditation Readiness
*   **Architecture**: Database design ensures all data points required by the College of American Pathologists (CAP) and Clinical Laboratory Improvement Amendments (CLIA) are captured, including reagent lot numbers (via Inventory integration) and instrument calibration status at the exact time of the test.

#### 5. External Quality Audit Support
*   **Architecture**: Dedicated read-only audit views and export tools designed specifically for external inspectors to review the complete chain of custody and correction history of any given result.

#### 6. Consultant Sign-out Governance
*   **Architecture**: Advanced workflow for complex cases (e.g., Oncology Biopsies) requiring multi-disciplinary team (MDT) reviews or multiple consultant signatures before the final diagnostic report is generated.

#### 7. Electronic Sign-Off Hierarchy
*   **Architecture**: A structured chain of command defining signature precedence. For example, a Junior Pathologist's signature can be superseded or co-signed by a Chief Pathologist. The system stores the hierarchical relationship and ensures the final printed report displays the highest-ranking authorizing signature.

#### 8. Amendment Workflow
*   **Architecture**: Differentiates between a "Correction" (fixing a typographical error in an existing value) and an "Addendum" (adding new clinical interpretation or late-arriving supplementary results to an already released report). Both trigger versioning, but Addendums append to the narrative without invalidating the original findings.

#### 9. External Consultant Review Workflow
*   **Architecture**: A secure routing mechanism allowing specific complex cases to be temporarily assigned to locum or external consultant pathologists. Includes temporary role-based access control (RBAC) scoping so the external consultant only sees the specific case assigned for second opinion.

#### 10. Release Blocking Matrix
*   **Architecture**: A master configuration matrix that evaluates multiple systemic conditions before a result can transition to `Release Ready`. Conditions include: Unpaid billing balances (if configured by tenant), active Quality Holds, unacknowledged Critical Value alerts, or pending mandatory peer reviews. If any matrix condition fails, the report is hard-blocked from printing or patient portal visibility.