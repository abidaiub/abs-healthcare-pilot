-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceDiscountType" AS ENUM ('NONE', 'PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "InvoicePaymentMethod" AS ENUM ('CASH', 'CARD', 'MOBILE_BANKING', 'BANK_TRANSFER', 'CHEQUE');

-- CreateEnum
CREATE TYPE "InvoicePaymentStatus" AS ENUM ('RECEIVED', 'REVERSED');

-- CreateEnum
CREATE TYPE "InvoiceDiscountEventType" AS ENUM ('APPLIED', 'MODIFIED', 'REMOVED');

-- CreateTable
CREATE TABLE "tenant_invoice_counters" (
    "tenant_id" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tenant_invoice_counters_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateTable
CREATE TABLE "tenant_receipt_counters" (
    "tenant_id" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tenant_receipt_counters_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "lab_order_id" TEXT,
    "invoice_number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "currency_code" TEXT NOT NULL DEFAULT 'BDT',
    "gross_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discount_type" "InvoiceDiscountType" NOT NULL DEFAULT 'NONE',
    "discount_value" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discount_reason" TEXT,
    "discount_approved_by_id" TEXT,
    "discount_approved_by_name" TEXT,
    "discount_approved_at" TIMESTAMP(3),
    "net_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "due_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "record_version" INTEGER NOT NULL DEFAULT 1,
    "issued_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" TEXT,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "tenant_service_id" TEXT,
    "lab_order_test_id" TEXT,
    "test_code" TEXT,
    "test_name" TEXT NOT NULL,
    "department_id" TEXT,
    "unit_price" DECIMAL(18,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "line_gross_amount" DECIMAL(18,2) NOT NULL,
    "line_discount_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "line_net_amount" DECIMAL(18,2) NOT NULL,
    "price_source" TEXT,
    "discount_allowed_snapshot" BOOLEAN NOT NULL DEFAULT true,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "payment_method" "InvoicePaymentMethod" NOT NULL DEFAULT 'CASH',
    "status" "InvoicePaymentStatus" NOT NULL DEFAULT 'RECEIVED',
    "reference_no" TEXT,
    "note" TEXT,
    "idempotency_key" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_by_id" TEXT,
    "received_by_name" TEXT,
    "reversed_at" TIMESTAMP(3),
    "reversed_by_id" TEXT,
    "reversal_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_discount_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "event_type" "InvoiceDiscountEventType" NOT NULL,
    "previous_discount_type" "InvoiceDiscountType" NOT NULL DEFAULT 'NONE',
    "previous_discount_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "new_discount_type" "InvoiceDiscountType" NOT NULL DEFAULT 'NONE',
    "new_discount_value" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "new_discount_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "reason" TEXT,
    "applied_after_payment" BOOLEAN NOT NULL DEFAULT false,
    "authorized_by_id" TEXT,
    "authorized_by_name" TEXT,
    "authorized_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_discount_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_lab_order_id_key" ON "invoices"("lab_order_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_idx" ON "invoices"("tenant_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_branch_id_idx" ON "invoices"("tenant_id", "branch_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_patient_id_idx" ON "invoices"("tenant_id", "patient_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_status_idx" ON "invoices"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_invoice_number_idx" ON "invoices"("tenant_id", "invoice_number");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_created_at_idx" ON "invoices"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_tenant_id_invoice_number_key" ON "invoices"("tenant_id", "invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_items_lab_order_test_id_key" ON "invoice_items"("lab_order_test_id");

-- CreateIndex
CREATE INDEX "invoice_items_tenant_id_idx" ON "invoice_items"("tenant_id");

-- CreateIndex
CREATE INDEX "invoice_items_tenant_id_invoice_id_idx" ON "invoice_items"("tenant_id", "invoice_id");

-- CreateIndex
CREATE INDEX "invoice_payments_tenant_id_idx" ON "invoice_payments"("tenant_id");

-- CreateIndex
CREATE INDEX "invoice_payments_tenant_id_invoice_id_idx" ON "invoice_payments"("tenant_id", "invoice_id");

-- CreateIndex
CREATE INDEX "invoice_payments_tenant_id_status_idx" ON "invoice_payments"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "invoice_payments_tenant_id_received_at_idx" ON "invoice_payments"("tenant_id", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_payments_tenant_id_receipt_number_key" ON "invoice_payments"("tenant_id", "receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_payments_tenant_id_idempotency_key_key" ON "invoice_payments"("tenant_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "invoice_discount_events_tenant_id_idx" ON "invoice_discount_events"("tenant_id");

-- CreateIndex
CREATE INDEX "invoice_discount_events_tenant_id_invoice_id_idx" ON "invoice_discount_events"("tenant_id", "invoice_id");

-- CreateIndex
CREATE INDEX "invoice_discount_events_tenant_id_authorized_at_idx" ON "invoice_discount_events"("tenant_id", "authorized_at");

-- AddForeignKey
ALTER TABLE "tenant_invoice_counters" ADD CONSTRAINT "tenant_invoice_counters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_receipt_counters" ADD CONSTRAINT "tenant_receipt_counters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "lab_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_tenant_service_id_fkey" FOREIGN KEY ("tenant_service_id") REFERENCES "tenant_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_lab_order_test_id_fkey" FOREIGN KEY ("lab_order_test_id") REFERENCES "lab_order_tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_discount_events" ADD CONSTRAINT "invoice_discount_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_discount_events" ADD CONSTRAINT "invoice_discount_events_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
