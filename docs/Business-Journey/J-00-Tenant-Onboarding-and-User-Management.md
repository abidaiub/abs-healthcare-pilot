# J-00 — Tenant Onboarding and Operational User Management

**UAT date:** 2026-08-02  
**Tenant:** Doctors Point Diagnostic Center (`DPDC`)  
**Branch:** Doctors Point Diagnostic Center – Bhola Main Branch (`BR-BHL-01`)  
**Evidence:** [34-screen browser index](evidence/J-00-User-Management/README.md)

## English tutorial

### Objective and result

This journey proves that a tenant administrator can enter the correct tenant and branch, verify company/branch/department configuration, manage roles and operational users, maintain doctors and published schedules, and reach the readiness gate. Live browser UAT passed the core lifecycle: a dedicated account was edited, deactivated, denied login, reset, reactivated, and successfully signed in. A Reception user was denied the tenant user-management route and redirected to `/dashboard?error=insufficient-permission`.

The final readiness engine reported **100%**, **READY_FOR_FIRST_PATIENT**, and `Can declare: true`. It read 1 branch, 24 active departments, 19 active users covering the required roles, 3 doctors (1 verifying and 2 with published schedules), 15 ready services, 21 reference ranges, 4 mapped analyzers, 4 connected LIS analyzers, enabled patient portal controls, and notification policy.

### 1. Tenant administrator sign-in

1. Open the staff sign-in page.
2. Select **Doctors Point Diagnostic Center (DPDC)**.
3. Select **Doctors Point Diagnostic Center – Bhola Main Branch (BR-BHL-01)**.
4. Enter the tenant administrator credentials and sign in.
5. Confirm the banner shows tenant `DPDC`, branch `BR-BHL-01`, username `dp.tenant.admin`, and role **Tenant Administrator**.

Evidence: screens 01–02. Passwords are intentionally excluded from screenshots and this guide.

### 2. Company, branch, and departments

Open the Company Profile and confirm legal/contact details and the reporting/invoice branding fields are populated. Open Branch Management and confirm Bhola Main is active and is the tenant’s configured branch. Review Departments and confirm the operational areas are represented, including Reception, Billing/Cash, Sample Collection/Phlebotomy, Haematology, Biochemistry, Hormone/Immunoassay, Electrolyte, Clinical Pathology, Report Entry, Verification, and Report Delivery.

Evidence: screens 03–09. These screens verify saved DPDC configuration; this UAT did not create or modify production-like tenant, branch, or department records.

### 3. Roles and permissions

Open **Roles & Permissions** and verify the role catalogue and permission surface. The relevant operational roles include Tenant Administrator, Reception User, Billing User, Cash Collection User, Sample Collection User, section-specific laboratory technicians, Report Entry User, Report Verification Doctor, and Report Delivery User.

Separation-of-duty checks passed: Reception can view registration but cannot manage users; Tenant Administrator can manage users but cannot clinically verify or release a result; Report Delivery can authorize release but cannot verify; Branch Administrator can maintain schedules but cannot manage tenant users.

Evidence: screens 10–11; automated RBAC verification: **16/16 PASS**.

### 4. Create and assign users

Open **User Management → Create User**. Enter username, email, phone, temporary password, primary role, department, and primary branch. Keep **Force password change on next login** enabled for a new account. Save and confirm the user appears in the tenant-scoped list.

The operational user list already contained the required DPDC accounts: `dp.reception`, `dp.billing`, `dp.collection`, laboratory section users, `dp.report.entry`, `dp.verify.doctor`, and `dp.report.delivery`. To avoid altering production-like users, lifecycle testing used only `dp.uat.user.mgmt`, assigned to Reception and `BR-BHL-01`.

Evidence: screens 12–20.

### 5. Edit, deactivate, reset, and reactivate

Open the dedicated user’s edit page. The visible controls allow primary role, primary branch, status, force-password-change, and password reset. Set status to **Inactive** and save; login must be rejected with a generic message that does not disclose account status. Invoke **Reset password**, return status to **Active**, save, and confirm the user can sign in.

The active Reception account was then sent directly to `/settings/users`; the application redirected it to `/dashboard?error=insufficient-permission`. This proves route-level enforcement in addition to menu hiding.

Evidence: screens 21–25.

Limitations: department cannot be edited on the user edit page; DPDC has only one branch, so cross-branch reassignment was not exercised; the password-reset action has no visible success receipt/audit reference on the edit page.

### 6. Doctors and schedules

Open **Doctors** and verify 3 active doctors, including 1 verification doctor. Open **Doctor Schedules** and verify published schedules. A published doctor must be available in appointment booking. Existing clinical records were inspected only; no doctor or schedule was created or changed during this UAT.

Evidence: screens 26–31.

### 7. Operational readiness

Open **Operational Readiness** and confirm every rule is green. The dashboard must show **100%** and **READY FOR FIRST PATIENT**. The database verifier independently calculated the same state and confirmed the readiness engine and RBAC wiring.

Evidence: screens 32–34; `npm run verify:mod00`: **PASS**.

### 8. Operator checklist

- Tenant and branch context are correct before any setup action.
- Company branding and contact fields are complete.
- Exactly the intended branch is active/default.
- Required operational departments and roles exist.
- Every staff account has a least-privilege role and active branch assignment.
- New users must change the temporary password.
- Inactive users cannot sign in.
- Operational users cannot open tenant administration routes.
- Verification doctor and published schedule exist.
- Readiness is 100% before first-patient declaration.
- Never share or capture passwords in screenshots or documents.

## বাংলা টিউটোরিয়াল

### উদ্দেশ্য ও ফলাফল

