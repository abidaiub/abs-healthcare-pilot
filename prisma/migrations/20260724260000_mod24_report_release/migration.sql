-- MOD-24 Report Release & Delivery

-- Extend lab result lifecycle for release
ALTER TYPE "LabResultStatus" ADD VALUE IF NOT EXISTS 'RELEASE_PENDING';
ALTER TYPE "LabResultStatus" ADD VALUE IF NOT EXISTS 'RELEASED';

CREATE TYPE "LabReportReleaseStatus" AS ENUM ('RELEASE_PENDING', 'RELEASED', 'WITHDRAWN', 'AMENDED');
CREATE TYPE "LabReportVersionStatus" AS ENUM ('DRAFT', 'RELEASED', 'SUPERSEDED', 'WITHDRAWN');
CREATE TYPE "LabReportDeliveryMethod" AS ENUM ('COUNTER', 'PORTAL', 'EMAIL', 'WHATSAPP', 'DOCTOR_PORTAL', 'DOWNLOAD', 'PRINT');
CREATE TYPE "LabReportAccessMethod" AS ENUM ('PORTAL_VIEW', 'PDF_DOWNLOAD', 'PRINT', 'QR_VERIFY', 'COUNTER');

CREATE TABLE "tenant_lab_report_counters" (
    "tenant_id" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "tenant_lab_report_counters_pkey" PRIMARY KEY ("tenant_id")
);

CREATE TABLE "lab_report_releases" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "lab_result_id" TEXT NOT NULL,
    "report_number" TEXT NOT NULL,
    "status" "LabReportReleaseStatus" NOT NULL DEFAULT 'RELEASE_PENDING',
    "result_version_snapshot" INTEGER NOT NULL,
    "current_version_id" TEXT,
    "portal_publish_eligible" BOOLEAN NOT NULL DEFAULT false,
    "portal_published_at" TIMESTAMP(3),
    "portal_published_by_id" TEXT,
    "released_by_id" TEXT,
    "released_at" TIMESTAMP(3),
    "withdrawn_by_id" TEXT,
    "withdrawn_at" TIMESTAMP(3),
    "withdrawal_reason" TEXT,
    "print_count" INTEGER NOT NULL DEFAULT 0,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" TEXT,
    CONSTRAINT "lab_report_releases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lab_report_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "release_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" "LabReportVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "snapshot_json" TEXT NOT NULL,
    "amendment_reason" TEXT,
    "amended_from_id" TEXT,
    "released_by_id" TEXT,
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lab_report_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lab_report_deliveries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "release_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "delivery_method" "LabReportDeliveryMethod" NOT NULL,
    "delivered_to" TEXT NOT NULL,
    "delivered_by_id" TEXT,
    "delivered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lab_report_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lab_report_access_audits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "release_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "access_method" "LabReportAccessMethod" NOT NULL,
    "accessed_by" TEXT NOT NULL,
    "accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lab_report_access_audits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lab_report_reprint_audits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "release_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "reprinted_by_id" TEXT NOT NULL,
    "reprinted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lab_report_reprint_audits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lab_report_verification_tokens" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "release_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lab_report_verification_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lab_report_releases_lab_result_id_key" ON "lab_report_releases"("lab_result_id");
CREATE UNIQUE INDEX "lab_report_releases_current_version_id_key" ON "lab_report_releases"("current_version_id");
CREATE UNIQUE INDEX "lab_report_releases_tenant_id_report_number_key" ON "lab_report_releases"("tenant_id", "report_number");
CREATE INDEX "lab_report_releases_tenant_id_idx" ON "lab_report_releases"("tenant_id");
CREATE INDEX "lab_report_releases_tenant_id_branch_id_idx" ON "lab_report_releases"("tenant_id", "branch_id");
CREATE INDEX "lab_report_releases_tenant_id_status_idx" ON "lab_report_releases"("tenant_id", "status");
CREATE INDEX "lab_report_releases_tenant_id_report_number_idx" ON "lab_report_releases"("tenant_id", "report_number");
CREATE INDEX "lab_report_releases_tenant_id_released_at_idx" ON "lab_report_releases"("tenant_id", "released_at");

