## MODULE 19: Prescription Management

### 1. Executive Summary
The Prescription Management module is the clinical output engine of ABSHealthcareLite. It begins immediately following or during a clinical encounter and produces structured, printable, and auditable prescriptions. This module ensures that medicine advice, investigations, and follow-up instructions are captured in a multilingual format, supporting both LTR and RTL layouts. It is designed to be multi-tenant, branch-aware, and future-ready for clinical governance, AI-driven safety checks, and digital sharing.

### 2. Actors
*   **Doctor**: Primary actor; creates, manages, and finalizes prescriptions.
*   **Nurse / Assistant**: Assists in drafting prescriptions or preparing templates under doctor supervision.
*   **Patient**: Recipient of the prescription; views and downloads via the Patient Portal.
*   **Pharmacist**: Views finalized prescriptions for medicine dispensing.
*   **Admin**: System administrator managing global settings.
*   **Tenant Admin**: Manages company-specific settings and templates.
*   **Host Admin**: Manages global medicine catalogs and system-wide templates.

### 3. Core Workflow
`Appointment / Queue` → `Doctor Worklist` → `Clinical Encounter` → `Prescription Creation` → `Medicine Advice` → `Investigation Advice` → `Follow-up Advice` → `Preview` → `Finalize` → `Print / Share` → `Patient Profile History`.

### 4. Functional Requirements

#### A. Prescription Header
*   **Metadata**: Capture `PrescriptionNo`, `CompanyId`, `BranchId`, `DepartmentId`, `DoctorId`, `PatientId`, `EncounterId`, `AppointmentId`, and `PrescriptionDate`.
*   **Status Management**: Track lifecycle: `Draft`, `Finalized`, `Cancelled`, `Revised`.

#### B. Medicine Prescription Item
*   **Structured Entry**: Medicine name, Generic name, Brand name, Strength, Dosage form.
*   **Dosing**: Dose, Frequency (e.g., 1+0+1), Route (e.g., Oral), Duration (Value + Unit).
*   **Instructions**: Timing (e.g., Before Meal), Meal relation, Quantity, PRN (as-needed) flag, and Special instructions.

#### C. Non-Medicine Advice
*   **Advice Types**: Lifestyle, Diet, Rest, Exercise, Warning Signs, and General instructions.

#### D. Investigation Advice
*   **LIS Integration**: Link to Module 20 (Investigation Order).
*   **Ordering**: Recommend investigations, create requests immediately, or save for future ordering.

#### E. Diagnosis Link
*   **Clinical Context**: Support for Encounter Diagnoses, Patient Problem List, Primary Diagnosis, and Visit Problems.

#### F. Follow-up Advice
*   **Scheduling**: Follow-up Date, Department, Doctor, and "Return Immediately" instructions for emergencies.

#### G. Prescription Templates
*   **Hierarchy**: Support for Doctor, Department, Tenant, Host, and Disease-specific templates (e.g., Fever, Diabetes, Hypertension, Antenatal Care).

#### H. Drug Safety Hooks (Roadmap Only)
*   **Alerts**: Allergy, Drug Interaction, Pregnancy, CKD, Liver Disease, and Duplicate Drug warnings.

#### I. Prescription Printing
*   **Layouts**: Support for A4, Half Page, OPD Format, Hospital Pad, and Doctor Chamber formats.
*   **Features**: QR/Barcode ready, Digital Signature ready.

#### J. Multilingual Support
*   **Languages**: English, Bangla, Arabic, Urdu, Hindi.
*   **RTL Support**: Full layout mirroring for Arabic and Urdu.
*   **No Hardcoding**: All labels and instructions fetched from the Localization module.

#### K. Prescription Revision
*   **Versioning**: Finalized prescriptions are locked. Revisions create a new version with a full audit trail.
*   **Cancellation**: Requires a mandatory reason and is fully audited.

#### L. Patient Portal Roadmap
*   **Access**: View Prescription, PDF Download, WhatsApp/Email/SMS sharing, and Mobile App access.

### 5. Prescription Classification
*   **OPD Prescription**: Standard outpatient consultation output.
*   **Follow-up Prescription**: Focused on progress and medication adjustment.
*   **Emergency Prescription**: Rapid output for acute care settings.
*   **IPD Medication Order**: Internal instructions for nursing staff (Inpatient).
*   **Discharge Prescription**: Final instructions and medications upon hospital exit.
*   **Telemedicine Prescription**: Digital-first output for remote consultations.
*   **Advice-only Prescription**: For consultations not requiring medication (e.g., counseling).

### 6. Medicine Catalog Strategy
*   **Sources**: System Medicine Master (Host), Tenant Medicine Master (Company), and Free Text (Manual entry).
*   **Future Integration**: Seamless link to Pharmacy Inventory for real-time stock, batch, and expiry tracking during prescription.

