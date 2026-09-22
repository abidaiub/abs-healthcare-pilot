ALTER TABLE tenants
  ADD COLUMN receipt_format text NOT NULL DEFAULT 'A5' CHECK (receipt_format IN ('A4','A5','POS80','POS58')),
  ADD COLUMN show_referral_partner_on_receipt boolean NOT NULL DEFAULT false,
  ADD COLUMN counter_discount_limit_bps integer NOT NULL DEFAULT 1000 CHECK (counter_discount_limit_bps BETWEEN 0 AND 10000),
  ADD COLUMN admin_discount_limit_bps integer NOT NULL DEFAULT 3000 CHECK (admin_discount_limit_bps BETWEEN 0 AND 10000);

CREATE TABLE billing_counters (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL,
  next_bill_number bigint NOT NULL DEFAULT 1 CHECK (next_bill_number > 0),
  PRIMARY KEY (tenant_id, branch_id),
  FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id)
);

CREATE TABLE billing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  operation_id text NOT NULL,
  operation_type text NOT NULL,
  request_hash text NOT NULL,
  entity_id uuid,
  response_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (tenant_id, operation_id)
);

CREATE TABLE billing_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL,
  operation_id text NOT NULL,
  patient_id uuid,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'HELD' CHECK (status IN ('HELD','POSTED','CANCELLED')),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id),
  FOREIGN KEY (tenant_id, patient_id) REFERENCES patients(tenant_id, id),
  FOREIGN KEY (tenant_id, created_by) REFERENCES users(tenant_id, id),
  UNIQUE (tenant_id, operation_id),
  UNIQUE (tenant_id, id)
);

CREATE TABLE bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL,
  operation_id text NOT NULL,
  bill_number text NOT NULL,
  patient_id uuid NOT NULL,
  doctor_id uuid,
  referral_partner_id uuid,
  patient_number_snapshot text NOT NULL,
  patient_name_snapshot text NOT NULL,
  patient_mobile_snapshot text,
  doctor_name_snapshot text,
  referral_partner_name_snapshot text,
  currency_code char(3) NOT NULL,
  gross_minor bigint NOT NULL CHECK (gross_minor >= 0),
  discount_minor bigint NOT NULL CHECK (discount_minor >= 0),
  net_minor bigint NOT NULL CHECK (net_minor >= 0 AND net_minor = gross_minor - discount_minor),
  expected_delivery_at timestamptz,
  status text NOT NULL DEFAULT 'POSTED' CHECK (status IN ('POSTED','PARTIALLY_CANCELLED','CANCELLED')),
  posted_by uuid NOT NULL,
  posted_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id),
  FOREIGN KEY (tenant_id, patient_id) REFERENCES patients(tenant_id, id),
  FOREIGN KEY (tenant_id, doctor_id) REFERENCES doctors(tenant_id, id),
  FOREIGN KEY (tenant_id, referral_partner_id) REFERENCES referral_partners(tenant_id, id),
  FOREIGN KEY (tenant_id, posted_by) REFERENCES users(tenant_id, id),
  UNIQUE (tenant_id, operation_id),
  UNIQUE (tenant_id, bill_number),
  UNIQUE (tenant_id, id)
);

CREATE TABLE bill_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bill_id uuid NOT NULL,
  tenant_test_id uuid NOT NULL,
  line_key text NOT NULL,
  test_code_snapshot text NOT NULL,
  test_name_snapshot text NOT NULL,
  group_name_snapshot text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_minor bigint NOT NULL CHECK (unit_price_minor >= 0),
  gross_minor bigint NOT NULL CHECK (gross_minor = unit_price_minor * quantity),
  discount_minor bigint NOT NULL CHECK (discount_minor BETWEEN 0 AND gross_minor),
  net_minor bigint NOT NULL CHECK (net_minor = gross_minor - discount_minor),
  cancelled_minor bigint NOT NULL DEFAULT 0 CHECK (cancelled_minor BETWEEN 0 AND net_minor),
  repeat_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, bill_id) REFERENCES bills(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, tenant_test_id) REFERENCES tenant_tests(tenant_id, id),
  UNIQUE (tenant_id, bill_id, line_key),
  UNIQUE (tenant_id, id)
);

CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL,
  bill_id uuid NOT NULL,
  operation_id text NOT NULL,
  collection_number text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('INITIAL','DUE')),
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('CASH','BKASH','NAGAD','CARD','BANK')),
  external_reference text,
  collected_by uuid NOT NULL,
  collected_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id),
  FOREIGN KEY (tenant_id, bill_id) REFERENCES bills(tenant_id, id),
  FOREIGN KEY (tenant_id, collected_by) REFERENCES users(tenant_id, id),
  UNIQUE (tenant_id, operation_id),
  UNIQUE (tenant_id, collection_number),
  UNIQUE (tenant_id, id)
);

