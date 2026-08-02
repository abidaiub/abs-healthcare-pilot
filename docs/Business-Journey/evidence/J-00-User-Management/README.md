# J-00 User Management — Browser Evidence Index

Captured on 2026-08-02 against tenant **Doctors Point Diagnostic Center (DPDC)** and branch **Doctors Point Diagnostic Center – Bhola Main Branch (BR-BHL-01)**. Screens 03–20 and 26–34 verify existing DPDC configuration; they do not claim those production-like records were newly created. Screens 21–25 use the dedicated UAT account `dp.uat.user.mgmt`.

| # | File | Browser evidence | Result |
|---:|---|---|---|
| 01 | `01-tenant-admin-login.png` | Staff login with DPDC tenant and branch selectors | PASS |
| 02 | `02-tenant-dashboard.png` | Tenant-admin workspace and branch context | PASS |
| 03 | `03-company-profile.png` | Company profile and branding data | PASS |
| 04 | `04-company-branding-saved.png` | Existing saved branding configuration | PASS |
| 05 | `05-branch-list.png` | DPDC branch list | PASS |
| 06 | `06-branch-created.png` | Existing branch record verified (not created during this UAT) | PASS |
| 07 | `07-branch-active.png` | Bhola Main branch active/default state | PASS |
| 08 | `08-departments-list.png` | Department catalogue | PASS |
| 09 | `09-departments-ready.png` | Required operational departments represented | PASS |
| 10 | `10-role-list.png` | Tenant role catalogue | PASS |
| 11 | `11-role-permissions.png` | Role/permission management surface | PASS |
| 12 | `12-user-wizard.png` | Create-user form and assignment controls | PASS |
| 13 | `13-reception-user-created.png` | Existing Reception user verified | PASS |
| 14 | `14-billing-user-created.png` | Existing Billing user verified | PASS |
| 15 | `15-collection-user-created.png` | Existing Collection user verified | PASS |
| 16 | `16-lab-tech-users-created.png` | Existing lab technician users verified | PASS |
| 17 | `17-report-entry-user-created.png` | Existing Report Entry user verified | PASS |
| 18 | `18-verification-user-created.png` | Existing Verification Doctor user verified | PASS |
| 19 | `19-report-delivery-user-created.png` | Existing Report Delivery user verified | PASS |
| 20 | `20-user-list-complete.png` | Complete active operational user list | PASS |
| 21 | `21-user-edit-role-branch.png` | Dedicated UAT user edit: role, branch, status, force-change controls | PASS |
| 22 | `22-user-deactivated.png` | Dedicated UAT user set Inactive | PASS |
| 23 | `23-login-denied.png` | Inactive UAT user rejected with generic invalid-credentials message | PASS |
| 24 | `24-password-reset.png` | Reset-password control invoked for dedicated UAT user | PASS |
| 25 | `25-user-reactivated.png` | Dedicated UAT user restored to Active | PASS |
| 26 | `26-doctor-list.png` | Doctor list | PASS |
| 27 | `27-doctor-created.png` | Existing doctor record verified (not created during this UAT) | PASS |
| 28 | `28-verification-doctor.png` | Existing verifying doctor configuration | PASS |
| 29 | `29-schedule-created.png` | Existing schedule record verified (not created during this UAT) | PASS |
| 30 | `30-schedule-published.png` | Published schedule state | PASS |
| 31 | `31-doctor-available-in-appointment.png` | Published doctor available to appointment workflow | PASS |
| 32 | `32-readiness-dashboard.png` | Operational Readiness dashboard at 100% | PASS |
| 33 | `33-users-readiness-green.png` | Operational Users readiness rule green | PASS |
| 34 | `34-ready-for-first-patient.png` | READY FOR FIRST PATIENT state | PASS |

## Observed limitations

- The user edit page supports primary role, primary branch, status, force-password-change, and password reset, but it does not expose department assignment.
- DPDC has one configured branch, so the branch selector was verified but a cross-branch reassignment was not possible without inventing operational data.
- Password reset exposes no success receipt or reset audit reference in the visible page state; the control action was invoked, but the absence of visible confirmation is a minor evidence gap.

