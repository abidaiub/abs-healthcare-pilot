-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('SMS', 'WHATSAPP', 'EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationEventType" AS ENUM ('LAB_REPORT_READY', 'INVOICE_PAYMENT_RECEIPT', 'CRITICAL_RESULT_ALERT');

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_type" "NotificationEventType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en-BD',
    "body_template" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_outbox" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "event_type" "NotificationEventType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "recipient_name" TEXT,
    "recipient_mobile" TEXT,
    "recipient_email" TEXT,
    "message_body" TEXT NOT NULL,
    "dedupe_key" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "provider_name" TEXT,
    "provider_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_templates_tenant_id_idx" ON "notification_templates"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_tenant_id_event_type_channel_locale_key" ON "notification_templates"("tenant_id", "event_type", "channel", "locale");

-- CreateIndex
CREATE INDEX "notification_outbox_tenant_id_idx" ON "notification_outbox"("tenant_id");

-- CreateIndex
CREATE INDEX "notification_outbox_tenant_id_status_idx" ON "notification_outbox"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "notification_outbox_tenant_id_event_type_idx" ON "notification_outbox"("tenant_id", "event_type");

-- CreateIndex
CREATE INDEX "notification_outbox_tenant_id_created_at_idx" ON "notification_outbox"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_outbox_tenant_id_dedupe_key_key" ON "notification_outbox"("tenant_id", "dedupe_key");

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
