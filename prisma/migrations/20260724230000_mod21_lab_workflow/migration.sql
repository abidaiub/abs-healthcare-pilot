-- MOD-21 Sample Collection & Lab Workflow

CREATE TYPE "LabOrderSource" AS ENUM ('ENCOUNTER_ADVICE', 'PRESCRIPTION', 'MANUAL');
CREATE TYPE "LabOrderPriority" AS ENUM ('ROUTINE', 'URGENT', 'STAT');
CREATE TYPE "LabOrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PARTIALLY_COLLECTED', 'COLLECTED', 'RECEIVED', 'IN_PROCESS', 'READY_FOR_RESULT', 'COMPLETED', 'CANCELLED');
CREATE TYPE "LabOrderTestStatus" AS ENUM ('ORDERED', 'SAMPLE_PENDING', 'SAMPLE_COLLECTED', 'SAMPLE_RECEIVED', 'IN_PROCESS', 'READY_FOR_RESULT', 'COMPLETED', 'CANCELLED', 'RECOLLECTION_REQUIRED');
CREATE TYPE "LabSampleStatus" AS ENUM ('PENDING_COLLECTION', 'COLLECTED', 'RECEIVED', 'REJECTED', 'IN_PROCESS', 'READY_FOR_RESULT', 'COMPLETED');
CREATE TYPE "SampleReceiptOutcome" AS ENUM ('ACCEPTED', 'REJECTED');

CREATE TABLE "tenant_lab_order_counters" (
    "tenant_id" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "tenant_lab_order_counters_pkey" PRIMARY KEY ("tenant_id")
);

CREATE TABLE "tenant_lab_accession_counters" (
    "tenant_id" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "tenant_lab_accession_counters_pkey" PRIMARY KEY ("tenant_id")
);

CREATE TABLE "sample_rejection_reasons" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "reason_code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sample_rejection_reasons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lab_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT,
    "encounter_id" TEXT,
    "appointment_id" TEXT,
    "prescription_id" TEXT,
    "order_number" TEXT NOT NULL,
    "order_source" "LabOrderSource" NOT NULL,
    "priority" "LabOrderPriority" NOT NULL DEFAULT 'ROUTINE',
    "status" "LabOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "clinical_note" TEXT,
    "ordered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" TEXT,
    CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lab_order_tests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lab_order_id" TEXT NOT NULL,
    "tenant_service_id" TEXT,
    "source_encounter_investigation_id" TEXT,
    "source_prescription_investigation_id" TEXT,
    "test_code" TEXT,
    "test_name" TEXT NOT NULL,
    "department_id" TEXT,
    "sample_type_id" TEXT,
    "sample_container_id" TEXT,
    "specimen_requirement_snapshot" TEXT,
    "instructions" TEXT,
    "priority" "LabOrderPriority" NOT NULL DEFAULT 'ROUTINE',
    "status" "LabOrderTestStatus" NOT NULL DEFAULT 'ORDERED',
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lab_order_tests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lab_samples" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "lab_order_id" TEXT NOT NULL,
    "sample_type_id" TEXT,
    "sample_container_id" TEXT,
    "accession_number" TEXT NOT NULL,
    "barcode_value" TEXT NOT NULL,
    "collection_site" TEXT,
    "sample_status" "LabSampleStatus" NOT NULL DEFAULT 'PENDING_COLLECTION',
    "collected_at" TIMESTAMP(3),
    "collected_by_id" TEXT,
    "received_at" TIMESTAMP(3),
    "received_by_id" TEXT,
    "receipt_outcome" "SampleReceiptOutcome",
    "condition_on_receipt" TEXT,
    "receipt_note" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejected_by_id" TEXT,
    "rejection_reason_id" TEXT,
    "rejection_note" TEXT,
    "recollection_required" BOOLEAN NOT NULL DEFAULT false,
    "supersedes_sample_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lab_samples_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lab_sample_tests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lab_sample_id" TEXT NOT NULL,
    "lab_order_test_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lab_sample_tests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sample_rejection_reasons_tenant_id_reason_code_key" ON "sample_rejection_reasons"("tenant_id", "reason_code");
CREATE UNIQUE INDEX "lab_orders_tenant_id_order_number_key" ON "lab_orders"("tenant_id", "order_number");
CREATE UNIQUE INDEX "lab_samples_tenant_id_accession_number_key" ON "lab_samples"("tenant_id", "accession_number");
CREATE UNIQUE INDEX "lab_sample_tests_lab_sample_id_lab_order_test_id_key" ON "lab_sample_tests"("lab_sample_id", "lab_order_test_id");

