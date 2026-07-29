-- MOD-24 release polish deferred apply
--
-- Guarantees polish columns / clinical-state cleanup after:
--   20260724240000_mod22_laboratory_result_entry  (lab_results)
--   20260724260000_mod24_report_release           (lab_report_releases + RELEASE_* enums)
--
-- Idempotent for environments where 20260724130000_mod24_release_polish already
-- applied these changes because the tables existed at that earlier timestamp.

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

-- Clinical verification state remains VERIFIED; release state lives on lab_report_releases.
UPDATE "lab_results"
SET "status" = 'VERIFIED'
WHERE "status"::text IN ('RELEASE_PENDING', 'RELEASED');
