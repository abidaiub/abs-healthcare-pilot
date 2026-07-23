-- MOD-01A: tenant locale and regional profile foundation

ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "country_code" TEXT NOT NULL DEFAULT 'BD',
  ADD COLUMN IF NOT EXISTS "default_locale" TEXT NOT NULL DEFAULT 'en-BD',
  ADD COLUMN IF NOT EXISTS "supported_locales" JSONB NOT NULL DEFAULT '["bn-BD","en-BD"]',
  ADD COLUMN IF NOT EXISTS "currency_code" TEXT NOT NULL DEFAULT 'BDT',
  ADD COLUMN IF NOT EXISTS "date_format" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  ADD COLUMN IF NOT EXISTS "number_format" TEXT NOT NULL DEFAULT 'en-IN',
  ADD COLUMN IF NOT EXISTS "text_direction" TEXT NOT NULL DEFAULT 'ltr';
