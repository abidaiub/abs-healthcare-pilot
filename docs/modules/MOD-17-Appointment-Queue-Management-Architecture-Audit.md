# MOD-17 — Appointment & Queue Management Architecture Audit

Audit date: 2026-07-24  
Baseline: MOD-15 Patient Registration (`b67596a`), MOD-07 Branch Management

## Module ID decision

| Candidate | Evidence | Verdict |
|-----------|----------|---------|
| **MOD-17** | `MODULE_REGISTRY` (`displayName: Appointment & Queue`), `module-registry.ts` (`appointmentQueue.id: "17"`), RBAC `moduleCode: "MOD-17"`, routes `/appointments*`, `ABMG_ENABLED_MODULES`, architecture book Module 17 | **Authoritative** |
| MOD-16 | Not registered as appointment module in this pilot | Not used |
| Legacy `/appointments` mock | Previously mis-attributed to `patientRegistration` | Rewired to MOD-17 |

**Confirmed module ID: MOD-17**  
Verify command: `npm run verify:mod17`  
QC doc prefix: `017`

## Existing assets reused

| Asset | Usage |
|-------|--------|
| `Patient` (MOD-15) | Appointment references `patientId` only; search by number/name/mobile |
| `Branch` + `resolveCurrentBranch()` (MOD-07) | Branch on every appointment; inactive/unauthorized branch rejected |
| `Doctor`, `DoctorBranch`, `Department` | Provider assignment; minimum doctor master reuse |
| `writeAuditLog()` (MOD-04) | Appointment and queue lifecycle events |
| RBAC foundation (MOD-02) | `APPOINTMENT_*`, `QUEUE_*` permission resources |
| i18n (MOD-06) | New `appointment` namespace, 5 locales |
| Module Registry governance | MOD-17 metadata, verify hook, QC doc paths |

## Conflicts / gaps found

| Gap | Resolution |
|-----|------------|
| No `Appointment` Prisma model | Added MOD-17 schema + migration |
| Mock appointment booking UI | Replaced with DB-backed flows |
| No queue token persistence | `BranchDoctorQueueCounter` per branch/doctor/day |
| No appointment numbering | `TenantAppointmentCounter` transactional `AP-000001` |
| `/appointments` moduleKey wrong | Fixed to `appointmentQueue` in `module-registry.ts` |

## Deferred scope

- Recurring calendars / multi-week scheduling templates
- Doctor schedule master (shift templates, holidays)
- SMS/email appointment reminders
- Online patient self-booking portal
- Billing integration at check-in
- Full Doctor Management module (only existing doctor master reused)

## Design decisions

1. **Tenant + branch scope** — every appointment belongs to tenant and branch; branch from MOD-07 current context on create.
2. **Appointment number** — `TenantAppointmentCounter` transactional increment; format `AP-000001`.
3. **Queue tokens** — per branch + doctor + calendar day; daily reset via date-keyed counter row.
4. **Walk-in flow** — auto check-in → `WAITING` with immediate queue token allocation.
5. **Scheduled flow** — `SCHEDULED` status until check-in; slot validation with `DEFAULT_MAX_PATIENTS_PER_SLOT = 1`.
6. **Skip** — patient requeued to end via new token (`requeueToEnd`).
7. **Status lifecycle** — enforced server-side with allowed transitions map.

## Migration risks

- New tables only; no collision with existing models.
- Partial unique constraints on appointment number per tenant.
- Rollback: drop appointment tables if no production data yet.
