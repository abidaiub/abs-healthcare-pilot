-- MOD-19 Prescription Management

CREATE TYPE "PrescriptionStatus" AS ENUM ('DRAFT', 'FINALIZED', 'CANCELLED', 'SUPERSEDED');
CREATE TYPE "PrescriptionDurationUnit" AS ENUM ('DAY', 'WEEK', 'MONTH');

CREATE TABLE "tenant_prescription_counters" (
    "tenant_id" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "tenant_prescription_counters_pkey" PRIMARY KEY ("tenant_id")
);

CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "encounter_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "department_id" TEXT,
    "prescription_number" TEXT NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'DRAFT',
    "version_number" INTEGER NOT NULL DEFAULT 1,
    "is_current_version" BOOLEAN NOT NULL DEFAULT true,
    "supersedes_prescription_id" TEXT,
    "prescribed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalized_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "general_advice" TEXT,
    "follow_up_date" DATE,
    "follow_up_interval_days" INTEGER,
    "follow_up_instructions" TEXT,
    "clinical_summary" TEXT,
    "revision_reason" TEXT,
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" TEXT,
    "updated_by" TEXT,
    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prescription_medicines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "prescription_id" TEXT NOT NULL,
    "source_encounter_medicine_advice_id" TEXT,
    "medicine_name" TEXT NOT NULL,
    "generic_name" TEXT,
    "strength" TEXT,
    "dose" TEXT,
    "route" TEXT,
    "frequency" TEXT,
    "duration_value" INTEGER,
    "duration_unit" "PrescriptionDurationUnit",
    "duration_text" TEXT,
    "quantity" TEXT,
    "food_timing" TEXT,
    "instructions" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "prescription_medicines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prescription_diagnoses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "prescription_id" TEXT NOT NULL,
    "source_encounter_diagnosis_id" TEXT,
    "diagnosis_type" "DiagnosisType" NOT NULL,
    "diagnosis_text" TEXT NOT NULL,
    "icd_code" TEXT,
    "notes" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prescription_diagnoses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "prescription_investigations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "prescription_id" TEXT NOT NULL,
    "source_encounter_investigation_id" TEXT,
    "investigation_text" TEXT NOT NULL,
    "priority" TEXT,
    "instructions" TEXT,
    "clinical_note" TEXT,
    "status" "InvestigationAdviceStatus" NOT NULL DEFAULT 'ADVISED',
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prescription_investigations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prescriptions_tenant_id_prescription_number_version_number_key" ON "prescriptions"("tenant_id", "prescription_number", "version_number");
CREATE UNIQUE INDEX "prescriptions_current_encounter_uidx" ON "prescriptions"("tenant_id", "encounter_id") WHERE "is_current_version" = true AND "status" IN ('DRAFT', 'FINALIZED');
CREATE UNIQUE INDEX "prescriptions_draft_encounter_uidx" ON "prescriptions"("tenant_id", "encounter_id") WHERE "status" = 'DRAFT';

CREATE INDEX "prescriptions_tenant_id_idx" ON "prescriptions"("tenant_id");
CREATE INDEX "prescriptions_tenant_id_branch_id_idx" ON "prescriptions"("tenant_id", "branch_id");
CREATE INDEX "prescriptions_tenant_id_patient_id_idx" ON "prescriptions"("tenant_id", "patient_id");
CREATE INDEX "prescriptions_tenant_id_doctor_id_idx" ON "prescriptions"("tenant_id", "doctor_id");
CREATE INDEX "prescriptions_tenant_id_encounter_id_idx" ON "prescriptions"("tenant_id", "encounter_id");
CREATE INDEX "prescriptions_tenant_id_status_idx" ON "prescriptions"("tenant_id", "status");
CREATE INDEX "prescriptions_tenant_id_is_current_version_idx" ON "prescriptions"("tenant_id", "is_current_version");
CREATE INDEX "prescriptions_tenant_id_prescription_number_idx" ON "prescriptions"("tenant_id", "prescription_number");

CREATE INDEX "prescription_medicines_tenant_id_idx" ON "prescription_medicines"("tenant_id");
CREATE INDEX "prescription_medicines_tenant_id_prescription_id_idx" ON "prescription_medicines"("tenant_id", "prescription_id");
CREATE INDEX "prescription_diagnoses_tenant_id_idx" ON "prescription_diagnoses"("tenant_id");
CREATE INDEX "prescription_diagnoses_tenant_id_prescription_id_idx" ON "prescription_diagnoses"("tenant_id", "prescription_id");
CREATE INDEX "prescription_investigations_tenant_id_idx" ON "prescription_investigations"("tenant_id");
CREATE INDEX "prescription_investigations_tenant_id_prescription_id_idx" ON "prescription_investigations"("tenant_id", "prescription_id");

ALTER TABLE "tenant_prescription_counters" ADD CONSTRAINT "tenant_prescription_counters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "clinical_encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_supersedes_prescription_id_fkey" FOREIGN KEY ("supersedes_prescription_id") REFERENCES "prescriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "prescription_medicines" ADD CONSTRAINT "prescription_medicines_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prescription_medicines" ADD CONSTRAINT "prescription_medicines_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prescription_diagnoses" ADD CONSTRAINT "prescription_diagnoses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prescription_diagnoses" ADD CONSTRAINT "prescription_diagnoses_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prescription_investigations" ADD CONSTRAINT "prescription_investigations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prescription_investigations" ADD CONSTRAINT "prescription_investigations_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
