-- MOD-23 Pathologist Verification

ALTER TYPE "LabOrderTestStatus" ADD VALUE IF NOT EXISTS 'CORRECTION_REQUIRED';

CREATE TYPE "LabVerificationDecision" AS ENUM ('VERIFIED', 'REJECTED_FOR_CORRECTION');
CREATE TYPE "LabCorrectionRequestStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESUBMITTED', 'RESOLVED', 'CANCELLED');

CREATE TABLE "lab_result_verifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "lab_result_id" TEXT NOT NULL,
    "verification_sequence" INTEGER NOT NULL,
    "decision" "LabVerificationDecision" NOT NULL,
    "verifier_user_id" TEXT NOT NULL,
    "verifier_display_name_snapshot" TEXT NOT NULL,
    "verifier_designation_snapshot" TEXT,
    "verifier_registration_number_snapshot" TEXT,
    "result_version_reviewed" INTEGER NOT NULL,
    "review_started_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "verification_comment" TEXT,
    "rejection_reason_code" TEXT,
    "rejection_reason_text" TEXT,
    "affected_parameter_ids" TEXT,
    "self_approval_override" BOOLEAN NOT NULL DEFAULT false,
    "self_approval_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_result_verifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lab_result_correction_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lab_result_id" TEXT NOT NULL,
    "verification_id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason_code" TEXT NOT NULL,
    "reason_text" TEXT NOT NULL,
    "status" "LabCorrectionRequestStatus" NOT NULL DEFAULT 'OPEN',
    "technician_note" TEXT,
    "resolved_by_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_result_correction_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lab_result_verifications_lab_result_id_verification_sequence_key" ON "lab_result_verifications"("lab_result_id", "verification_sequence");
CREATE INDEX "lab_result_verifications_tenant_id_idx" ON "lab_result_verifications"("tenant_id");
CREATE INDEX "lab_result_verifications_tenant_id_branch_id_idx" ON "lab_result_verifications"("tenant_id", "branch_id");
CREATE INDEX "lab_result_verifications_tenant_id_lab_result_id_idx" ON "lab_result_verifications"("tenant_id", "lab_result_id");
CREATE INDEX "lab_result_verifications_tenant_id_decision_idx" ON "lab_result_verifications"("tenant_id", "decision");
CREATE INDEX "lab_result_verifications_tenant_id_verified_at_idx" ON "lab_result_verifications"("tenant_id", "verified_at");

CREATE UNIQUE INDEX "lab_result_correction_requests_verification_id_key" ON "lab_result_correction_requests"("verification_id");
CREATE INDEX "lab_result_correction_requests_tenant_id_idx" ON "lab_result_correction_requests"("tenant_id");
CREATE INDEX "lab_result_correction_requests_tenant_id_lab_result_id_idx" ON "lab_result_correction_requests"("tenant_id", "lab_result_id");
CREATE INDEX "lab_result_correction_requests_tenant_id_status_idx" ON "lab_result_correction_requests"("tenant_id", "status");

ALTER TABLE "lab_result_verifications" ADD CONSTRAINT "lab_result_verifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_result_verifications" ADD CONSTRAINT "lab_result_verifications_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lab_result_verifications" ADD CONSTRAINT "lab_result_verifications_lab_result_id_fkey" FOREIGN KEY ("lab_result_id") REFERENCES "lab_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lab_result_correction_requests" ADD CONSTRAINT "lab_result_correction_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_result_correction_requests" ADD CONSTRAINT "lab_result_correction_requests_lab_result_id_fkey" FOREIGN KEY ("lab_result_id") REFERENCES "lab_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lab_result_correction_requests" ADD CONSTRAINT "lab_result_correction_requests_verification_id_fkey" FOREIGN KEY ("verification_id") REFERENCES "lab_result_verifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
