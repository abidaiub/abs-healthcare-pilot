CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  legal_name text,
  logo_url text,
  address text,
  phone text,
  email text,
  timezone text NOT NULL DEFAULT 'Asia/Dhaka',
  currency_code char(3) NOT NULL DEFAULT 'BDT',
  business_day_cutoff time NOT NULL DEFAULT '00:00',
  receipt_footer text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, code)
);

CREATE TABLE branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  address text,
  phone text,
  timezone text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code),
  UNIQUE (tenant_id, id)
);

CREATE UNIQUE INDEX branches_one_default_per_tenant
  ON branches(tenant_id) WHERE is_default;

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  is_system boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code),
  UNIQUE (tenant_id, id)
);

CREATE TABLE role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_id uuid NOT NULL,
  resource text NOT NULL,
  action text NOT NULL CHECK (action IN ('read','create','update','delete','approve','export')),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, role_id) REFERENCES roles(tenant_id, id) ON DELETE CASCADE,
  UNIQUE (tenant_id, role_id, resource, action)
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  username text NOT NULL,
  display_name text NOT NULL,
  email text,
  password_hash text NOT NULL,
  force_password_change boolean NOT NULL DEFAULT true,
  auth_epoch integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, username),
  UNIQUE (tenant_id, id)
);

CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, role_id) REFERENCES roles(tenant_id, id) ON DELETE CASCADE,
  UNIQUE (tenant_id, user_id, role_id)
);

CREATE TABLE user_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id) ON DELETE CASCADE,
  UNIQUE (tenant_id, user_id, branch_id)
);

CREATE TABLE staff_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  user_auth_epoch integer NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id) ON DELETE CASCADE
);
CREATE INDEX staff_sessions_active_lookup ON staff_sessions(token_hash, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE test_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, code),
  UNIQUE (tenant_id, id)
);

CREATE TABLE specimens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  container text,
  instructions text,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, code),
  UNIQUE (tenant_id, id)
);

CREATE TABLE units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  symbol text NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, code),
  UNIQUE (tenant_id, id)
);

CREATE TABLE catalog_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  group_code text NOT NULL,
  specimen_code text,
  version integer NOT NULL CHECK (version > 0),
  provenance text NOT NULL,
  review_status text NOT NULL CHECK (review_status IN ('UNREVIEWED','TECHNICALLY_REVIEWED','CLINICALLY_APPROVED','UNSUPPORTED')),
  content_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE catalog_template_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES catalog_templates(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  result_type text NOT NULL CHECK (result_type IN ('NUMERIC','TEXT','LONG_TEXT','BOOLEAN','OPTION_LIST','CULTURE','NARRATIVE','CALCULATED')),
  unit_code text,
  method_code text,
  option_values jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT true,
  provenance text NOT NULL,
  review_status text NOT NULL CHECK (review_status IN ('UNREVIEWED','TECHNICALLY_REVIEWED','CLINICALLY_APPROVED','UNSUPPORTED')),
  UNIQUE (template_id, code),
  CHECK (result_type <> 'OPTION_LIST' OR jsonb_typeof(option_values) = 'array')
);

CREATE TABLE catalog_template_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_field_id uuid NOT NULL REFERENCES catalog_template_fields(id) ON DELETE CASCADE,
  sex text CHECK (sex IS NULL OR sex IN ('M','F','OTHER')),
  age_from_days integer,
  age_to_days integer,
  method_code text,
  normal_low numeric(18,4),
  normal_high numeric(18,4),
  text_range text,
  unit_code text,
  provenance text NOT NULL,
  review_status text NOT NULL CHECK (review_status IN ('UNREVIEWED','TECHNICALLY_REVIEWED','CLINICALLY_APPROVED','UNSUPPORTED')),
  CHECK (age_from_days IS NULL OR age_from_days >= 0),
  CHECK (age_to_days IS NULL OR age_to_days >= age_from_days),
  CHECK (normal_low IS NULL OR normal_high IS NULL OR normal_low <= normal_high)
);

CREATE TABLE tenant_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id uuid REFERENCES catalog_templates(id) ON DELETE SET NULL,
  installed_template_version integer,
  code text NOT NULL,
  name text NOT NULL,
  group_id uuid NOT NULL,
  specimen_id uuid,
  price numeric(18,2) NOT NULL CHECK (price >= 0),
  name_customized boolean NOT NULL DEFAULT false,
  group_customized boolean NOT NULL DEFAULT false,
  specimen_customized boolean NOT NULL DEFAULT false,
  provenance text NOT NULL,
  review_status text NOT NULL CHECK (review_status IN ('UNREVIEWED','TECHNICALLY_REVIEWED','CLINICALLY_APPROVED','UNSUPPORTED')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, group_id) REFERENCES test_groups(tenant_id, id),
  FOREIGN KEY (tenant_id, specimen_id) REFERENCES specimens(tenant_id, id),
  UNIQUE (tenant_id, code),
  UNIQUE (tenant_id, template_id),
  UNIQUE (tenant_id, id)
);

