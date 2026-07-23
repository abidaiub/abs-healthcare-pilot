# MOD-17 — Appointment & Queue Management

| Field | Value |
|-------|-------|
| **Module** | MOD-17 |
| **Display name** | Appointment & Queue |
| **Category** | Clinical Foundation |
| **Depends on** | MOD-01, MOD-01A, MOD-02, MOD-03, MOD-04, MOD-06, MOD-07, MOD-15 |
| **Status** | Implemented (foundation coverage) |
| **Verify** | `npm run verify:mod17` |

## Purpose

Provide OPD appointment booking, branch-aware scheduling, and doctor-wise daily queue management integrated with patient registration and branch context.

## Scope

### Appointment
- Walk-in and scheduled appointments
- Server-generated appointment numbers (`AP-000001`)
- Date, time slot, doctor, department, patient, reason, notes
- Status lifecycle: Scheduled → Checked In → Waiting → Called → In Consultation → Completed / Cancelled / No Show

### Queue
- Branch + doctor daily queue tokens
- Call, skip (requeue), recall, complete, cancel
- Queue dashboard and operator screen

### Scheduling
- Fixed time slots (`TIME_SLOTS`)
- Double-booking prevention (max 1 patient per slot by default)
- Doctor must be active at branch via `DoctorBranch`

### Integration
- Patient: MOD-15 (`Patient.id`, `patientNumber` only)
- Branch: MOD-07 current branch context
- Doctor: existing `Doctor` master (placeholder relationship only)

Out of scope: recurring calendars, doctor shift master, reminders, billing, full doctor CRUD.

## Architecture

| Layer | Location |
|-------|----------|
| Schema | `prisma/schema.prisma` — `Appointment`, `TenantAppointmentCounter`, `BranchDoctorQueueCounter` |
| Numbering | `src/lib/appointment/number.ts` |
| Queue | `src/lib/appointment/queue.ts` |
| Validation | `src/lib/appointment/validation.ts` |
| Queries | `src/lib/appointment/queries.ts` |
| Branch context | `src/lib/appointment/context.ts` |
| Actions | `src/app/actions/tenant-appointments.ts` |
| UI | `/appointments`, `/appointments/new`, `/appointments/[id]`, `/appointments/[id]/edit`, `/appointments/queue`, `/appointments/queue/operator` |

## Data model

| Entity | Purpose |
|--------|---------|
| `Appointment` | Core appointment record with lifecycle timestamps |
| `TenantAppointmentCounter` | Tenant-scoped sequential appointment numbers |
| `BranchDoctorQueueCounter` | Daily queue token counter per branch/doctor |

## RBAC

| Route | Permission |
|-------|------------|
| `/appointments` | `APPOINTMENT_MGMT` (view) |
| `/appointments/new` | `APPOINTMENT_BOOK` (create) |
| `/appointments/[id]/edit` | `APPOINTMENT_MGMT` (edit) |
| `/appointments/queue` | `QUEUE_MGMT` (view) |
| `/appointments/queue/operator` | `QUEUE_OPERATE` (edit) |

## Audit events

Appointment Created, Updated, Checked In, Called, Completed, Cancelled, No Show, Queue Called, Queue Skipped, Queue Recalled.

## Localization

Namespace: `appointment` — locales: en-BD, bn-BD, ar-SA, ur-PK, hi-IN (RTL for ar-SA, ur-PK).

## QC status

| Check | Status |
|-------|--------|
| Automated (`verify:mod17`) | PASS |
| Manual QC | NOT TESTED |
| Browser UAT | NOT TESTED |
| Production approval | Pending Manual QC |

See `docs/modules/MOD-17-Appointment-Queue-Management-Architecture-Audit.md`.
