-- MOD-22 Laboratory Result Entry

-- Extend lab order test lifecycle
ALTER TYPE "LabOrderTestStatus" ADD VALUE IF NOT EXISTS 'RESULT_IN_PROGRESS';
ALTER TYPE "LabOrderTestStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_VERIFICATION';

-- CreateEnum
CREATE TYPE "LabResultStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'ENTRY_COMPLETED', 'READY_FOR_VERIFICATION', 'VERIFIED', 'REJECTED_FOR_CORRECTION', 'AMENDED', 'CANCELLED');
CREATE TYPE "AbnormalFlag" AS ENUM ('NORMAL', 'LOW', 'HIGH', 'ABNORMAL', 'CRITICAL_LOW', 'CRITICAL_HIGH', 'NOT_APPLICABLE', 'UNDETERMINED');

-- Extend service parameter metadata
ALTER TABLE "service_parameters" ADD COLUMN IF NOT EXISTS "decimal_places" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "service_parameters" ADD COLUMN IF NOT EXISTS "is_required" BOOLEAN NOT NULL DEFAULT true;

-- Extend reference range metadata
ALTER TABLE "service_parameter_reference_ranges" ADD COLUMN IF NOT EXISTS "unit" TEXT;
ALTER TABLE "service_parameter_reference_ranges" ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "lab_results" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "lab_order_id" TEXT NOT NULL,
    "lab_order_test_id" TEXT NOT NULL,
    "lab_sample_id" TEXT NOT NULL,
    "status" "LabResultStatus" NOT NULL DEFAULT 'DRAFT',
    "internal_note" TEXT,
    "report_note" TEXT,
    "patient_age_days" INTEGER,
    "reference_date" TIMESTAMP(3),
    "entered_by_id" TEXT,
    "entered_at" TIMESTAMP(3),
    "entry_completed_by_id" TEXT,
    "entry_completed_at" TIMESTAMP(3),
    "reopen_reason" TEXT,
    "reopened_at" TIMESTAMP(3),
    "reopened_by_id" TEXT,
    "record_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lab_result_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lab_result_id" TEXT NOT NULL,
    "service_parameter_id" TEXT,
    "parameter_code" TEXT NOT NULL,
    "parameter_name" TEXT NOT NULL,
    "result_type" "ResultType" NOT NULL,
    "decimal_places" INTEGER NOT NULL DEFAULT 2,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "numeric_value" DECIMAL(18,4),
    "text_value" TEXT,
    "choice_value" TEXT,
    "boolean_value" BOOLEAN,
    "unit_snapshot" TEXT,
    "reference_range_snapshot" TEXT,
    "lower_bound_snapshot" DECIMAL(18,4),
    "upper_bound_snapshot" DECIMAL(18,4),
    "critical_low_snapshot" DECIMAL(18,4),
    "critical_high_snapshot" DECIMAL(18,4),
    "selected_reference_range_id" TEXT,
    "abnormal_flag" "AbnormalFlag" NOT NULL DEFAULT 'UNDETERMINED',
    "is_critical" BOOLEAN NOT NULL DEFAULT false,
    "flag_override_reason" TEXT,
    "technician_comment" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_result_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lab_critical_value_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lab_result_id" TEXT NOT NULL,
    "lab_result_item_id" TEXT NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detected_by_id" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "acknowledged_by_id" TEXT,
    "communication_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_critical_value_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lab_results_lab_order_test_id_key" ON "lab_results"("lab_order_test_id");
CREATE INDEX "lab_results_tenant_id_idx" ON "lab_results"("tenant_id");
CREATE INDEX "lab_results_tenant_id_branch_id_idx" ON "lab_results"("tenant_id", "branch_id");
CREATE INDEX "lab_results_tenant_id_status_idx" ON "lab_results"("tenant_id", "status");
CREATE INDEX "lab_results_tenant_id_lab_order_id_idx" ON "lab_results"("tenant_id", "lab_order_id");
CREATE INDEX "lab_results_tenant_id_lab_sample_id_idx" ON "lab_results"("tenant_id", "lab_sample_id");
CREATE INDEX "lab_results_tenant_id_entry_completed_at_idx" ON "lab_results"("tenant_id", "entry_completed_at");

CREATE INDEX "lab_result_items_tenant_id_idx" ON "lab_result_items"("tenant_id");
CREATE INDEX "lab_result_items_tenant_id_lab_result_id_idx" ON "lab_result_items"("tenant_id", "lab_result_id");
CREATE INDEX "lab_result_items_lab_result_id_display_order_idx" ON "lab_result_items"("lab_result_id", "display_order");

CREATE INDEX "lab_critical_value_events_tenant_id_idx" ON "lab_critical_value_events"("tenant_id");
CREATE INDEX "lab_critical_value_events_tenant_id_lab_result_id_idx" ON "lab_critical_value_events"("tenant_id", "lab_result_id");
CREATE INDEX "lab_critical_value_events_lab_result_item_id_idx" ON "lab_critical_value_events"("lab_result_item_id");

ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "lab_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_lab_order_test_id_fkey" FOREIGN KEY ("lab_order_test_id") REFERENCES "lab_order_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_lab_sample_id_fkey" FOREIGN KEY ("lab_sample_id") REFERENCES "lab_samples"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lab_result_items" ADD CONSTRAINT "lab_result_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_result_items" ADD CONSTRAINT "lab_result_items_lab_result_id_fkey" FOREIGN KEY ("lab_result_id") REFERENCES "lab_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_result_items" ADD CONSTRAINT "lab_result_items_service_parameter_id_fkey" FOREIGN KEY ("service_parameter_id") REFERENCES "service_parameters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lab_critical_value_events" ADD CONSTRAINT "lab_critical_value_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_critical_value_events" ADD CONSTRAINT "lab_critical_value_events_lab_result_id_fkey" FOREIGN KEY ("lab_result_id") REFERENCES "lab_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_critical_value_events" ADD CONSTRAINT "lab_critical_value_events_lab_result_item_id_fkey" FOREIGN KEY ("lab_result_item_id") REFERENCES "lab_result_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
