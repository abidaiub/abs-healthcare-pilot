CREATE TABLE catalog_releases (
  release_code text PRIMARY KEY,
  source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[0-9a-f]{64}$'),
  source_created_on date NOT NULL,
  source_status text NOT NULL,
  clinical_validation_status text NOT NULL,
  starter_count integer NOT NULL CHECK (starter_count >= 0),
  medium_count integer NOT NULL CHECK (medium_count >= starter_count),
  advanced_count integer NOT NULL CHECK (advanced_count >= medium_count),
  field_count integer NOT NULL CHECK (field_count >= 0),
  imported_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE catalog_templates
  ADD COLUMN release_code text REFERENCES catalog_releases(release_code) ON DELETE RESTRICT,
  ADD COLUMN min_tier text CHECK (min_tier IS NULL OR min_tier IN ('STARTER','MEDIUM','ADVANCED')),
  ADD COLUMN tier_level integer CHECK (tier_level IS NULL OR tier_level BETWEEN 1 AND 3),
  ADD COLUMN workflow text,
  ADD COLUMN template_key text,
  ADD COLUMN source_id text,
  ADD COLUMN notes text,
  ADD COLUMN tenant_default_active boolean NOT NULL DEFAULT true;

ALTER TABLE catalog_template_fields
  ADD COLUMN repeat_group text,
  ADD COLUMN is_active boolean NOT NULL DEFAULT true;

ALTER TABLE tenant_result_fields
  ADD COLUMN repeat_group text;

CREATE INDEX catalog_templates_release_tier_idx
  ON catalog_templates(release_code, tier_level, code);

COMMENT ON TABLE catalog_releases IS 'Versioned provenance and structural counts for global master-catalog releases.';
COMMENT ON COLUMN catalog_templates.tenant_default_active IS 'Controls only the first tenant installation. Draft master data is installed disabled for local clinical configuration.';
COMMENT ON COLUMN catalog_template_fields.repeat_group IS 'Optional structural group key; does not contain patient findings.';
