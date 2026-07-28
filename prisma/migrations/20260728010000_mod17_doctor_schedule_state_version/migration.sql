-- Additive optimistic-concurrency column for MOD-17 DoctorSchedule.
-- Safe when the create migration already included state_version (IF NOT EXISTS),
-- and required when an earlier create migration ran without it.
ALTER TABLE "doctor_schedules" ADD COLUMN IF NOT EXISTS "state_version" INTEGER NOT NULL DEFAULT 1;
