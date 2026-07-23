-- MOD-15 Patient Registration / Patient Master

CREATE TYPE "PatientGender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNKNOWN');
CREATE TYPE "BloodGroup" AS ENUM (
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE',
  'UNKNOWN'
);
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'UNKNOWN');

CREATE TABLE "tenant_patient_counters" (
  "tenant_id" TEXT NOT NULL,
  "last_number" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "tenant_patient_counters_pkey" PRIMARY KEY ("tenant_id")
);

CREATE TABLE "patients" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "patient_number" TEXT NOT NULL,
  "first_name" TEXT NOT NULL,
  "middle_name" TEXT,
  "last_name" TEXT,
  "full_name" TEXT NOT NULL,
  "preferred_name" TEXT,
  "gender" "PatientGender" NOT NULL DEFAULT 'UNKNOWN',
  "date_of_birth" DATE,
  "estimated_age" INTEGER,
  "age_as_of_date" DATE,
  "blood_group" "BloodGroup",
  "marital_status" "MaritalStatus",
  "nationality" TEXT,
  "country_code" TEXT,
  "mobile" TEXT,
  "mobile_normalized" TEXT,
  "alternate_mobile" TEXT,
  "alternate_mobile_normalized" TEXT,
  "email" TEXT,
  "address_line1" TEXT,
  "address_line2" TEXT,
  "city" TEXT,
  "district" TEXT,
  "postal_code" TEXT,
  "national_id" TEXT,
  "national_id_normalized" TEXT,
  "passport_number" TEXT,
  "passport_number_normalized" TEXT,
  "occupation" TEXT,
  "religion" TEXT,
  "photo_url" TEXT,
  "notes" TEXT,
  "guardian_name" TEXT,
  "guardian_relation" TEXT,
  "guardian_mobile" TEXT,
  "guardian_mobile_normalized" TEXT,
  "emergency_contact_name" TEXT,
  "emergency_contact_relation" TEXT,
  "emergency_contact_mobile" TEXT,
  "emergency_contact_mobile_normalized" TEXT,
  "registration_branch_id" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "updated_by" TEXT,
  CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "tenant_patient_counters"
  ADD CONSTRAINT "tenant_patient_counters_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "patients"
  ADD CONSTRAINT "patients_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "patients"
  ADD CONSTRAINT "patients_registration_branch_id_fkey"
  FOREIGN KEY ("registration_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "patients_tenant_id_patient_number_key" ON "patients"("tenant_id", "patient_number");
CREATE INDEX "patients_tenant_id_idx" ON "patients"("tenant_id");
CREATE INDEX "patients_tenant_id_is_active_idx" ON "patients"("tenant_id", "is_active");
CREATE INDEX "patients_tenant_id_mobile_normalized_idx" ON "patients"("tenant_id", "mobile_normalized");
CREATE INDEX "patients_tenant_id_national_id_normalized_idx" ON "patients"("tenant_id", "national_id_normalized");
CREATE INDEX "patients_tenant_id_full_name_idx" ON "patients"("tenant_id", "full_name");
CREATE INDEX "patients_tenant_id_registration_branch_id_idx" ON "patients"("tenant_id", "registration_branch_id");
CREATE INDEX "patients_registration_branch_id_idx" ON "patients"("registration_branch_id");
CREATE INDEX "patients_created_at_idx" ON "patients"("created_at");

CREATE UNIQUE INDEX "patients_tenant_national_id_unique"
  ON "patients"("tenant_id", "national_id_normalized")
  WHERE "national_id_normalized" IS NOT NULL;
