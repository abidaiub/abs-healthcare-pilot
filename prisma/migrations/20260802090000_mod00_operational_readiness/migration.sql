-- MOD-00 Tenant Go-Live Wizard & Operational Readiness Engine

ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "website" TEXT,
  ADD COLUMN IF NOT EXISTS "invoice_footer_text" TEXT,
  ADD COLUMN IF NOT EXISTS "header_branding_text" TEXT,
  ADD COLUMN IF NOT EXISTS "footer_branding_text" TEXT,
  ADD COLUMN IF NOT EXISTS "barcode_prefix" TEXT,
  ADD COLUMN IF NOT EXISTS "ready_for_first_patient_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "ready_for_first_patient_by_id" TEXT;

ALTER TABLE "analyzers"
  ADD COLUMN IF NOT EXISTS "lis_endpoint" TEXT,
  ADD COLUMN IF NOT EXISTS "lis_connection_status" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
  ADD COLUMN IF NOT EXISTS "lis_last_communication_at" TIMESTAMP(3);

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "department_id" TEXT;

CREATE INDEX IF NOT EXISTS "users_department_id_idx" ON "users"("department_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_department_id_fkey'
  ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_department_id_fkey"
      FOREIGN KEY ("department_id") REFERENCES "departments"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "tenant_portal_settings" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "portal_enabled" BOOLEAN NOT NULL DEFAULT true,
  "self_registration" BOOLEAN NOT NULL DEFAULT false,
  "download_pdf_enabled" BOOLEAN NOT NULL DEFAULT true,
  "qr_verification_enabled" BOOLEAN NOT NULL DEFAULT true,
  "notification_enabled" BOOLEAN NOT NULL DEFAULT true,
  "password_min_length" INTEGER NOT NULL DEFAULT 8,
  "password_require_mixed" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "updated_by" TEXT,
  CONSTRAINT "tenant_portal_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_portal_settings_tenant_id_key"
  ON "tenant_portal_settings"("tenant_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_portal_settings_tenant_id_fkey'
  ) THEN
    ALTER TABLE "tenant_portal_settings"
      ADD CONSTRAINT "tenant_portal_settings_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "operational_readiness_snapshots" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "branch_id" TEXT,
  "score_percent" INTEGER NOT NULL,
  "ready_status" TEXT NOT NULL,
  "checklist_json" JSONB NOT NULL,
  "software_version" TEXT NOT NULL,
  "declared_ready" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by_id" TEXT,
  "created_by_name" TEXT,
  CONSTRAINT "operational_readiness_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "operational_readiness_snapshots_tenant_id_created_at_idx"
  ON "operational_readiness_snapshots"("tenant_id", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'operational_readiness_snapshots_tenant_id_fkey'
  ) THEN
    ALTER TABLE "operational_readiness_snapshots"
      ADD CONSTRAINT "operational_readiness_snapshots_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
