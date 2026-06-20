/*
  Warnings:

  - You are about to drop the column `code` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `tenants` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenant_code]` on the table `tenants` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contact_email` to the `tenants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contact_mobile` to the `tenants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contact_person` to the `tenants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_code` to the `tenants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_name` to the `tenants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_type` to the `tenants` table without a default value. This is not possible if the table is not empty.
  - Made the column `country` on table `tenants` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TenantType" AS ENUM ('DIAGNOSTIC', 'HOSPITAL', 'CLINIC', 'PHARMACY', 'MIXED');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('DRAFT', 'SETUP_PENDING', 'ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'DUE', 'GRACE_PERIOD', 'SUSPENDED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ModuleStatus" AS ENUM ('ACTIVE', 'DISABLED', 'TRIAL', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AuditActionType" AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'PRINT', 'RELEASE');

-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('TRIAL', 'STARTER', 'STANDARD', 'PROFESSIONAL', 'ENTERPRISE');

-- DropIndex
DROP INDEX "tenants_code_key";

-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "city" TEXT,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updated_by" TEXT;

-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "code",
DROP COLUMN "name",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "contact_email" TEXT NOT NULL,
ADD COLUMN     "contact_mobile" TEXT NOT NULL,
ADD COLUMN     "contact_person" TEXT NOT NULL,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "default_language" TEXT NOT NULL DEFAULT 'EN',
ADD COLUMN     "district" TEXT,
ADD COLUMN     "legal_name" TEXT,
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "onboarding_status" "OnboardingStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "report_footer_text" TEXT,
ADD COLUMN     "report_header_logo_url" TEXT,
ADD COLUMN     "tax_bin_no" TEXT,
ADD COLUMN     "tenant_code" TEXT NOT NULL,
ADD COLUMN     "tenant_name" TEXT NOT NULL,
ADD COLUMN     "tenant_status" "TenantStatus" NOT NULL DEFAULT 'TRIAL',
ADD COLUMN     "tenant_type" "TenantType" NOT NULL,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka',
ADD COLUMN     "trade_license_no" TEXT,
ADD COLUMN     "updated_by" TEXT,
ALTER COLUMN "country" SET NOT NULL,
ALTER COLUMN "country" SET DEFAULT 'Bangladesh';

-- CreateTable
CREATE TABLE "subscription_packages" (
    "id" TEXT NOT NULL,
    "package_code" TEXT NOT NULL,
    "package_name" TEXT NOT NULL,
    "package_type" "PackageType" NOT NULL,
    "billing_cycle" "BillingCycle" NOT NULL,
    "monthly_fee" DECIMAL(18,2) NOT NULL,
    "yearly_fee" DECIMAL(18,2) NOT NULL,
    "included_branches" INTEGER NOT NULL,
    "included_users" INTEGER NOT NULL,
    "included_patients_per_month" INTEGER NOT NULL,
    "included_orders_per_month" INTEGER NOT NULL,
    "included_storage_gb" INTEGER NOT NULL,
    "support_level" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "subscription_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_subscriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "subscription_start" TIMESTAMP(3) NOT NULL,
    "subscription_end" TIMESTAMP(3) NOT NULL,
    "billing_cycle" "BillingCycle" NOT NULL,
    "subscription_status" "SubscriptionStatus" NOT NULL,
    "next_billing_date" TIMESTAMP(3),
    "grace_period_days" INTEGER NOT NULL DEFAULT 7,
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "tenant_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_registry" (
    "id" TEXT NOT NULL,
    "module_code" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,
    "module_group" TEXT NOT NULL,
    "description" TEXT,
    "is_core" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "module_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_modules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "enabled_from" TIMESTAMP(3) NOT NULL,
    "enabled_to" TIMESTAMP(3),
    "enabled_by" TEXT,
    "module_status" "ModuleStatus" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "tenant_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_usage_limits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "max_branches" INTEGER NOT NULL,
    "max_users" INTEGER NOT NULL,
    "max_patients_per_month" INTEGER NOT NULL,
    "max_orders_per_month" INTEGER NOT NULL,
    "max_reports_per_month" INTEGER NOT NULL,
    "max_storage_gb" INTEGER NOT NULL,
    "max_sms_per_month" INTEGER NOT NULL,
    "max_whatsapp_per_month" INTEGER NOT NULL,
    "max_api_calls_per_month" INTEGER NOT NULL,
    "allow_custom_domain" BOOLEAN NOT NULL DEFAULT false,
    "allow_api_access" BOOLEAN NOT NULL DEFAULT false,
    "allow_patient_portal" BOOLEAN NOT NULL DEFAULT false,
    "allow_multi_branch" BOOLEAN NOT NULL DEFAULT false,
    "allow_report_branding" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "tenant_usage_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "user_status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_host_admin" BOOLEAN NOT NULL DEFAULT false,
    "force_password_change" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "role_name" TEXT NOT NULL,
    "role_code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "role_id" TEXT NOT NULL,
    "permission_code" TEXT NOT NULL,
    "module_code" TEXT NOT NULL,
    "resource_key" TEXT NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT false,
    "can_create" BOOLEAN NOT NULL DEFAULT false,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "can_approve" BOOLEAN NOT NULL DEFAULT false,
    "can_print" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "branch_id" TEXT,
    "user_id" TEXT,
    "action_type" "AuditActionType" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "change_data" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_histories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "old_status" TEXT NOT NULL,
    "new_status" TEXT NOT NULL,
    "remarks" TEXT,
    "changed_by" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "status_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_packages_package_code_key" ON "subscription_packages"("package_code");

-- CreateIndex
CREATE INDEX "subscription_packages_created_at_idx" ON "subscription_packages"("created_at");

-- CreateIndex
CREATE INDEX "tenant_subscriptions_tenant_id_idx" ON "tenant_subscriptions"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_subscriptions_tenant_id_is_active_idx" ON "tenant_subscriptions"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "tenant_subscriptions_tenant_id_subscription_status_idx" ON "tenant_subscriptions"("tenant_id", "subscription_status");

-- CreateIndex
CREATE INDEX "tenant_subscriptions_subscription_status_idx" ON "tenant_subscriptions"("subscription_status");

-- CreateIndex
CREATE INDEX "tenant_subscriptions_created_at_idx" ON "tenant_subscriptions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "module_registry_module_code_key" ON "module_registry"("module_code");

-- CreateIndex
CREATE INDEX "module_registry_module_code_idx" ON "module_registry"("module_code");

-- CreateIndex
CREATE INDEX "module_registry_created_at_idx" ON "module_registry"("created_at");

-- CreateIndex
CREATE INDEX "tenant_modules_tenant_id_idx" ON "tenant_modules"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_modules_tenant_id_is_active_idx" ON "tenant_modules"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "tenant_modules_module_status_idx" ON "tenant_modules"("module_status");

-- CreateIndex
CREATE INDEX "tenant_modules_created_at_idx" ON "tenant_modules"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_modules_tenant_id_module_id_key" ON "tenant_modules"("tenant_id", "module_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_usage_limits_tenant_id_key" ON "tenant_usage_limits"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_usage_limits_created_at_idx" ON "tenant_usage_limits"("created_at");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "users_tenant_id_is_active_idx" ON "users"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "users_user_status_idx" ON "users"("user_status");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "roles_tenant_id_idx" ON "roles"("tenant_id");

-- CreateIndex
CREATE INDEX "roles_tenant_id_is_active_idx" ON "roles"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "roles_created_at_idx" ON "roles"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenant_id_role_code_key" ON "roles"("tenant_id", "role_code");

-- CreateIndex
CREATE INDEX "user_roles_tenant_id_idx" ON "user_roles"("tenant_id");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "user_roles_created_at_idx" ON "user_roles"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "permissions_tenant_id_idx" ON "permissions"("tenant_id");

-- CreateIndex
CREATE INDEX "permissions_tenant_id_is_active_idx" ON "permissions"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "permissions_module_code_idx" ON "permissions"("module_code");

-- CreateIndex
CREATE INDEX "permissions_permission_code_idx" ON "permissions"("permission_code");

-- CreateIndex
CREATE INDEX "permissions_created_at_idx" ON "permissions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_role_id_resource_key_key" ON "permissions"("role_id", "resource_key");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_branch_id_idx" ON "audit_logs"("branch_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "status_histories_tenant_id_idx" ON "status_histories"("tenant_id");

-- CreateIndex
CREATE INDEX "status_histories_branch_id_idx" ON "status_histories"("branch_id");

-- CreateIndex
CREATE INDEX "status_histories_tenant_id_entity_type_entity_id_idx" ON "status_histories"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "status_histories_changed_at_idx" ON "status_histories"("changed_at");

-- CreateIndex
CREATE INDEX "status_histories_created_at_idx" ON "status_histories"("created_at");

-- CreateIndex
CREATE INDEX "branches_tenant_id_idx" ON "branches"("tenant_id");

-- CreateIndex
CREATE INDEX "branches_tenant_id_is_active_idx" ON "branches"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "branches_status_idx" ON "branches"("status");

-- CreateIndex
CREATE INDEX "branches_created_at_idx" ON "branches"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_tenant_code_key" ON "tenants"("tenant_code");

-- CreateIndex
CREATE INDEX "tenants_tenant_status_idx" ON "tenants"("tenant_status");

-- CreateIndex
CREATE INDEX "tenants_created_at_idx" ON "tenants"("created_at");

-- AddForeignKey
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "subscription_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_modules" ADD CONSTRAINT "tenant_modules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_modules" ADD CONSTRAINT "tenant_modules_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "module_registry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_usage_limits" ADD CONSTRAINT "tenant_usage_limits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_histories" ADD CONSTRAINT "status_histories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_histories" ADD CONSTRAINT "status_histories_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
