-- MOD-17 Appointment & Queue Management

CREATE TYPE "AppointmentType" AS ENUM ('WALK_IN', 'SCHEDULED');
CREATE TYPE "AppointmentStatus" AS ENUM (
  'SCHEDULED',
  'CHECKED_IN',
  'WAITING',
  'CALLED',
  'IN_CONSULTATION',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
);

CREATE TABLE "tenant_appointment_counters" (
  "tenant_id" TEXT NOT NULL,
  "last_number" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "tenant_appointment_counters_pkey" PRIMARY KEY ("tenant_id")
);

CREATE TABLE "branch_doctor_queue_counters" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "branch_id" TEXT NOT NULL,
  "doctor_id" TEXT NOT NULL,
  "queue_date" DATE NOT NULL,
  "last_token" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "branch_doctor_queue_counters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "appointments" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "appointment_number" TEXT NOT NULL,
  "appointment_type" "AppointmentType" NOT NULL,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
  "appointment_date" DATE NOT NULL,
  "time_slot" TEXT,
  "patient_id" TEXT NOT NULL,
  "branch_id" TEXT NOT NULL,
  "doctor_id" TEXT NOT NULL,
  "department_id" TEXT,
  "reason_for_visit" TEXT,
  "notes" TEXT,
  "queue_token" INTEGER,
  "queue_token_date" DATE,
  "checked_in_at" TIMESTAMP(3),
  "called_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "updated_by" TEXT,
  CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "tenant_appointment_counters"
  ADD CONSTRAINT "tenant_appointment_counters_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "branch_doctor_queue_counters"
  ADD CONSTRAINT "branch_doctor_queue_counters_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "branch_doctor_queue_counters"
  ADD CONSTRAINT "branch_doctor_queue_counters_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "branch_doctor_queue_counters"
  ADD CONSTRAINT "branch_doctor_queue_counters_doctor_id_fkey"
  FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_patient_id_fkey"
  FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_branch_id_fkey"
  FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_doctor_id_fkey"
  FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "appointments_tenant_id_appointment_number_key" ON "appointments"("tenant_id", "appointment_number");
CREATE UNIQUE INDEX "branch_doctor_queue_counters_tenant_id_branch_id_doctor_id_queue_date_key"
  ON "branch_doctor_queue_counters"("tenant_id", "branch_id", "doctor_id", "queue_date");
CREATE INDEX "appointments_tenant_id_idx" ON "appointments"("tenant_id");
CREATE INDEX "appointments_tenant_id_branch_id_idx" ON "appointments"("tenant_id", "branch_id");
CREATE INDEX "appointments_tenant_id_doctor_id_idx" ON "appointments"("tenant_id", "doctor_id");
CREATE INDEX "appointments_tenant_id_patient_id_idx" ON "appointments"("tenant_id", "patient_id");
CREATE INDEX "appointments_tenant_id_status_idx" ON "appointments"("tenant_id", "status");
CREATE INDEX "appointments_tenant_id_appointment_date_idx" ON "appointments"("tenant_id", "appointment_date");
CREATE INDEX "appointments_tenant_id_branch_id_doctor_id_appointment_date_idx"
  ON "appointments"("tenant_id", "branch_id", "doctor_id", "appointment_date");
CREATE INDEX "appointments_tenant_id_branch_id_doctor_id_appointment_date_time_slot_idx"
  ON "appointments"("tenant_id", "branch_id", "doctor_id", "appointment_date", "time_slot");
CREATE INDEX "appointments_tenant_id_branch_id_doctor_id_queue_token_date_queue_token_idx"
  ON "appointments"("tenant_id", "branch_id", "doctor_id", "queue_token_date", "queue_token");
CREATE INDEX "branch_doctor_queue_counters_tenant_id_branch_id_queue_date_idx"
  ON "branch_doctor_queue_counters"("tenant_id", "branch_id", "queue_date");
