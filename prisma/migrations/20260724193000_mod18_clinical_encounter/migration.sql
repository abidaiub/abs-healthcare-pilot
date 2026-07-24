-- MOD-18 Clinical Encounter / Doctor Consultation

CREATE TYPE "ClinicalEncounterStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "EncounterType" AS ENUM ('OPD');
CREATE TYPE "DiagnosisType" AS ENUM ('PRIMARY', 'SECONDARY', 'PROVISIONAL', 'CONFIRMED');
CREATE TYPE "InvestigationAdviceStatus" AS ENUM ('ADVISED', 'CANCELLED');

CREATE TABLE "tenant_encounter_counters" (
    "tenant_id" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "tenant_encounter_counters_pkey" PRIMARY KEY ("tenant_id")
);

CREATE TABLE "clinical_encounters" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "department_id" TEXT,
    "appointment_id" TEXT,
    "encounter_number" TEXT NOT NULL,
    "status" "ClinicalEncounterStatus" NOT NULL DEFAULT 'DRAFT',
    "encounter_type" "EncounterType" NOT NULL DEFAULT 'OPD',
    "consultation_date" DATE NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "chief_complaint" TEXT,
    "history_of_present_illness" TEXT,
    "past_medical_history" TEXT,
    "past_surgical_history" TEXT,
    "allergy_notes" TEXT,
    "family_history" TEXT,
    "social_history" TEXT,
    "examination_notes" TEXT,
    "clinical_notes" TEXT,
    "general_advice" TEXT,
    "follow_up_date" DATE,
    "follow_up_interval_days" INTEGER,
    "follow_up_instructions" TEXT,
    "reopen_reason" TEXT,
    "reopened_at" TIMESTAMP(3),
    "reopened_by_id" TEXT,
    "correction_reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" TEXT,
    "updated_by" TEXT,
    CONSTRAINT "clinical_encounters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "encounter_vitals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "encounter_id" TEXT NOT NULL,
    "height_cm" DECIMAL(6,2),
    "weight_kg" DECIMAL(6,2),
    "temperature_c" DECIMAL(4,1),
    "pulse_bpm" INTEGER,
    "respiratory_rate" INTEGER,
    "systolic_bp" INTEGER,
    "diastolic_bp" INTEGER,
    "spo2_percent" INTEGER,
    "bmi" DECIMAL(5,2),
    "blood_glucose_mg_dl" DECIMAL(6,2),
    "notes" TEXT,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "captured_by_id" TEXT,
    "captured_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "encounter_vitals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "encounter_diagnoses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "encounter_id" TEXT NOT NULL,
    "diagnosis_type" "DiagnosisType" NOT NULL,
    "diagnosis_text" TEXT NOT NULL,
    "icd_code" TEXT,
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,
    CONSTRAINT "encounter_diagnoses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "encounter_medicine_advices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "encounter_id" TEXT NOT NULL,
    "medicine_text" TEXT NOT NULL,
    "strength" TEXT,
    "dose" TEXT,
    "route" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "quantity" TEXT,
    "instructions" TEXT,
    "food_timing" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,
    CONSTRAINT "encounter_medicine_advices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "encounter_investigation_advices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "encounter_id" TEXT NOT NULL,
    "investigation_text" TEXT NOT NULL,
    "priority" TEXT,
    "instructions" TEXT,
    "clinical_note" TEXT,
    "status" "InvestigationAdviceStatus" NOT NULL DEFAULT 'ADVISED',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,
    CONSTRAINT "encounter_investigation_advices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "clinical_encounters_tenant_id_encounter_number_key" ON "clinical_encounters"("tenant_id", "encounter_number");
CREATE UNIQUE INDEX "encounter_vitals_encounter_id_key" ON "encounter_vitals"("encounter_id");
CREATE UNIQUE INDEX "clinical_encounters_active_appointment_uidx" ON "clinical_encounters"("tenant_id", "appointment_id") WHERE "appointment_id" IS NOT NULL AND "status" IN ('DRAFT', 'IN_PROGRESS');

CREATE INDEX "clinical_encounters_tenant_id_idx" ON "clinical_encounters"("tenant_id");
CREATE INDEX "clinical_encounters_tenant_id_branch_id_idx" ON "clinical_encounters"("tenant_id", "branch_id");
CREATE INDEX "clinical_encounters_tenant_id_patient_id_idx" ON "clinical_encounters"("tenant_id", "patient_id");
CREATE INDEX "clinical_encounters_tenant_id_doctor_id_idx" ON "clinical_encounters"("tenant_id", "doctor_id");
CREATE INDEX "clinical_encounters_tenant_id_appointment_id_idx" ON "clinical_encounters"("tenant_id", "appointment_id");
CREATE INDEX "clinical_encounters_tenant_id_status_idx" ON "clinical_encounters"("tenant_id", "status");
CREATE INDEX "clinical_encounters_tenant_id_consultation_date_idx" ON "clinical_encounters"("tenant_id", "consultation_date");

CREATE INDEX "encounter_vitals_tenant_id_idx" ON "encounter_vitals"("tenant_id");
CREATE INDEX "encounter_vitals_tenant_id_encounter_id_idx" ON "encounter_vitals"("tenant_id", "encounter_id");
CREATE INDEX "encounter_diagnoses_tenant_id_idx" ON "encounter_diagnoses"("tenant_id");
CREATE INDEX "encounter_diagnoses_tenant_id_encounter_id_idx" ON "encounter_diagnoses"("tenant_id", "encounter_id");
CREATE INDEX "encounter_medicine_advices_tenant_id_idx" ON "encounter_medicine_advices"("tenant_id");
CREATE INDEX "encounter_medicine_advices_tenant_id_encounter_id_idx" ON "encounter_medicine_advices"("tenant_id", "encounter_id");
CREATE INDEX "encounter_investigation_advices_tenant_id_idx" ON "encounter_investigation_advices"("tenant_id");
CREATE INDEX "encounter_investigation_advices_tenant_id_encounter_id_idx" ON "encounter_investigation_advices"("tenant_id", "encounter_id");

ALTER TABLE "tenant_encounter_counters" ADD CONSTRAINT "tenant_encounter_counters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clinical_encounters" ADD CONSTRAINT "clinical_encounters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clinical_encounters" ADD CONSTRAINT "clinical_encounters_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clinical_encounters" ADD CONSTRAINT "clinical_encounters_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clinical_encounters" ADD CONSTRAINT "clinical_encounters_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clinical_encounters" ADD CONSTRAINT "clinical_encounters_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "clinical_encounters" ADD CONSTRAINT "clinical_encounters_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "encounter_vitals" ADD CONSTRAINT "encounter_vitals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "encounter_vitals" ADD CONSTRAINT "encounter_vitals_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "clinical_encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "encounter_diagnoses" ADD CONSTRAINT "encounter_diagnoses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "encounter_diagnoses" ADD CONSTRAINT "encounter_diagnoses_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "clinical_encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "encounter_medicine_advices" ADD CONSTRAINT "encounter_medicine_advices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "encounter_medicine_advices" ADD CONSTRAINT "encounter_medicine_advices_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "clinical_encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "encounter_investigation_advices" ADD CONSTRAINT "encounter_investigation_advices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "encounter_investigation_advices" ADD CONSTRAINT "encounter_investigation_advices_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "clinical_encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
