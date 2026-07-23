-- MOD-06: user-level locale preference

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "preferred_locale" TEXT;