CREATE TABLE bill_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL,
  bill_id uuid NOT NULL,
  bill_line_id uuid NOT NULL,
  operation_id text NOT NULL,
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('CANCEL_LINE','CANCEL_BILL')),
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  reason text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id),
  FOREIGN KEY (tenant_id, bill_id) REFERENCES bills(tenant_id, id),
  FOREIGN KEY (tenant_id, bill_line_id) REFERENCES bill_lines(tenant_id, id),
  FOREIGN KEY (tenant_id, created_by) REFERENCES users(tenant_id, id),
  UNIQUE (tenant_id, operation_id, bill_line_id)
);

CREATE TABLE refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL,
  bill_id uuid NOT NULL,
  request_operation_id text NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED','APPROVED','REJECTED','PAID')),
  requested_by uuid NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_by uuid,
  decided_at timestamptz,
  decision_reason text,
  payout_operation_id text,
  payout_method text CHECK (payout_method IS NULL OR payout_method IN ('CASH','BKASH','NAGAD','CARD','BANK')),
  payout_reference text,
  paid_by uuid,
  paid_at timestamptz,
  FOREIGN KEY (tenant_id, branch_id) REFERENCES branches(tenant_id, id),
  FOREIGN KEY (tenant_id, bill_id) REFERENCES bills(tenant_id, id),
  FOREIGN KEY (tenant_id, requested_by) REFERENCES users(tenant_id, id),
  FOREIGN KEY (tenant_id, decided_by) REFERENCES users(tenant_id, id),
  FOREIGN KEY (tenant_id, paid_by) REFERENCES users(tenant_id, id),
  UNIQUE (tenant_id, request_operation_id),
  UNIQUE (tenant_id, payout_operation_id),
  UNIQUE (tenant_id, id),
  CHECK (decided_by IS NULL OR decided_by <> requested_by)
);

CREATE TABLE receipt_print_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bill_id uuid NOT NULL,
  receipt_type text NOT NULL CHECK (receipt_type IN ('BILL','COLLECTION','REFUND')),
  related_id uuid,
  copy_designation text NOT NULL CHECK (copy_designation IN ('PATIENT','OFFICE','DUPLICATE')),
  printed_by uuid NOT NULL,
  printed_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, bill_id) REFERENCES bills(tenant_id, id),
  FOREIGN KEY (tenant_id, printed_by) REFERENCES users(tenant_id, id)
);

CREATE INDEX bills_search ON bills(tenant_id, posted_at DESC, bill_number);
CREATE INDEX bills_patient ON bills(tenant_id, patient_id, posted_at DESC);
CREATE INDEX collections_bill_time ON collections(tenant_id, bill_id, collected_at);
CREATE INDEX refunds_bill_status ON refunds(tenant_id, bill_id, status);
CREATE INDEX billing_drafts_owner ON billing_drafts(tenant_id, branch_id, created_by, status);

INSERT INTO role_permissions(tenant_id,role_id,resource,action)
SELECT r.tenant_id,r.id,g.resource,g.action
FROM roles r
CROSS JOIN (VALUES
  ('billing','create'),('billing','update'),('discount','approve'),
  ('billing_adjustment','create'),('billing_adjustment','approve'),
  ('refund','create'),('refund','approve'),('refund','update'),
  ('receipts','read'),('receipts','create'),('collection_reports','read'),('collection_reports','export')
) g(resource,action)
WHERE r.code='LAB_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(tenant_id,role_id,resource,action)
SELECT r.tenant_id,r.id,g.resource,g.action
FROM roles r
CROSS JOIN (VALUES
  ('billing','create'),('billing','update'),('refund','create'),
  ('receipts','read'),('receipts','create'),('collection_reports','read')
) g(resource,action)
WHERE r.code='COUNTER'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(tenant_id,role_id,resource,action)
SELECT r.tenant_id,r.id,g.resource,g.action
FROM roles r
CROSS JOIN (VALUES ('receipts','read'),('collection_reports','read'),('collection_reports','export')) g(resource,action)
WHERE r.code='ACCOUNTS_VIEWER'
ON CONFLICT DO NOTHING;

COMMENT ON TABLE bills IS 'Immutable posted billing header snapshots; corrections are append-only adjustments.';
COMMENT ON TABLE bill_lines IS 'Original test/name/price/discount allocation snapshots. cancelled_minor only advances under a locked bill transaction.';
COMMENT ON TABLE refunds IS 'Approval is not payout. Only PAID rows affect cash reporting and refundable balance.';
