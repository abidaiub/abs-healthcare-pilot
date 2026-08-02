-- CreateTable
CREATE TABLE "patient_portal_accounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_suspended" BOOLEAN NOT NULL DEFAULT false,
    "suspended_at" TIMESTAMP(3),
    "suspend_reason" TEXT,
    "last_login_at" TIMESTAMP(3),
    "failed_attempt_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" TEXT,

    CONSTRAINT "patient_portal_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_portal_sessions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMP(3),
    "last_seen_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "device_info" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_portal_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_portal_login_history" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "account_id" TEXT,
    "username" TEXT NOT NULL,
    "login_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_success" BOOLEAN NOT NULL,
    "fail_reason" TEXT,
    "ip_address" TEXT,
    "device_info" TEXT,

    CONSTRAINT "patient_portal_login_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_portal_delegations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "grantor_patient_id" TEXT NOT NULL,
    "grantee_account_id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "access_level" TEXT NOT NULL,
    "consent_reference" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "revoked_at" TIMESTAMP(3),
    "revoked_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_portal_delegations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_portal_accounts_patient_id_key" ON "patient_portal_accounts"("patient_id");

-- CreateIndex
CREATE INDEX "patient_portal_accounts_tenant_id_idx" ON "patient_portal_accounts"("tenant_id");

-- CreateIndex
CREATE INDEX "patient_portal_accounts_tenant_id_is_active_idx" ON "patient_portal_accounts"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "patient_portal_accounts_tenant_id_username_key" ON "patient_portal_accounts"("tenant_id", "username");

-- CreateIndex
CREATE UNIQUE INDEX "patient_portal_accounts_tenant_id_patient_id_key" ON "patient_portal_accounts"("tenant_id", "patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_portal_sessions_session_token_key" ON "patient_portal_sessions"("session_token");

-- CreateIndex
CREATE INDEX "patient_portal_sessions_tenant_id_idx" ON "patient_portal_sessions"("tenant_id");

-- CreateIndex
CREATE INDEX "patient_portal_sessions_tenant_id_account_id_idx" ON "patient_portal_sessions"("tenant_id", "account_id");

-- CreateIndex
CREATE INDEX "patient_portal_sessions_expires_at_idx" ON "patient_portal_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "patient_portal_login_history_tenant_id_idx" ON "patient_portal_login_history"("tenant_id");

-- CreateIndex
CREATE INDEX "patient_portal_login_history_tenant_id_account_id_idx" ON "patient_portal_login_history"("tenant_id", "account_id");

-- CreateIndex
CREATE INDEX "patient_portal_login_history_tenant_id_login_at_idx" ON "patient_portal_login_history"("tenant_id", "login_at");

-- CreateIndex
CREATE INDEX "patient_portal_delegations_tenant_id_idx" ON "patient_portal_delegations"("tenant_id");

-- CreateIndex
CREATE INDEX "patient_portal_delegations_tenant_id_grantee_account_id_idx" ON "patient_portal_delegations"("tenant_id", "grantee_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_portal_delegations_tenant_id_grantor_patient_id_gra_key" ON "patient_portal_delegations"("tenant_id", "grantor_patient_id", "grantee_account_id");

-- AddForeignKey
ALTER TABLE "patient_portal_accounts" ADD CONSTRAINT "patient_portal_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_portal_accounts" ADD CONSTRAINT "patient_portal_accounts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_portal_sessions" ADD CONSTRAINT "patient_portal_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_portal_sessions" ADD CONSTRAINT "patient_portal_sessions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "patient_portal_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_portal_login_history" ADD CONSTRAINT "patient_portal_login_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_portal_login_history" ADD CONSTRAINT "patient_portal_login_history_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "patient_portal_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_portal_delegations" ADD CONSTRAINT "patient_portal_delegations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_portal_delegations" ADD CONSTRAINT "patient_portal_delegations_grantor_patient_id_fkey" FOREIGN KEY ("grantor_patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_portal_delegations" ADD CONSTRAINT "patient_portal_delegations_grantee_account_id_fkey" FOREIGN KEY ("grantee_account_id") REFERENCES "patient_portal_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
