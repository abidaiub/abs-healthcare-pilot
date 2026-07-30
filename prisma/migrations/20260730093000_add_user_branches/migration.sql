-- UserBranch / user_branches forward-only repair
--
-- Root cause: model UserBranch was added in commit 1eb7dd8 (MOD-02/03 IAM foundation)
-- without a committed migration. Runtime, seed, and branch-resolution code depend on
-- public.user_branches, but origin/main migration history never created it.
--
-- Strategy B (catalog-aware reconciliation):
--   - create the exact Prisma table when absent (fresh databases);
--   - when a compatible table already exists (e.g. created via db push during AI-QC),
--     validate structure/data and add only missing compatible indexes/constraints;
--   - fail clearly on incompatible columns, duplicate assignments, or orphan rows.
--
-- Depends on: tenants, users, branches (layer1_saas_foundation and earlier).

DO $$
DECLARE
  tbl regclass;
  missing text;
BEGIN
  tbl := to_regclass(format('%I.%I', current_schema(), 'user_branches'));

  IF tbl IS NULL THEN
    CREATE TABLE "user_branches" (
      "id" TEXT NOT NULL,
      "tenant_id" TEXT NOT NULL,
      "user_id" TEXT NOT NULL,
      "branch_id" TEXT NOT NULL,
      "is_primary" BOOLEAN NOT NULL DEFAULT false,
      "is_active" BOOLEAN NOT NULL DEFAULT true,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "created_by" TEXT,
      "updated_at" TIMESTAMP(3) NOT NULL,
      "updated_by" TEXT,
      CONSTRAINT "user_branches_pkey" PRIMARY KEY ("id")
    );
  ELSE
    SELECT string_agg(required.column_name, ', ' ORDER BY required.column_name)
      INTO missing
    FROM (
      VALUES
        ('id'),
        ('tenant_id'),
        ('user_id'),
        ('branch_id'),
        ('is_primary'),
        ('is_active'),
        ('created_at'),
        ('created_by'),
        ('updated_at'),
        ('updated_by')
    ) AS required(column_name)
    LEFT JOIN information_schema.columns existing
      ON existing.table_schema = current_schema()
     AND existing.table_name = 'user_branches'
     AND existing.column_name = required.column_name
    WHERE existing.column_name IS NULL;

    IF missing IS NOT NULL THEN
      RAISE EXCEPTION 'user_branches exists but is missing required column(s): %', missing;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'user_branches'
        AND column_name IN ('id', 'tenant_id', 'user_id', 'branch_id', 'created_by', 'updated_by')
        AND data_type <> 'text'
    ) THEN
      RAISE EXCEPTION 'user_branches has incompatible TEXT column type(s)';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'user_branches'
        AND column_name IN ('is_primary', 'is_active')
        AND udt_name <> 'bool'
    ) THEN
      RAISE EXCEPTION 'user_branches has incompatible BOOLEAN column type(s)';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'user_branches'
        AND column_name IN ('created_at', 'updated_at')
        AND data_type NOT IN ('timestamp without time zone', 'timestamp with time zone')
    ) THEN
      RAISE EXCEPTION 'user_branches has incompatible timestamp column type(s)';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'user_branches'
        AND column_name IN ('tenant_id', 'user_id', 'branch_id', 'is_primary', 'is_active', 'created_at', 'updated_at')
        AND is_nullable = 'YES'
    ) THEN
      RAISE EXCEPTION 'user_branches has nullable column(s) that must be NOT NULL';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT user_id, branch_id
    FROM "user_branches"
    GROUP BY user_id, branch_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'user_branches has duplicate (user_id, branch_id) assignment rows';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "user_branches" ub
    LEFT JOIN "tenants" t ON t."id" = ub."tenant_id"
    WHERE t."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'user_branches has orphan tenant_id references';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "user_branches" ub
    LEFT JOIN "users" u ON u."id" = ub."user_id"
    WHERE u."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'user_branches has orphan user_id references';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "user_branches" ub
    LEFT JOIN "branches" b ON b."id" = ub."branch_id"
    WHERE b."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'user_branches has orphan branch_id references';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "user_branches" ub
    JOIN "users" u ON u."id" = ub."user_id"
    WHERE ub."tenant_id" <> u."tenant_id"
  ) THEN
    RAISE EXCEPTION 'user_branches has tenant_id values that do not match users.tenant_id';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "user_branches" ub
    JOIN "branches" b ON b."id" = ub."branch_id"
    WHERE ub."tenant_id" <> b."tenant_id"
  ) THEN
    RAISE EXCEPTION 'user_branches has tenant_id values that do not match branches.tenant_id';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "user_branches_tenant_id_idx"
  ON "user_branches"("tenant_id");

CREATE INDEX IF NOT EXISTS "user_branches_user_id_idx"
  ON "user_branches"("user_id");

CREATE INDEX IF NOT EXISTS "user_branches_branch_id_idx"
  ON "user_branches"("branch_id");

CREATE INDEX IF NOT EXISTS "user_branches_tenant_id_is_active_idx"
  ON "user_branches"("tenant_id", "is_active");

CREATE UNIQUE INDEX IF NOT EXISTS "user_branches_user_id_branch_id_key"
  ON "user_branches"("user_id", "branch_id");

DO $$
BEGIN
  IF to_regclass(format('%I.%I', current_schema(), 'tenants')) IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'user_branches_tenant_id_fkey'
     ) THEN
    ALTER TABLE "user_branches"
      ADD CONSTRAINT "user_branches_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF to_regclass(format('%I.%I', current_schema(), 'users')) IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'user_branches_user_id_fkey'
     ) THEN
    ALTER TABLE "user_branches"
      ADD CONSTRAINT "user_branches_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF to_regclass(format('%I.%I', current_schema(), 'branches')) IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'user_branches_branch_id_fkey'
     ) THEN
    ALTER TABLE "user_branches"
      ADD CONSTRAINT "user_branches_branch_id_fkey"
      FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