CREATE TABLE tenant_result_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_test_id uuid NOT NULL,
  template_field_id uuid REFERENCES catalog_template_fields(id) ON DELETE SET NULL,
  code text NOT NULL,
  name text NOT NULL,
  result_type text NOT NULL CHECK (result_type IN ('NUMERIC','TEXT','LONG_TEXT','BOOLEAN','OPTION_LIST','CULTURE','NARRATIVE','CALCULATED')),
  unit_id uuid,
  method_code text,
  option_values jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT true,
  is_customized boolean NOT NULL DEFAULT false,
  provenance text NOT NULL,
  review_status text NOT NULL CHECK (review_status IN ('UNREVIEWED','TECHNICALLY_REVIEWED','CLINICALLY_APPROVED','UNSUPPORTED')),
  is_active boolean NOT NULL DEFAULT true,
  FOREIGN KEY (tenant_id, tenant_test_id) REFERENCES tenant_tests(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, unit_id) REFERENCES units(tenant_id, id),
  UNIQUE (tenant_id, tenant_test_id, code),
  UNIQUE (tenant_id, id),
  CHECK (result_type <> 'OPTION_LIST' OR jsonb_typeof(option_values) = 'array')
);

CREATE TABLE tenant_reference_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  result_field_id uuid NOT NULL,
  template_range_id uuid REFERENCES catalog_template_ranges(id) ON DELETE SET NULL,
  sex text CHECK (sex IS NULL OR sex IN ('M','F','OTHER')),
  age_from_days integer,
  age_to_days integer,
  method_code text,
  normal_low numeric(18,4),
  normal_high numeric(18,4),
  text_range text,
  unit_id uuid,
  provenance text NOT NULL,
  review_status text NOT NULL CHECK (review_status IN ('UNREVIEWED','TECHNICALLY_REVIEWED','CLINICALLY_APPROVED','UNSUPPORTED')),
  is_customized boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  FOREIGN KEY (tenant_id, result_field_id) REFERENCES tenant_result_fields(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, unit_id) REFERENCES units(tenant_id, id),
  UNIQUE (tenant_id, template_range_id),
  CHECK (age_from_days IS NULL OR age_from_days >= 0),
  CHECK (age_to_days IS NULL OR age_to_days >= age_from_days),
  CHECK (normal_low IS NULL OR normal_high IS NULL OR normal_low <= normal_high)
);

CREATE TABLE doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid,
  code text NOT NULL,
  name text NOT NULL,
  degree text,
  specialty text,
  phone text,
  is_referring boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id),
  UNIQUE (tenant_id, code),
  UNIQUE (tenant_id, id)
);

CREATE TABLE referral_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid,
  code text NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('BROKER','AGENT','COLLECTION_POINT','CORPORATE','POLLI_DOCTOR')),
  phone text,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id),
  UNIQUE (tenant_id, code),
  UNIQUE (tenant_id, id)
);

CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  registration_branch_id uuid NOT NULL,
  patient_number text NOT NULL,
  full_name text NOT NULL,
  sex text NOT NULL DEFAULT 'UNKNOWN' CHECK (sex IN ('M','F','OTHER','UNKNOWN')),
  date_of_birth date,
  estimated_age integer CHECK (estimated_age IS NULL OR estimated_age >= 0),
  mobile text,
  mobile_normalized text,
  national_id_normalized text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, registration_branch_id) REFERENCES branches(tenant_id, id),
  UNIQUE (tenant_id, patient_number),
  UNIQUE (tenant_id, id)
);
CREATE INDEX patients_tenant_name ON patients(tenant_id, lower(full_name));
CREATE INDEX patients_tenant_mobile ON patients(tenant_id, mobile_normalized);

CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid,
  actor_user_id uuid,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id),
  FOREIGN KEY (tenant_id, actor_user_id) REFERENCES users(tenant_id, id)
);
CREATE INDEX audit_events_scope_time ON audit_events(tenant_id, occurred_at DESC);

COMMENT ON TABLE catalog_templates IS 'Global templates; never stores tenant prices or patient results.';
COMMENT ON TABLE tenant_tests IS 'Tenant-owned installation. Price and explicit customizations survive template updates.';
COMMENT ON TABLE tenant_result_fields IS 'Configuration only. No patient findings or default result values are stored here.';
