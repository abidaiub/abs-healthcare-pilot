ALTER TABLE tenant_tests
  ALTER COLUMN price DROP NOT NULL;

ALTER TABLE tenant_tests
  ADD CONSTRAINT tenant_tests_active_price_required CHECK (NOT is_active OR price IS NOT NULL);

COMMENT ON COLUMN tenant_tests.price IS 'Tenant-owned BDT price. NULL means unconfigured and is permitted only while the test is disabled.';
