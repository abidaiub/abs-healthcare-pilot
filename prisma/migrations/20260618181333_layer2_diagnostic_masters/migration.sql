-- CreateEnum
CREATE TYPE "ResultType" AS ENUM ('NUMERIC', 'TEXT', 'LONG_TEXT', 'BOOLEAN', 'OPTION_LIST', 'CULTURE', 'NARRATIVE', 'CALCULATED');

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "dept_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dept_type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "department_id" TEXT NOT NULL,
    "category_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "host_services" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "service_code" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "short_name" TEXT,
    "is_sample_required" BOOLEAN NOT NULL DEFAULT true,
    "is_barcode_required" BOOLEAN NOT NULL DEFAULT true,
    "is_lab_test" BOOLEAN NOT NULL DEFAULT true,
    "result_mode" TEXT NOT NULL,
    "base_price" DECIMAL(18,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "host_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_services" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "host_service_id" TEXT,
    "local_name" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "sample_type_id" TEXT,
    "sample_container_id" TEXT,
    "price" DECIMAL(18,2) NOT NULL,
    "discount_allowed" BOOLEAN NOT NULL DEFAULT false,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "test_method_id" TEXT,
    "reporting_method_id" TEXT,
    "analyzer_id" TEXT,
    "is_barcode_required" BOOLEAN NOT NULL DEFAULT true,
    "tat_hours" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "tenant_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_parameters" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tenant_service_id" TEXT NOT NULL,
    "parameter_code" TEXT NOT NULL,
    "parameter_name" TEXT NOT NULL,
    "unit" TEXT,
    "result_type" "ResultType" NOT NULL,
    "formula" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "service_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_parameter_reference_ranges" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "service_parameter_id" TEXT NOT NULL,
    "gender" TEXT,
    "age_from_days" INTEGER,
    "age_to_days" INTEGER,
    "normal_low" DECIMAL(18,4),
    "normal_high" DECIMAL(18,4),
    "critical_low" DECIMAL(18,4),
    "critical_high" DECIMAL(18,4),
    "text_range" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "service_parameter_reference_ranges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_types" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "type_code" TEXT NOT NULL,
    "sample_type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "sample_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_containers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "department_id" TEXT,
    "container_code" TEXT NOT NULL,
    "container_type" TEXT NOT NULL,
    "tube_color" TEXT,
    "collection_instruction" TEXT,
    "barcode_required" BOOLEAN NOT NULL DEFAULT true,
    "sample_required" BOOLEAN NOT NULL DEFAULT true,
    "volume_ml" DECIMAL(10,2),
    "transport_temperature" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "sample_containers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_methods" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "department_id" TEXT,
    "method_code" TEXT NOT NULL,
    "method_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "test_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporting_methods" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "method_code" TEXT NOT NULL,
    "method_name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "reporting_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyzers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "analyzer_code" TEXT NOT NULL,
    "machine_name" TEXT NOT NULL,
    "model" TEXT,
    "manufacturer" TEXT,
    "interface_type" TEXT NOT NULL,
    "protocol" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "analyzers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "doctor_code" TEXT NOT NULL,
    "doctor_name" TEXT NOT NULL,
    "degree" TEXT,
    "specialty" TEXT,
    "department_id" TEXT,
    "bmdc_no" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "signature_image_url" TEXT,
    "seal_image_url" TEXT,
    "is_referring" BOOLEAN NOT NULL DEFAULT false,
    "is_reporting" BOOLEAN NOT NULL DEFAULT false,
    "is_verifying" BOOLEAN NOT NULL DEFAULT false,
    "is_consultant" BOOLEAN NOT NULL DEFAULT false,
    "is_pathologist" BOOLEAN NOT NULL DEFAULT false,
    "is_radiologist" BOOLEAN NOT NULL DEFAULT false,
    "commission_applicable" BOOLEAN NOT NULL DEFAULT false,
    "consultation_fee" DECIMAL(18,2),
    "user_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_branches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "doctor_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_department_mappings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "can_report" BOOLEAN NOT NULL DEFAULT false,
    "can_verify" BOOLEAN NOT NULL DEFAULT false,
    "can_release" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "doctor_department_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_doctor_assignments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "tenant_service_id" TEXT,
    "department_id" TEXT NOT NULL,
    "reporting_doctor_id" TEXT,
    "verifying_doctor_id" TEXT,
    "consultant_doctor_id" TEXT,
    "default_for_report" BOOLEAN NOT NULL DEFAULT false,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "report_doctor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_signature_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "department_id" TEXT,
    "doctor_id" TEXT NOT NULL,
    "signature_position" TEXT NOT NULL,
    "show_degree" BOOLEAN NOT NULL DEFAULT true,
    "show_bmdc" BOOLEAN NOT NULL DEFAULT true,
    "show_seal" BOOLEAN NOT NULL DEFAULT true,
    "footer_text" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "report_signature_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "departments_tenant_id_idx" ON "departments"("tenant_id");

-- CreateIndex
CREATE INDEX "departments_tenant_id_is_active_idx" ON "departments"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "departments_created_at_idx" ON "departments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "departments_tenant_id_dept_code_key" ON "departments"("tenant_id", "dept_code");

-- CreateIndex
CREATE INDEX "categories_tenant_id_idx" ON "categories"("tenant_id");

-- CreateIndex
CREATE INDEX "categories_tenant_id_is_active_idx" ON "categories"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "categories_created_at_idx" ON "categories"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "categories_tenant_id_department_id_category_code_key" ON "categories"("tenant_id", "department_id", "category_code");

-- CreateIndex
CREATE UNIQUE INDEX "host_services_service_code_key" ON "host_services"("service_code");

-- CreateIndex
CREATE INDEX "host_services_department_id_idx" ON "host_services"("department_id");

-- CreateIndex
CREATE INDEX "host_services_category_id_idx" ON "host_services"("category_id");

-- CreateIndex
CREATE INDEX "host_services_created_at_idx" ON "host_services"("created_at");

-- CreateIndex
CREATE INDEX "tenant_services_tenant_id_idx" ON "tenant_services"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_services_tenant_id_is_active_idx" ON "tenant_services"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "tenant_services_department_id_idx" ON "tenant_services"("department_id");

-- CreateIndex
CREATE INDEX "tenant_services_category_id_idx" ON "tenant_services"("category_id");

-- CreateIndex
CREATE INDEX "tenant_services_created_at_idx" ON "tenant_services"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_services_tenant_id_host_service_id_key" ON "tenant_services"("tenant_id", "host_service_id");

-- CreateIndex
CREATE INDEX "service_parameters_tenant_id_idx" ON "service_parameters"("tenant_id");

-- CreateIndex
CREATE INDEX "service_parameters_tenant_id_is_active_idx" ON "service_parameters"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "service_parameters_tenant_service_id_idx" ON "service_parameters"("tenant_service_id");

-- CreateIndex
CREATE INDEX "service_parameters_created_at_idx" ON "service_parameters"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "service_parameters_tenant_id_tenant_service_id_parameter_co_key" ON "service_parameters"("tenant_id", "tenant_service_id", "parameter_code");

-- CreateIndex
CREATE INDEX "service_parameter_reference_ranges_tenant_id_idx" ON "service_parameter_reference_ranges"("tenant_id");

-- CreateIndex
CREATE INDEX "service_parameter_reference_ranges_tenant_id_is_active_idx" ON "service_parameter_reference_ranges"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "service_parameter_reference_ranges_service_parameter_id_idx" ON "service_parameter_reference_ranges"("service_parameter_id");

-- CreateIndex
CREATE INDEX "service_parameter_reference_ranges_created_at_idx" ON "service_parameter_reference_ranges"("created_at");

-- CreateIndex
CREATE INDEX "sample_types_tenant_id_idx" ON "sample_types"("tenant_id");

-- CreateIndex
CREATE INDEX "sample_types_tenant_id_is_active_idx" ON "sample_types"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "sample_types_created_at_idx" ON "sample_types"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sample_types_tenant_id_type_code_key" ON "sample_types"("tenant_id", "type_code");

-- CreateIndex
CREATE INDEX "sample_containers_tenant_id_idx" ON "sample_containers"("tenant_id");

-- CreateIndex
CREATE INDEX "sample_containers_tenant_id_is_active_idx" ON "sample_containers"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "sample_containers_department_id_idx" ON "sample_containers"("department_id");

-- CreateIndex
CREATE INDEX "sample_containers_created_at_idx" ON "sample_containers"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sample_containers_tenant_id_container_code_key" ON "sample_containers"("tenant_id", "container_code");

-- CreateIndex
CREATE INDEX "test_methods_tenant_id_idx" ON "test_methods"("tenant_id");

-- CreateIndex
CREATE INDEX "test_methods_branch_id_idx" ON "test_methods"("branch_id");

-- CreateIndex
CREATE INDEX "test_methods_tenant_id_is_active_idx" ON "test_methods"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "test_methods_created_at_idx" ON "test_methods"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "test_methods_tenant_id_branch_id_method_code_key" ON "test_methods"("tenant_id", "branch_id", "method_code");

-- CreateIndex
CREATE INDEX "reporting_methods_tenant_id_idx" ON "reporting_methods"("tenant_id");

-- CreateIndex
CREATE INDEX "reporting_methods_tenant_id_is_active_idx" ON "reporting_methods"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "reporting_methods_created_at_idx" ON "reporting_methods"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "reporting_methods_tenant_id_method_code_key" ON "reporting_methods"("tenant_id", "method_code");

-- CreateIndex
CREATE INDEX "analyzers_tenant_id_idx" ON "analyzers"("tenant_id");

-- CreateIndex
CREATE INDEX "analyzers_branch_id_idx" ON "analyzers"("branch_id");

-- CreateIndex
CREATE INDEX "analyzers_tenant_id_is_active_idx" ON "analyzers"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "analyzers_created_at_idx" ON "analyzers"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "analyzers_tenant_id_branch_id_analyzer_code_key" ON "analyzers"("tenant_id", "branch_id", "analyzer_code");

-- CreateIndex
CREATE INDEX "doctors_tenant_id_idx" ON "doctors"("tenant_id");

-- CreateIndex
CREATE INDEX "doctors_tenant_id_is_active_idx" ON "doctors"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "doctors_department_id_idx" ON "doctors"("department_id");

-- CreateIndex
CREATE INDEX "doctors_user_id_idx" ON "doctors"("user_id");

-- CreateIndex
CREATE INDEX "doctors_created_at_idx" ON "doctors"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_tenant_id_doctor_code_key" ON "doctors"("tenant_id", "doctor_code");

-- CreateIndex
CREATE INDEX "doctor_branches_tenant_id_idx" ON "doctor_branches"("tenant_id");

-- CreateIndex
CREATE INDEX "doctor_branches_doctor_id_idx" ON "doctor_branches"("doctor_id");

-- CreateIndex
CREATE INDEX "doctor_branches_branch_id_idx" ON "doctor_branches"("branch_id");

-- CreateIndex
CREATE INDEX "doctor_branches_created_at_idx" ON "doctor_branches"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_branches_tenant_id_doctor_id_branch_id_key" ON "doctor_branches"("tenant_id", "doctor_id", "branch_id");

-- CreateIndex
CREATE INDEX "doctor_department_mappings_tenant_id_idx" ON "doctor_department_mappings"("tenant_id");

-- CreateIndex
CREATE INDEX "doctor_department_mappings_doctor_id_idx" ON "doctor_department_mappings"("doctor_id");

-- CreateIndex
CREATE INDEX "doctor_department_mappings_department_id_idx" ON "doctor_department_mappings"("department_id");

-- CreateIndex
CREATE INDEX "doctor_department_mappings_created_at_idx" ON "doctor_department_mappings"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_department_mappings_tenant_id_doctor_id_department_i_key" ON "doctor_department_mappings"("tenant_id", "doctor_id", "department_id");

-- CreateIndex
CREATE INDEX "report_doctor_assignments_tenant_id_idx" ON "report_doctor_assignments"("tenant_id");

-- CreateIndex
CREATE INDEX "report_doctor_assignments_branch_id_idx" ON "report_doctor_assignments"("branch_id");

-- CreateIndex
CREATE INDEX "report_doctor_assignments_tenant_id_is_active_idx" ON "report_doctor_assignments"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "report_doctor_assignments_tenant_service_id_idx" ON "report_doctor_assignments"("tenant_service_id");

-- CreateIndex
CREATE INDEX "report_doctor_assignments_department_id_idx" ON "report_doctor_assignments"("department_id");

-- CreateIndex
CREATE INDEX "report_doctor_assignments_created_at_idx" ON "report_doctor_assignments"("created_at");

-- CreateIndex
CREATE INDEX "report_signature_templates_tenant_id_idx" ON "report_signature_templates"("tenant_id");

-- CreateIndex
CREATE INDEX "report_signature_templates_branch_id_idx" ON "report_signature_templates"("branch_id");

-- CreateIndex
CREATE INDEX "report_signature_templates_tenant_id_is_active_idx" ON "report_signature_templates"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "report_signature_templates_department_id_idx" ON "report_signature_templates"("department_id");

-- CreateIndex
CREATE INDEX "report_signature_templates_doctor_id_idx" ON "report_signature_templates"("doctor_id");

-- CreateIndex
CREATE INDEX "report_signature_templates_created_at_idx" ON "report_signature_templates"("created_at");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_services" ADD CONSTRAINT "host_services_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_services" ADD CONSTRAINT "host_services_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_services" ADD CONSTRAINT "tenant_services_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_services" ADD CONSTRAINT "tenant_services_host_service_id_fkey" FOREIGN KEY ("host_service_id") REFERENCES "host_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_services" ADD CONSTRAINT "tenant_services_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_services" ADD CONSTRAINT "tenant_services_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_services" ADD CONSTRAINT "tenant_services_sample_type_id_fkey" FOREIGN KEY ("sample_type_id") REFERENCES "sample_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_services" ADD CONSTRAINT "tenant_services_sample_container_id_fkey" FOREIGN KEY ("sample_container_id") REFERENCES "sample_containers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_services" ADD CONSTRAINT "tenant_services_test_method_id_fkey" FOREIGN KEY ("test_method_id") REFERENCES "test_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_services" ADD CONSTRAINT "tenant_services_reporting_method_id_fkey" FOREIGN KEY ("reporting_method_id") REFERENCES "reporting_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_services" ADD CONSTRAINT "tenant_services_analyzer_id_fkey" FOREIGN KEY ("analyzer_id") REFERENCES "analyzers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_parameters" ADD CONSTRAINT "service_parameters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_parameters" ADD CONSTRAINT "service_parameters_tenant_service_id_fkey" FOREIGN KEY ("tenant_service_id") REFERENCES "tenant_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_parameter_reference_ranges" ADD CONSTRAINT "service_parameter_reference_ranges_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_parameter_reference_ranges" ADD CONSTRAINT "service_parameter_reference_ranges_service_parameter_id_fkey" FOREIGN KEY ("service_parameter_id") REFERENCES "service_parameters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_types" ADD CONSTRAINT "sample_types_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_containers" ADD CONSTRAINT "sample_containers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_containers" ADD CONSTRAINT "sample_containers_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_methods" ADD CONSTRAINT "test_methods_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_methods" ADD CONSTRAINT "test_methods_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_methods" ADD CONSTRAINT "test_methods_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_methods" ADD CONSTRAINT "reporting_methods_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyzers" ADD CONSTRAINT "analyzers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyzers" ADD CONSTRAINT "analyzers_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyzers" ADD CONSTRAINT "analyzers_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_branches" ADD CONSTRAINT "doctor_branches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_branches" ADD CONSTRAINT "doctor_branches_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_branches" ADD CONSTRAINT "doctor_branches_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_department_mappings" ADD CONSTRAINT "doctor_department_mappings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_department_mappings" ADD CONSTRAINT "doctor_department_mappings_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_department_mappings" ADD CONSTRAINT "doctor_department_mappings_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_doctor_assignments" ADD CONSTRAINT "report_doctor_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_doctor_assignments" ADD CONSTRAINT "report_doctor_assignments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_doctor_assignments" ADD CONSTRAINT "report_doctor_assignments_tenant_service_id_fkey" FOREIGN KEY ("tenant_service_id") REFERENCES "tenant_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_doctor_assignments" ADD CONSTRAINT "report_doctor_assignments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_doctor_assignments" ADD CONSTRAINT "report_doctor_assignments_reporting_doctor_id_fkey" FOREIGN KEY ("reporting_doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_doctor_assignments" ADD CONSTRAINT "report_doctor_assignments_verifying_doctor_id_fkey" FOREIGN KEY ("verifying_doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_doctor_assignments" ADD CONSTRAINT "report_doctor_assignments_consultant_doctor_id_fkey" FOREIGN KEY ("consultant_doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_signature_templates" ADD CONSTRAINT "report_signature_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_signature_templates" ADD CONSTRAINT "report_signature_templates_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_signature_templates" ADD CONSTRAINT "report_signature_templates_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_signature_templates" ADD CONSTRAINT "report_signature_templates_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