এই যাত্রায় প্রমাণ করা হয়েছে যে Tenant Administrator সঠিক tenant ও branch নির্বাচন করে company, branch, department, role, operational user, doctor, published schedule এবং readiness যাচাই করতে পারেন। Browser UAT-এ dedicated test account edit, deactivate, login deny, password reset, reactivate এবং সফল login করা হয়েছে। Reception role-এর user `/settings/users` খুলতে গেলে system তাকে `/dashboard?error=insufficient-permission`-এ পাঠিয়েছে।

Readiness engine-এর চূড়ান্ত ফল **100%**, **READY_FOR_FIRST_PATIENT**, এবং `Can declare: true`। যাচাইকৃত উপাদান: ১টি branch, ২৪টি active department, প্রয়োজনীয় role-সহ ১৯টি active user, ৩ জন doctor (১ জন verifier, ২ জনের published schedule), ১৫টি ready service, ২১টি reference range, ৪টি mapped analyzer, ৪টি connected LIS analyzer, enabled patient portal এবং notification policy।

### ১. Tenant Administrator login

Staff sign-in page-এ tenant হিসেবে **Doctors Point Diagnostic Center (DPDC)** এবং branch হিসেবে **Bhola Main Branch (BR-BHL-01)** নির্বাচন করুন। Tenant admin credential দিয়ে login করে banner-এ tenant, branch, username `dp.tenant.admin` এবং **Tenant Administrator** role নিশ্চিত করুন। Evidence: screen 01–02। Password screenshot বা document-এ রাখা হয়নি।

### ২. Company, branch ও department

Company Profile-এ contact ও branding field পূর্ণ আছে কিনা দেখুন। Branch Management-এ Bhola Main active কিনা যাচাই করুন। Departments-এ Reception, Billing/Cash, Sample Collection, Haematology, Biochemistry, Hormone, Electrolyte, Clinical Pathology, Report Entry, Verification ও Report Delivery area আছে কিনা নিশ্চিত করুন। Evidence: screen 03–09। Existing DPDC record শুধু verify করা হয়েছে; পরিবর্তন করা হয়নি।

### ৩. Role ও permission

Roles & Permissions-এ operational role ও permission matrix দেখুন। Reception user registration দেখতে পারে কিন্তু user manage করতে পারে না। Tenant Administrator user manage করতে পারে কিন্তু clinical verification বা release করতে পারে না। Report Delivery user release করতে পারে কিন্তু verify করতে পারে না। Automated RBAC result **16/16 PASS**। Evidence: screen 10–11।

### ৪. User তৈরি ও assignment

User Management → Create User খুলে username, email, phone, temporary password, primary role, department ও branch দিন। নতুন account-এর জন্য **Force password change on next login** চালু রাখুন। Existing DPDC operational user-গুলো পরিবর্তন না করে lifecycle test-এর জন্য `dp.uat.user.mgmt` ব্যবহার করা হয়েছে। Evidence: screen 12–20।

### ৫. Edit, deactivate, reset ও reactivate

Dedicated test user-এর edit page-এ role, branch, status, force-password-change ও reset-password control যাচাই করুন। Status **Inactive** করে save করলে login generic invalid-credentials message দিয়ে reject হতে হবে। Password reset control চালিয়ে status আবার **Active** করুন এবং login সফল কিনা দেখুন। Reception account দিয়ে tenant user-management route খোলার চেষ্টা করলে access deny হতে হবে। Evidence: screen 21–25।

সীমাবদ্ধতা: edit page-এ department পরিবর্তনের control নেই; DPDC-তে একটিই branch থাকায় cross-branch reassignment করা যায়নি; reset action-এর visible success receipt বা audit reference নেই।

### ৬. Doctor ও schedule

Doctors page-এ ৩ জন active doctor এবং ১ জন verification doctor নিশ্চিত করুন। Doctor Schedules-এ published schedule দেখুন এবং appointment booking-এ doctor available কিনা যাচাই করুন। Existing clinical record পরিবর্তন করা হয়নি। Evidence: screen 26–31।

### ৭. Readiness

Operational Readiness page-এ সব rule green, score **100%**, এবং **READY FOR FIRST PATIENT** আছে কিনা দেখুন। Database verifier একই ফল দিয়েছে। Evidence: screen 32–34; `npm run verify:mod00`: **PASS**।

### ৮. Operator checklist

- Setup-এর আগে tenant ও branch context মিলিয়ে নিন।
- Company contact ও branding সম্পূর্ণ রাখুন।
- Required department, role ও user নিশ্চিত করুন।
- প্রত্যেক user-কে least-privilege role ও active branch দিন।
- নতুন user-এর temporary password পরিবর্তন বাধ্যতামূলক করুন।
- Inactive user login করতে পারবে না।
- Operational user tenant administration route খুলতে পারবে না।
- Verification doctor ও published schedule থাকতে হবে।
- First patient-এর আগে readiness 100% হতে হবে।
- Password কখনও screenshot বা document-এ রাখবেন না।

## Verification record

| Check | Result |
|---|---|
| Browser screenshots | 34/34 captured |
| User deactivate → login denied | PASS |
| User reactivate → login succeeds | PASS |
| Reception user → `/settings/users` | DENIED, redirected with `insufficient-permission` |
| `npm run verify:mod00` | PASS — 100%, READY_FOR_FIRST_PATIENT |
| `npm run verify:mod02` | PASS — 16/16 |
| `npm run verify:mod07` | PASS |
| `npm run verify:dpdc` | PASS |

## Host grant prerequisite

Host tenant creation now auto-provisions the Tenant Admin permission bundle, operational roles, default branch, and suggested departments. Host **Tenant Administrator Access** remains available to customize grants, but is no longer required before Tenant Admin can manage users or prepare go-live. Evidence for the independent new-tenant path lives under `docs/Business-Journey/evidence/J-00-Tenant-Admin-User-Management/`.