### 7. Clinical Governance Roadmap
*   **Workflow**: Configurable path from `Draft` → `Review` → `Finalized`.
*   **Approval Chain**: Support for multi-level review (Junior Doctor → Consultant → Dept Head) per tenant policy.

### 8. Business Rules
*   **Authorization**: Only the assigned doctor can finalize a prescription.
*   **Immutability**: Once `Finalized`, a prescription cannot be edited; it must be `Revised`.
*   **Scoping**: Every prescription belongs to a `CompanyId` and must link to a `PatientId`.
*   **Validation**: Medicine items required unless marked as "Advice-only".
*   **Audit**: All status changes (Finalize, Cancel, Revise) must be logged.
*   **Templates**: Host templates have `CompanyId = NULL`; Tenant templates are specific to their `CompanyId`.

### 9. Database Design

**Table: Prescription**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| PrescriptionId | BIGINT (Identity)| Yes | Primary Key |
| CompanyId | INT | Yes | Tenant Context |
| BranchId | INT | Yes | Branch Context |
| DepartmentId | INT | Yes | Dept Context |
| DoctorId | INT | Yes | FK to MasterDoctor |
| PatientId | BIGINT | Yes | FK to MasterPatient |
| EncounterId | BIGINT | No | FK to Encounter |
| AppointmentId | BIGINT | No | FK to Appointment |
| PrescriptionNo | NVARCHAR(50) | Yes | Unique Reference |
| PrescriptionDate | DATETIME | Yes | |
| Status | NVARCHAR(20) | Yes | Draft, Finalized, etc. |
| PrescriptionType | NVARCHAR(20) | Yes | OPD, IPD, etc. |
| PrimaryDiagnosisText| NVARCHAR(MAX) | No | Snapshot of diagnosis |
| ClinicalNotes | NVARCHAR(MAX) | No | |
| LanguageCode | NVARCHAR(10) | Yes | en, bn, ar, etc. |
| PrintTemplateCode | NVARCHAR(50) | No | |
| FinalizedBy | INT | No | User ID |
| FinalizedDate | DATETIME | No | |
| CancelReason | NVARCHAR(500) | No | |
| CreatedBy | INT | Yes | |
| CreatedDate | DATETIME | Yes | |

**Table: PrescriptionItem**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| PrescriptionItemId | BIGINT (Identity)| Yes | Primary Key |
| CompanyId | INT | Yes | |
| PrescriptionId | BIGINT | Yes | FK to Prescription |
| MedicineId | INT | No | FK to Medicine Master |
| GenericId | INT | No | FK to Generic Master |
| MedicineName | NVARCHAR(200) | Yes | |
| GenericName | NVARCHAR(200) | No | |
| Strength | NVARCHAR(50) | No | |
| DosageForm | NVARCHAR(50) | No | Tab, Syrup, etc. |
| Dose | NVARCHAR(50) | Yes | e.g. 1+0+1 |
| Frequency | NVARCHAR(50) | No | |
| Route | NVARCHAR(50) | No | Oral, IV, etc. |
| DurationValue | INT | Yes | |
| DurationUnit | NVARCHAR(20) | Yes | Days, Weeks, etc. |
| MealInstruction | NVARCHAR(100) | No | Before/After Meal |
| TimingInstruction | NVARCHAR(100) | No | Morning, Night, etc. |
| Quantity | DECIMAL(18,2) | No | Total units |
| IsPRN | BIT | Yes | As needed flag |
| SpecialInstruction | NVARCHAR(500) | No | |
| SortOrder | INT | Yes | |

**Supporting Tables**
*   `PrescriptionAdvice`: Stores lifestyle/diet instructions.
*   `PrescriptionInvestigationAdvice`: Links to suggested lab/imaging tests.
*   `PrescriptionFollowUp`: Stores return visit details.
*   `PrescriptionTemplate`: Header for reusable prescription sets.
*   `PrescriptionTemplateItem`: Medicine/Advice items within a template.
*   `PrescriptionRevisionHistory`: Stores snapshots of previous versions.

### 10. Security Design
*   **Access Control**: Doctors can only finalize their own prescriptions. Admins have read-only access for auditing.
*   **Patient Privacy**: Patients can only access prescriptions linked to their `PatientId`.
*   **Audit Trail**: Mandatory logging for `Finalize`, `Revise`, and `Cancel` actions.
*   **Signature**: Access to digital signatures is strictly controlled.

### 11. Integration Points
*   **Module 15/16**: Patient identity and 360-degree profile.
*   **Module 17/18**: Appointment context and clinical encounter data.
*   **Module 20**: Direct creation of investigation orders from advice.
*   **Future Modules**: Pharmacy, Billing, Patient Portal, and FHIR MedicationRequest.

### 12. Acceptance Criteria
*   Prescription correctly pulls patient and diagnosis data from the active encounter.
*   Medicine items can be added with full dosing and timing instructions.
*   Finalizing a prescription locks it from further direct edits.
*   Revision history is maintained for any changes to finalized records.
*   Prescription is strictly scoped by `CompanyId`.
*   Multilingual labels and RTL layouts are supported.
*   Investigation advice correctly links to Module 20.

