-- CreateEnum
CREATE TYPE "ResultSource" AS ENUM ('MANUAL_ENTRY', 'ANALYZER_IMPORT', 'CALCULATED', 'EXTERNAL_API');

-- CreateEnum
CREATE TYPE "AnalyzerImportChannel" AS ENUM ('HL7', 'ASTM', 'CSV', 'API', 'MIDDLEWARE');

-- CreateEnum
CREATE TYPE "AnalyzerImportStatus" AS ENUM ('PENDING', 'SUCCESS', 'ERROR', 'QUARANTINED', 'DUPLICATE', 'RECONCILED');

-- CreateEnum
CREATE TYPE "AnalyzerImportErrorCode" AS ENUM ('UNMAPPED_TEST_CODE', 'UNKNOWN_SAMPLE_BARCODE', 'SAMPLE_REJECTED', 'TEST_ALREADY_COMPLETED', 'DUPLICATE_MESSAGE', 'PARAMETER_NOT_FOUND', 'BRANCH_SCOPE_MISMATCH', 'INVALID_PAYLOAD');

-- AlterTable
ALTER TABLE "lab_result_items" ADD COLUMN     "analyzer_id" TEXT,
ADD COLUMN     "import_queue_id" TEXT,
ADD COLUMN     "imported_at" TIMESTAMP(3),
ADD COLUMN     "manual_overridden_at" TIMESTAMP(3),
ADD COLUMN     "manual_overridden_by_id" TEXT,
ADD COLUMN     "manual_override_reason" TEXT,
ADD COLUMN     "result_source" "ResultSource" NOT NULL DEFAULT 'MANUAL_ENTRY';

-- CreateTable
CREATE TABLE "analyzer_mappings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "analyzer_id" TEXT NOT NULL,
    "machine_test_code" TEXT NOT NULL,
    "tenant_service_id" TEXT NOT NULL,
    "parameter_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" TEXT,

    CONSTRAINT "analyzer_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyzer_import_queue" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "analyzer_id" TEXT,
    "machine_sample_id" TEXT NOT NULL,
    "machine_test_code" TEXT,
    "message_control_id" TEXT NOT NULL,
    "import_channel" "AnalyzerImportChannel" NOT NULL,
    "raw_payload" TEXT NOT NULL,
    "processed_status" "AnalyzerImportStatus" NOT NULL DEFAULT 'PENDING',
    "lab_sample_id" TEXT,
    "lab_order_test_id" TEXT,
    "lab_result_id" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "processed_by_id" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analyzer_import_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyzer_error_queue" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "queue_id" TEXT NOT NULL,
    "error_code" "AnalyzerImportErrorCode" NOT NULL,
    "error_message" TEXT NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_id" TEXT,
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analyzer_error_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analyzer_mappings_tenant_id_idx" ON "analyzer_mappings"("tenant_id");

-- CreateIndex
CREATE INDEX "analyzer_mappings_tenant_id_analyzer_id_idx" ON "analyzer_mappings"("tenant_id", "analyzer_id");

-- CreateIndex
CREATE INDEX "analyzer_mappings_tenant_id_tenant_service_id_idx" ON "analyzer_mappings"("tenant_id", "tenant_service_id");

-- CreateIndex
CREATE UNIQUE INDEX "analyzer_mappings_tenant_id_analyzer_id_machine_test_code_p_key" ON "analyzer_mappings"("tenant_id", "analyzer_id", "machine_test_code", "parameter_code");

-- CreateIndex
CREATE INDEX "analyzer_import_queue_tenant_id_idx" ON "analyzer_import_queue"("tenant_id");

-- CreateIndex
CREATE INDEX "analyzer_import_queue_tenant_id_processed_status_idx" ON "analyzer_import_queue"("tenant_id", "processed_status");

-- CreateIndex
CREATE INDEX "analyzer_import_queue_tenant_id_machine_sample_id_idx" ON "analyzer_import_queue"("tenant_id", "machine_sample_id");

-- CreateIndex
CREATE INDEX "analyzer_import_queue_tenant_id_received_at_idx" ON "analyzer_import_queue"("tenant_id", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "analyzer_import_queue_tenant_id_message_control_id_key" ON "analyzer_import_queue"("tenant_id", "message_control_id");

-- CreateIndex
CREATE INDEX "analyzer_error_queue_tenant_id_idx" ON "analyzer_error_queue"("tenant_id");

-- CreateIndex
CREATE INDEX "analyzer_error_queue_tenant_id_queue_id_idx" ON "analyzer_error_queue"("tenant_id", "queue_id");

-- CreateIndex
CREATE INDEX "analyzer_error_queue_tenant_id_resolved_at_idx" ON "analyzer_error_queue"("tenant_id", "resolved_at");

-- AddForeignKey
ALTER TABLE "analyzer_mappings" ADD CONSTRAINT "analyzer_mappings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyzer_mappings" ADD CONSTRAINT "analyzer_mappings_analyzer_id_fkey" FOREIGN KEY ("analyzer_id") REFERENCES "analyzers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyzer_mappings" ADD CONSTRAINT "analyzer_mappings_tenant_service_id_fkey" FOREIGN KEY ("tenant_service_id") REFERENCES "tenant_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyzer_import_queue" ADD CONSTRAINT "analyzer_import_queue_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyzer_import_queue" ADD CONSTRAINT "analyzer_import_queue_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyzer_import_queue" ADD CONSTRAINT "analyzer_import_queue_analyzer_id_fkey" FOREIGN KEY ("analyzer_id") REFERENCES "analyzers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyzer_import_queue" ADD CONSTRAINT "analyzer_import_queue_lab_sample_id_fkey" FOREIGN KEY ("lab_sample_id") REFERENCES "lab_samples"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyzer_import_queue" ADD CONSTRAINT "analyzer_import_queue_lab_order_test_id_fkey" FOREIGN KEY ("lab_order_test_id") REFERENCES "lab_order_tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyzer_import_queue" ADD CONSTRAINT "analyzer_import_queue_lab_result_id_fkey" FOREIGN KEY ("lab_result_id") REFERENCES "lab_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyzer_error_queue" ADD CONSTRAINT "analyzer_error_queue_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyzer_error_queue" ADD CONSTRAINT "analyzer_error_queue_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "analyzer_import_queue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