CREATE INDEX "sample_rejection_reasons_tenant_id_idx" ON "sample_rejection_reasons"("tenant_id");
CREATE INDEX "lab_orders_tenant_id_idx" ON "lab_orders"("tenant_id");
CREATE INDEX "lab_orders_tenant_id_branch_id_idx" ON "lab_orders"("tenant_id", "branch_id");
CREATE INDEX "lab_orders_tenant_id_patient_id_idx" ON "lab_orders"("tenant_id", "patient_id");
CREATE INDEX "lab_orders_tenant_id_status_idx" ON "lab_orders"("tenant_id", "status");
CREATE INDEX "lab_orders_tenant_id_order_number_idx" ON "lab_orders"("tenant_id", "order_number");
CREATE INDEX "lab_orders_tenant_id_ordered_at_idx" ON "lab_orders"("tenant_id", "ordered_at");
CREATE INDEX "lab_order_tests_tenant_id_idx" ON "lab_order_tests"("tenant_id");
CREATE INDEX "lab_order_tests_tenant_id_lab_order_id_idx" ON "lab_order_tests"("tenant_id", "lab_order_id");
CREATE INDEX "lab_order_tests_tenant_id_status_idx" ON "lab_order_tests"("tenant_id", "status");
CREATE INDEX "lab_samples_tenant_id_idx" ON "lab_samples"("tenant_id");
CREATE INDEX "lab_samples_tenant_id_branch_id_idx" ON "lab_samples"("tenant_id", "branch_id");
CREATE INDEX "lab_samples_tenant_id_lab_order_id_idx" ON "lab_samples"("tenant_id", "lab_order_id");
CREATE INDEX "lab_samples_tenant_id_sample_status_idx" ON "lab_samples"("tenant_id", "sample_status");
CREATE INDEX "lab_samples_tenant_id_accession_number_idx" ON "lab_samples"("tenant_id", "accession_number");
CREATE INDEX "lab_samples_tenant_id_barcode_value_idx" ON "lab_samples"("tenant_id", "barcode_value");
CREATE INDEX "lab_sample_tests_tenant_id_idx" ON "lab_sample_tests"("tenant_id");
CREATE INDEX "lab_sample_tests_tenant_id_lab_sample_id_idx" ON "lab_sample_tests"("tenant_id", "lab_sample_id");
CREATE INDEX "lab_sample_tests_tenant_id_lab_order_test_id_idx" ON "lab_sample_tests"("tenant_id", "lab_order_test_id");

ALTER TABLE "tenant_lab_order_counters" ADD CONSTRAINT "tenant_lab_order_counters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tenant_lab_accession_counters" ADD CONSTRAINT "tenant_lab_accession_counters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sample_rejection_reasons" ADD CONSTRAINT "sample_rejection_reasons_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "clinical_encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lab_order_tests" ADD CONSTRAINT "lab_order_tests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_order_tests" ADD CONSTRAINT "lab_order_tests_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "lab_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_order_tests" ADD CONSTRAINT "lab_order_tests_tenant_service_id_fkey" FOREIGN KEY ("tenant_service_id") REFERENCES "tenant_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lab_order_tests" ADD CONSTRAINT "lab_order_tests_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lab_order_tests" ADD CONSTRAINT "lab_order_tests_sample_type_id_fkey" FOREIGN KEY ("sample_type_id") REFERENCES "sample_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lab_order_tests" ADD CONSTRAINT "lab_order_tests_sample_container_id_fkey" FOREIGN KEY ("sample_container_id") REFERENCES "sample_containers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lab_order_tests" ADD CONSTRAINT "lab_order_tests_source_encounter_investigation_id_fkey" FOREIGN KEY ("source_encounter_investigation_id") REFERENCES "encounter_investigation_advices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lab_order_tests" ADD CONSTRAINT "lab_order_tests_source_prescription_investigation_id_fkey" FOREIGN KEY ("source_prescription_investigation_id") REFERENCES "prescription_investigations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lab_samples" ADD CONSTRAINT "lab_samples_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_samples" ADD CONSTRAINT "lab_samples_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_samples" ADD CONSTRAINT "lab_samples_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "lab_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_samples" ADD CONSTRAINT "lab_samples_sample_type_id_fkey" FOREIGN KEY ("sample_type_id") REFERENCES "sample_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lab_samples" ADD CONSTRAINT "lab_samples_sample_container_id_fkey" FOREIGN KEY ("sample_container_id") REFERENCES "sample_containers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lab_samples" ADD CONSTRAINT "lab_samples_rejection_reason_id_fkey" FOREIGN KEY ("rejection_reason_id") REFERENCES "sample_rejection_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lab_samples" ADD CONSTRAINT "lab_samples_supersedes_sample_id_fkey" FOREIGN KEY ("supersedes_sample_id") REFERENCES "lab_samples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lab_sample_tests" ADD CONSTRAINT "lab_sample_tests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_sample_tests" ADD CONSTRAINT "lab_sample_tests_lab_sample_id_fkey" FOREIGN KEY ("lab_sample_id") REFERENCES "lab_samples"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_sample_tests" ADD CONSTRAINT "lab_sample_tests_lab_order_test_id_fkey" FOREIGN KEY ("lab_order_test_id") REFERENCES "lab_order_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
