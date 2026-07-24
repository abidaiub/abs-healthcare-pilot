-- MOD-24 production polish: release policy, holds, clinical state separation
ALTER TABLE "tenants"
ADD COLUMN IF NOT EXISTS "lab_report_release_enforce_billing_clearance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "lab_report_release_enforce_quality_clearance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "lab_report_release_enforce_critical_ack" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "lab_report_releases"
ADD COLUMN IF NOT EXISTS "state_version" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "billing_hold_active" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "billing_hold_reason" TEXT,
ADD COLUMN IF NOT EXISTS "billing_hold_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "billing_hold_by_id" TEXT,
ADD COLUMN IF NOT EXISTS "billing_hold_cleared_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "billing_hold_cleared_by_id" TEXT,
ADD COLUMN IF NOT EXISTS "billing_hold_clear_reason" TEXT,
ADD COLUMN IF NOT EXISTS "quality_hold_active" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "quality_hold_reason" TEXT,
ADD COLUMN IF NOT EXISTS "quality_hold_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "quality_hold_by_id" TEXT,
ADD COLUMN IF NOT EXISTS "quality_hold_cleared_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "quality_hold_cleared_by_id" TEXT,
ADD COLUMN IF NOT EXISTS "quality_hold_clear_reason" TEXT;

-- Clinical verification state remains VERIFIED; release state lives on lab_report_releases
UPDATE "lab_results"
SET "status" = 'VERIFIED'
WHERE "status" IN ('RELEASE_PENDING', 'RELEASED');
