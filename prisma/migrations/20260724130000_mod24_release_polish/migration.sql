-- MOD-24 production polish: release policy, holds, clinical state separation
--
-- Dependency note (ordering repair):
-- This migration is timestamped BEFORE MOD-21/22/23/24 create migrations.
-- On fresh databases, lab_report_releases / lab_results do not exist yet.
-- Tenant policy columns are always safe here; release-table polish and the
-- clinical-state cleanup are applied only when prerequisites already exist,
-- and are guaranteed by 20260724261000_mod24_release_polish_deferred.

ALTER TABLE "tenants"
ADD COLUMN IF NOT EXISTS "lab_report_release_enforce_billing_clearance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "lab_report_release_enforce_quality_clearance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "lab_report_release_enforce_critical_ack" BOOLEAN NOT NULL DEFAULT false;

-- Optional early apply when tables already exist (e.g. restored schema / out-of-band create).
-- No-ops on fresh installs until after 20260724260000_mod24_report_release.
DO $$
BEGIN
  IF to_regclass(format('%I.%I', current_schema(), 'lab_report_releases')) IS NOT NULL THEN
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
  END IF;
END $$;

-- Clinical verification state remains VERIFIED; release state lives on lab_report_releases.
-- Requires lab_results (MOD-22) and RELEASE_* enum labels (MOD-24 create migration).
DO $$
BEGIN
  IF to_regclass(format('%I.%I', current_schema(), 'lab_results')) IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_enum e
       JOIN pg_type t ON t.oid = e.enumtypid
       JOIN pg_namespace n ON n.oid = t.typnamespace
       WHERE n.nspname = current_schema()
         AND t.typname = 'LabResultStatus'
         AND e.enumlabel = 'RELEASE_PENDING'
     )
     AND EXISTS (
       SELECT 1
       FROM pg_enum e
       JOIN pg_type t ON t.oid = e.enumtypid
       JOIN pg_namespace n ON n.oid = t.typnamespace
       WHERE n.nspname = current_schema()
         AND t.typname = 'LabResultStatus'
         AND e.enumlabel = 'RELEASED'
     )
  THEN
    UPDATE "lab_results"
    SET "status" = 'VERIFIED'
    WHERE "status"::text IN ('RELEASE_PENDING', 'RELEASED');
  END IF;
END $$;
