# MOD-37 — HR & Employee Management

| Field | Value |
|-------|-------|
| **Module** | MOD-37 |
| **Numeric ID** | 37 |
| **Display name** | HR & Employee Management |
| **Category** | Business Operations / HR |
| **Depends on** | Platform (MOD-01, MOD-01A, MOD-02, MOD-03, MOD-04, MOD-06, MOD-07); links MOD-08 (department/org), MOD-02 User (identity link, not replacement) |
| **Consumed by** | MOD-38 |
| **Documentation status** | ARCHITECTURE APPROVED |
| **Implementation status** | NOT STARTED |
| **AI-QC** | NOT RUN |
| **Manual QC/UAT** | NOT RUN |
| **Production** | NOT APPROVED |
| **Edition availability** | Diagnostic: Optional; Clinic/Hospital: Recommended; Trading/Distribution, Manufacturing: Optional; Enterprise: Required |
| **Scope document** | this file |
| **Suite overview** | docs/Architecture/05-Business-Operations-Suite.md |
| **ADRs** | None module-specific; payroll posting later via ADR-001 through MOD-38 → MOD-33 |

## Purpose

Provide the employee master and employment lifecycle for ABSHealthcareLite: organization links, attendance and roster, leave, overtime, transfers/promotions, document expiry, and separation. MOD-37 is the HR system of record for people data consumed by payroll (MOD-38). It links to — but does not replace — MOD-02 User identity.

## In scope

- Employee master
- Employment lifecycle (hire → active → transfer/promotion → separation)
- Department link (MOD-08 org structure)
- Designation and position
- Attendance, shift, and roster
- Leave and overtime
- Transfer and promotion
- Document expiry tracking
- Separation / exit processing (HR side)
- Optional link from Employee to MOD-02 User for system access (identity link only)

## Out of scope

- Salary structure, payroll run, PF, tax, payslip, loans, final settlement accounting (MOD-38)
- GL posting and vouchers (MOD-33; via MOD-38 only)
- Replacing MOD-02 User / RBAC as the security principal
- Replacing MOD-08 as department master ownership
- Procurement, inventory, manufacturing
- **This reservation phase:** no UI, no API/routes, no Prisma schema, no tenant enablement

## Architectural boundaries

- Employee is an HR party entity; User remains the authentication/authorization principal (MOD-02).
- Department ownership stays with MOD-08; MOD-37 stores employee–department assignment links.
- MOD-37 does not post accounting entries. Compensable time (attendance, OT, leave without pay flags) feeds MOD-38.
- Tenant and branch scoping follow platform rules; multi-branch rostering must respect MOD-07.

## Integration notes

| System | Role |
|--------|------|
| MOD-02 | Optional User identity link for login/RBAC |
| MOD-08 | Department / org structure link |
| MOD-07 | Branch context for assignment and roster |
| MOD-38 | Consumes employee, attendance, leave, OT, separation for payroll |
| MOD-33 | No direct posts from MOD-37 |

## Planned screens (documentation only — NOT IMPLEMENTED)

- Employee master list / detail
- Employment lifecycle actions (hire, transfer, promote, separate)
- Designation / position setup
- Shift & roster
- Attendance capture / import
- Leave request & approval
- Overtime entry
- Document expiry tracker
- Separation checklist

Volume 4 UI rules apply when implemented: i18n, RTL, WCAG AA, status badges for employment/leave states, no hardcoded English; monetary fields appear mainly in MOD-38.

## Reports / print (planned)

- Employee directory, headcount by department/designation
- Attendance register, leave balance, overtime register
- Document expiry, separation register
- Roster / shift schedule print

## Governance

Standing ABSHealthcareLite rule: update module docs, registry, dependencies; run AI QC after implementation; Manual QC/UAT required before approval. This reservation is documentation only.

## Status declaration

This module is PLANNED / ARCHITECTURE APPROVED. It is not implemented, not active for tenants, not AI-QC passed, not Manual-QC passed, and not production ready.