### 13. Future Roadmap
*   **Safety**: Drug Interaction and Allergy Warning engines.
*   **Digital**: E-Prescription, Mobile Prescription, and QR Verification.
*   **Interoperability**: FHIR MedicationRequest support.
*   **AI**: AI Prescription Assistant and Voice Dictation.

---

## Appendix A – Enterprise Prescription Enhancements

### 1. Prescription Numbering Strategy
*   **Format**: `{BranchCode}-{Year}{Month}-{Sequence}` (e.g., `DHK-202606-0001`).
*   **Reset Rule**: Sequence resets monthly or annually per tenant configuration.
*   **Uniqueness**: Guaranteed unique within the `CompanyId` and `BranchId`.

### 2. QR Verification Architecture
*   **QR Content**: Encrypted URL or Signed JWT containing `PrescriptionId`, `PatientMRN`, and `VerificationHash`.
*   **Validation Flow**: External parties (e.g., external pharmacies) scan the QR → System validates the hash → Displays a read-only "Verified Prescription" view from the Patient Portal.
*   **Security**: QR does not contain PII in plain text; it acts as a secure pointer to the system.

### 3. Doctor Electronic Signature Roadmap
*   **Phase 1**: Image-based signature (Upload scan of physical signature).
*   **Phase 2**: PIN-protected digital signature (Doctor enters a 6-digit PIN to apply signature).
*   **Phase 3**: PKI-based cryptographic signing (Integration with national digital ID or hardware tokens).

### 4. ICD10 Diagnosis Link
*   **Requirement**: Every prescription must link to at least one ICD10 code from the Encounter.
*   **Storage**: Store the `ICD10Code` and `ICD10Description` in the `Prescription` table as a snapshot to ensure the printed prescription remains valid even if master data changes.

### 5. Allergy Snapshot Storage
*   **Snapshot Logic**: At the moment of `Finalization`, the system captures all active allergies from the `PatientProfile` (Module 16) and stores them in a JSON field within the `Prescription` table.
*   **Purpose**: Provides a legal record of what the doctor knew about the patient's allergies when the prescription was issued.

### 6. Pharmacy Fulfillment Status
*   **Tracking**: New status field `FulfillmentStatus` added to `Prescription`.
*   **Values**: `NOT_DISPENSED`, `PARTIALLY_DISPENSED`, `FULLY_DISPENSED`.
*   **Integration**: Updated by the Pharmacy module when medications are issued.

### 7. Controlled Drug Governance
*   **Flagging**: Medicines in the catalog marked as "Controlled Substance".
*   **Rules**:
    *   Requires mandatory "Finalization" (no draft printing).
    *   Requires a valid `DoctorRegNo` on the printout.
    *   System generates a separate "Controlled Drug Register" log for compliance.

### 8. OPD Prescription vs. IPD MAR Separation
*   **OPD Prescription**: A document given to the patient for external or internal pharmacy fulfillment.
*   **IPD Medication Order**: An internal instruction for nursing staff.
*   **MAR (Medication Administration Record)**: A future module that will consume `IPD Medication Orders` to track actual administration (dose given, time, nurse ID). The Prescription module serves as the *Order* source, while the MAR serves as the *Execution* log.

### 9. Updated Database Design (Additional Fields)

**Table: Prescription (Updated)**
| Column Name | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| FulfillmentStatus | NVARCHAR(20) | Yes | NOT_DISPENSED, etc. |
| AllergySnapshot | NVARCHAR(MAX) | No | JSON snapshot of allergies |
| VerificationHash | NVARCHAR(500) | No | For QR validation |
| DigitalSignature | NVARCHAR(MAX) | No | Encrypted signature data |
| ICD10Snapshot | NVARCHAR(MAX) | No | JSON list of linked ICD10 codes |

### 10. Clinical Decision Support (CDS) Roadmap
*   **Advisory Functions**: Future versions may provide:
    *   **Drug Interaction Warning**: Alerts for potential adverse reactions between prescribed medications.
    *   **Duplicate Therapy Warning**: Alerts if multiple drugs from the same therapeutic class are prescribed.
    *   **Maximum Dose Warning**: Alerts if the prescribed dose exceeds the recommended safe limit.
    *   **Renal Dose Adjustment**: Suggestions for dose modification based on the patient's Creatinine Clearance / GFR.
    *   **Hepatic Dose Adjustment**: Suggestions for dose modification based on liver function markers.
    *   **Pediatric Dose Calculation**: Automated calculation based on weight (mg/kg) or body surface area.
    *   **Geriatric Dose Recommendation**: Alerts for potentially inappropriate medications in the elderly (e.g., Beers Criteria).
*   **Governance Rule**: All CDS functions are **advisory only**. They are designed to assist the clinician but **never replace physician judgment**. The clinician must have the ability to override any warning with a mandatory justification.
