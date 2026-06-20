-- CreateTable
CREATE TABLE "host_service_parameters" (
    "id" TEXT NOT NULL,
    "host_service_id" TEXT NOT NULL,
    "parameter_code" TEXT NOT NULL,
    "parameter_name" TEXT NOT NULL,
    "unit" TEXT,
    "result_type" "ResultType" NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "host_service_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "host_service_sample_requirements" (
    "id" TEXT NOT NULL,
    "host_service_id" TEXT NOT NULL,
    "sample_type_id" TEXT,
    "sample_container_id" TEXT,
    "test_method_id" TEXT,
    "reporting_method_id" TEXT,
    "analyzer_id" TEXT,
    "specimen_instruction" TEXT,
    "fasting_required" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "host_service_sample_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_service_branches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "tenant_service_id" TEXT NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "branch_price" DECIMAL(18,2),
    "branch_discount_allowed" BOOLEAN NOT NULL DEFAULT true,
    "tat_minutes" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "tenant_service_branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "host_service_parameters_host_service_id_idx" ON "host_service_parameters"("host_service_id");

-- CreateIndex
CREATE INDEX "host_service_parameters_created_at_idx" ON "host_service_parameters"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "host_service_parameters_host_service_id_parameter_code_key" ON "host_service_parameters"("host_service_id", "parameter_code");

-- CreateIndex
CREATE INDEX "host_service_sample_requirements_host_service_id_idx" ON "host_service_sample_requirements"("host_service_id");

-- CreateIndex
CREATE INDEX "host_service_sample_requirements_sample_type_id_idx" ON "host_service_sample_requirements"("sample_type_id");

-- CreateIndex
CREATE INDEX "host_service_sample_requirements_sample_container_id_idx" ON "host_service_sample_requirements"("sample_container_id");

-- CreateIndex
CREATE INDEX "host_service_sample_requirements_created_at_idx" ON "host_service_sample_requirements"("created_at");

-- CreateIndex
CREATE INDEX "tenant_service_branches_tenant_id_idx" ON "tenant_service_branches"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_service_branches_branch_id_idx" ON "tenant_service_branches"("branch_id");

-- CreateIndex
CREATE INDEX "tenant_service_branches_tenant_service_id_idx" ON "tenant_service_branches"("tenant_service_id");

-- CreateIndex
CREATE INDEX "tenant_service_branches_tenant_id_is_active_idx" ON "tenant_service_branches"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "tenant_service_branches_created_at_idx" ON "tenant_service_branches"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_service_branches_tenant_id_branch_id_tenant_service__key" ON "tenant_service_branches"("tenant_id", "branch_id", "tenant_service_id");

-- AddForeignKey
ALTER TABLE "host_service_parameters" ADD CONSTRAINT "host_service_parameters_host_service_id_fkey" FOREIGN KEY ("host_service_id") REFERENCES "host_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_service_sample_requirements" ADD CONSTRAINT "host_service_sample_requirements_host_service_id_fkey" FOREIGN KEY ("host_service_id") REFERENCES "host_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_service_sample_requirements" ADD CONSTRAINT "host_service_sample_requirements_sample_type_id_fkey" FOREIGN KEY ("sample_type_id") REFERENCES "sample_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_service_sample_requirements" ADD CONSTRAINT "host_service_sample_requirements_sample_container_id_fkey" FOREIGN KEY ("sample_container_id") REFERENCES "sample_containers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_service_sample_requirements" ADD CONSTRAINT "host_service_sample_requirements_test_method_id_fkey" FOREIGN KEY ("test_method_id") REFERENCES "test_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_service_sample_requirements" ADD CONSTRAINT "host_service_sample_requirements_reporting_method_id_fkey" FOREIGN KEY ("reporting_method_id") REFERENCES "reporting_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_service_sample_requirements" ADD CONSTRAINT "host_service_sample_requirements_analyzer_id_fkey" FOREIGN KEY ("analyzer_id") REFERENCES "analyzers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_service_branches" ADD CONSTRAINT "tenant_service_branches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_service_branches" ADD CONSTRAINT "tenant_service_branches_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_service_branches" ADD CONSTRAINT "tenant_service_branches_tenant_service_id_fkey" FOREIGN KEY ("tenant_service_id") REFERENCES "tenant_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
