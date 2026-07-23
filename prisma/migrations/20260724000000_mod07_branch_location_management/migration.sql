-- MOD-07 Branch / Location Management foundation

CREATE TYPE "BranchType" AS ENUM (
  'HEAD_OFFICE',
  'HOSPITAL',
  'CLINIC',
  'DIAGNOSTIC_CENTER',
  'COLLECTION_CENTER',
  'PHARMACY',
  'CORPORATE_OFFICE',
  'OTHER'
);

ALTER TABLE "branches"
  ADD COLUMN "branch_type" "BranchType" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "address_line1" TEXT,
  ADD COLUMN "address_line2" TEXT,
  ADD COLUMN "postal_code" TEXT,
  ADD COLUMN "country_code" TEXT,
  ADD COLUMN "timezone" TEXT,
  ADD COLUMN "opening_time" TEXT,
  ADD COLUMN "closing_time" TEXT,
  ADD COLUMN "is_default" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "notes" TEXT;

UPDATE "branches"
SET "address_line1" = "address"
WHERE "address" IS NOT NULL AND "address_line1" IS NULL;

CREATE INDEX "branches_tenant_id_is_default_idx" ON "branches"("tenant_id", "is_default");

CREATE UNIQUE INDEX "branches_one_default_per_tenant" ON "branches"("tenant_id")
WHERE "is_default" = true;
