ALTER TABLE tenants
  ADD COLUMN offline_lease_hours integer NOT NULL DEFAULT 72 CHECK (offline_lease_hours BETWEEN 1 AND 168),
  ADD COLUMN offline_max_bill_minor bigint NOT NULL DEFAULT 10000000 CHECK (offline_max_bill_minor > 0);

CREATE TABLE device_activation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL,
  code_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_by uuid NOT NULL,
  used_at timestamptz,
  used_by_device_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id),
  FOREIGN KEY (tenant_id, created_by) REFERENCES users(tenant_id, id)
);

CREATE TABLE devices (
  id text PRIMARY KEY CHECK (id ~ '^dev_[A-Za-z0-9_-]{12,120}$'),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL,
  name text NOT NULL,
  installation_id text NOT NULL,
  secret_hash text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED','REVOKED')),
  authorization_epoch integer NOT NULL DEFAULT 1,
  activated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  disabled_at timestamptz,
  revoked_at timestamptz,
  FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id),
  UNIQUE (tenant_id, id)
);
CREATE UNIQUE INDEX devices_one_active_per_branch ON devices(tenant_id,branch_id) WHERE status='ACTIVE';

CREATE TABLE device_catalog_snapshots (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  version text NOT NULL,
  catalog_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, device_id) REFERENCES devices(tenant_id, id),
  PRIMARY KEY (tenant_id, device_id, version)
);

CREATE TABLE device_sync_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL,
  device_id text NOT NULL,
  operation_id text NOT NULL,
  operation_type text NOT NULL CHECK (operation_type IN ('CREATE_PATIENT','POST_BILL','REQUEST_CANCELLATION','REQUEST_REFUND')),
  contract_version integer NOT NULL CHECK (contract_version = 1),
  payload_hash text NOT NULL,
  occurred_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED','ACKNOWLEDGED','CONFLICTED','QUARANTINED')),
  response_json jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id),
  FOREIGN KEY (tenant_id, device_id) REFERENCES devices(tenant_id, id),
  UNIQUE (tenant_id, operation_id),
  UNIQUE (tenant_id, device_id, id)
);

CREATE TABLE offline_action_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL,
  device_id text NOT NULL,
  operation_id text NOT NULL,
  bill_id uuid,
  local_bill_operation_id text NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('CANCELLATION','REFUND')),
  amount_minor bigint CHECK (amount_minor IS NULL OR amount_minor > 0),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'CAPTURED' CHECK (status IN ('CAPTURED','REVIEWED','REJECTED','COMPLETED')),
  requested_by uuid NOT NULL,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id),
  FOREIGN KEY (tenant_id, device_id) REFERENCES devices(tenant_id, id),
  FOREIGN KEY (tenant_id, bill_id) REFERENCES bills(tenant_id, id),
  FOREIGN KEY (tenant_id, requested_by) REFERENCES users(tenant_id, id),
  UNIQUE (tenant_id, operation_id)
);

CREATE TABLE device_sync_events (
  sequence_id bigserial PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL,
  device_id text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id),
  FOREIGN KEY (tenant_id, device_id) REFERENCES devices(tenant_id, id)
);
CREATE INDEX device_sync_events_pull ON device_sync_events(tenant_id,device_id,sequence_id);

ALTER TABLE bills
  ADD COLUMN origin_device_id text,
  ADD COLUMN local_receipt_number text,
  ADD FOREIGN KEY (tenant_id, origin_device_id) REFERENCES devices(tenant_id, id);
CREATE UNIQUE INDEX bills_local_receipt_unique ON bills(tenant_id,origin_device_id,local_receipt_number) WHERE origin_device_id IS NOT NULL;

INSERT INTO role_permissions(tenant_id,role_id,resource,action)
SELECT r.tenant_id,r.id,'devices',grant_action
FROM roles r CROSS JOIN (VALUES ('read'),('create'),('update')) AS grants(grant_action)
WHERE r.code='LAB_ADMIN'
ON CONFLICT DO NOTHING;