CREATE UNIQUE INDEX "lab_report_versions_release_id_version_number_key" ON "lab_report_versions"("release_id", "version_number");
CREATE INDEX "lab_report_versions_tenant_id_idx" ON "lab_report_versions"("tenant_id");
CREATE INDEX "lab_report_versions_tenant_id_branch_id_idx" ON "lab_report_versions"("tenant_id", "branch_id");
CREATE INDEX "lab_report_versions_tenant_id_release_id_idx" ON "lab_report_versions"("tenant_id", "release_id");
CREATE INDEX "lab_report_versions_tenant_id_status_idx" ON "lab_report_versions"("tenant_id", "status");

CREATE INDEX "lab_report_deliveries_tenant_id_idx" ON "lab_report_deliveries"("tenant_id");
CREATE INDEX "lab_report_deliveries_tenant_id_branch_id_idx" ON "lab_report_deliveries"("tenant_id", "branch_id");
CREATE INDEX "lab_report_deliveries_tenant_id_release_id_idx" ON "lab_report_deliveries"("tenant_id", "release_id");

CREATE INDEX "lab_report_access_audits_tenant_id_idx" ON "lab_report_access_audits"("tenant_id");
CREATE INDEX "lab_report_access_audits_tenant_id_branch_id_idx" ON "lab_report_access_audits"("tenant_id", "branch_id");
CREATE INDEX "lab_report_access_audits_tenant_id_release_id_idx" ON "lab_report_access_audits"("tenant_id", "release_id");
CREATE INDEX "lab_report_access_audits_tenant_id_accessed_at_idx" ON "lab_report_access_audits"("tenant_id", "accessed_at");

CREATE INDEX "lab_report_reprint_audits_tenant_id_idx" ON "lab_report_reprint_audits"("tenant_id");
CREATE INDEX "lab_report_reprint_audits_tenant_id_branch_id_idx" ON "lab_report_reprint_audits"("tenant_id", "branch_id");
CREATE INDEX "lab_report_reprint_audits_tenant_id_release_id_idx" ON "lab_report_reprint_audits"("tenant_id", "release_id");

CREATE UNIQUE INDEX "lab_report_verification_tokens_token_key" ON "lab_report_verification_tokens"("token");
CREATE INDEX "lab_report_verification_tokens_tenant_id_idx" ON "lab_report_verification_tokens"("tenant_id");
CREATE INDEX "lab_report_verification_tokens_tenant_id_branch_id_idx" ON "lab_report_verification_tokens"("tenant_id", "branch_id");
CREATE INDEX "lab_report_verification_tokens_tenant_id_release_id_idx" ON "lab_report_verification_tokens"("tenant_id", "release_id");

ALTER TABLE "tenant_lab_report_counters" ADD CONSTRAINT "tenant_lab_report_counters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lab_report_releases" ADD CONSTRAINT "lab_report_releases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_report_releases" ADD CONSTRAINT "lab_report_releases_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_report_releases" ADD CONSTRAINT "lab_report_releases_lab_result_id_fkey" FOREIGN KEY ("lab_result_id") REFERENCES "lab_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_report_releases" ADD CONSTRAINT "lab_report_releases_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "lab_report_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lab_report_versions" ADD CONSTRAINT "lab_report_versions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_report_versions" ADD CONSTRAINT "lab_report_versions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_report_versions" ADD CONSTRAINT "lab_report_versions_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "lab_report_releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_report_versions" ADD CONSTRAINT "lab_report_versions_amended_from_id_fkey" FOREIGN KEY ("amended_from_id") REFERENCES "lab_report_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lab_report_deliveries" ADD CONSTRAINT "lab_report_deliveries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_report_deliveries" ADD CONSTRAINT "lab_report_deliveries_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_report_deliveries" ADD CONSTRAINT "lab_report_deliveries_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "lab_report_releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lab_report_access_audits" ADD CONSTRAINT "lab_report_access_audits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_report_access_audits" ADD CONSTRAINT "lab_report_access_audits_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_report_access_audits" ADD CONSTRAINT "lab_report_access_audits_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "lab_report_releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lab_report_reprint_audits" ADD CONSTRAINT "lab_report_reprint_audits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_report_reprint_audits" ADD CONSTRAINT "lab_report_reprint_audits_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_report_reprint_audits" ADD CONSTRAINT "lab_report_reprint_audits_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "lab_report_releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lab_report_verification_tokens" ADD CONSTRAINT "lab_report_verification_tokens_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_report_verification_tokens" ADD CONSTRAINT "lab_report_verification_tokens_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_report_verification_tokens" ADD CONSTRAINT "lab_report_verification_tokens_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "lab_report_releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_report_verification_tokens" ADD CONSTRAINT "lab_report_verification_tokens_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "lab_report_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
