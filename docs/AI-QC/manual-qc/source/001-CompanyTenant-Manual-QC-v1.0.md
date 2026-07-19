# ABSHealthcareLite Manual Quality Control and UAT Guide
## MOD-01 - Company / Tenant Management

| Document control | Value |
|---|---|
| Document version | 1.0 |
| Prepared date | 19 July 2026 |
| Prepared by | ABSHealthcareLite Development / AI QC Handoff |
| Environment | QC Docker (non-production) |
| Intended audience | Independent QC engineers and UAT representatives |
| Classification | Internal QC / UAT working document |

> **Credential handling:** All passwords are **Provided separately through secure channel**. Do not record passwords in this guide, screenshots, defect reports, chat, or test evidence.

---

## 1. Purpose, scope, and reference baseline

This guide defines repeatable manual QC and UAT for MOD-01 Company / Tenant Management. It verifies host administration, tenant isolation, tenant lifecycle, onboarding, branches, subscriptions, settings, auditability, security, database integrity, and user experience.

### 1.1 In scope

- Host authentication at `/host/login` and tenant authentication at `/login`.
- Tenant CRUD, search, filtering, paging, status transitions, and onboarding.
- Tenant administration of branches, subscriptions, modules, usage limits, and settings.
- Audit trail, authorization boundaries, API validation, and PostgreSQL read-only checks.
- Responsive usability and observation-level performance checks.

### 1.2 Out of scope

- Production deployment, real payment collection, disaster recovery, and load/stress testing.
- Clinical workflows not reached through the MOD-01 tenant-management surface.
- Any destructive database operation, schema migration, or write SQL by QC.

### 1.3 Required reference documents

1. AI QC foundation report: `docs/AI-QC/reports/001-Foundation.md`
2. Re-QC report: `001-Foundation-ReQC-01.md` — **AI Re-QC PASS 24/30**
3. QC environment guide: `docs/QC/ABSHealthcareLite-Pilot-Docker-QC-Guide.md`

> **Bangla explanation (বাংলা):** Re-QC PASS 24/30 is a useful baseline, not a replacement for this manual test cycle. Every manual case in this guide must be executed and evidenced independently.

---

## 2. QC environment and access

| Item | QC value |
|---|---|
| Application URL | `http://192.168.2.44:3000` |
| Reusable URL pattern | `http://<QC_HOST>:3000` |
| Health endpoint | `GET /api/health` |
| Host login route | `/host/login` |
| Tenant login route | `/login` |
| Host administrator | `admin.abs` |
| Tenant administrator | `laila.hasan` |
| App container | `abs-healthcare-pilot-app` |
| Database container | `abs-healthcare-pilot-db` |
| Compose database service | `postgres` (`postgres:16-alpine`) |
| Compose application service | `app` (from `Dockerfile`) |
| Database | `abs_healthcare_pilot` |
| PostgreSQL user | `abshealthcare` |
| Credentials | Provided separately through secure channel |

### 2.1 Pre-test environment check

1. Open `http://<QC_HOST>:3000/api/health` and capture the response.
2. Confirm that the app can reach PostgreSQL and no maintenance/error page is displayed.
3. Confirm the assigned browser uses a clean profile or a documented isolated profile.
4. Confirm the test date/time and tester identity in the execution log.
5. Confirm that only QC tenants are changed.

> **Bangla explanation (বাংলা):** Test শুরু করার আগে health endpoint এবং database connectivity যাচাই করুন। Shared QC environment-এ অন্য tester-এর data পরিবর্তন করবেন না; নিজস্ব test code ব্যবহার করুন।

---

## 3. Test data, roles, and execution rules

### 3.1 Naming convention

| Data item | Convention / example |
|---|---|
| Tenant code | `QC01-YYYYMMDD-HHMM` |
| Tenant name | `MOD01 QC Tenant` |
| Branch code | `QC-BR-01` |
| Unique suffix | Current execution timestamp, for example `20260719-1958` |
| Host user | `admin.abs` |
| Tenant administrator | `laila.hasan` |

Use a new timestamp suffix for each run. Record every generated tenant ID and code in the test execution log.

### 3.2 Roles

| Role | Purpose |
|---|---|
| Host Admin | Creates, edits, activates, suspends, and reviews tenants |
| Tenant Admin | Manages the assigned tenant only |
| Unauthorized / Anonymous | Validates login and access rejection |
| Database Observer | Runs approved read-only SQL only |

### 3.3 Execution rules

1. Execute cases in ID order unless a stated dependency requires otherwise.
2. Do not reuse an earlier test's authenticated browser session for isolation tests.
3. Set **Actual Result**, **Status**, **Evidence**, and **Tester Remarks** during execution.
4. Use `PASS`, `FAIL`, `BLOCKED`, `NOT APPLICABLE`, or `NOT RUN`; initial status is `NOT RUN`.
5. Stop a destructive or privacy-risking action and raise a defect if it reaches real data.

> **Bangla explanation (বাংলা):** প্রতিটি test case-এ Actual Result এবং evidence পূরণ বাধ্যতামূলক। FAIL হলে পরের dependent test চালানোর আগে defect ID লিখুন।

---

## 4. Test case record convention

Every row below is an individual test case. The following fields apply to **each row**:

| Field | Completion instruction |
|---|---|
| Test Case ID | Immutable identifier with prefix `MOD01-` |
| Title | Case name |
| Objective | Verification goal |
| Role | Logged-in role or Anonymous |
| Preconditions | State required before execution |
| Test Data | Exact data or convention to use |
| Steps | Ordered action summary; expand in evidence notes if necessary |
| Expected Result | Pass condition |
| Actual Result | ______________________________ |
| Status | `NOT RUN` |
| Severity if failed | `Critical`, `High`, `Medium`, or `Low` |
| Screenshot/Evidence reference | ______________________________ |
| Tester remarks | ______________________________ |

For compact PDF layout, tables use these abbreviations: **Pre** = Preconditions, **Data** = Test Data, **Exp** = Expected Result, **Act** = Actual Result, **Ev** = Screenshot/Evidence reference, **Remarks** = Tester remarks.

---

## 5. Authentication test cases

| Test Case ID | Title / Objective | Role | Pre | Data | Steps | Exp | Act | Status | Severity if failed | Ev | Remarks |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MOD01-AUTH-001 | Host login accepts valid credentials | Anonymous | Host account active | `admin.abs`; password separately | Open `/host/login`; submit valid credentials | Host dashboard opens; authenticated session created |  | NOT RUN | Critical |  |  |
| MOD01-AUTH-002 | Host login rejects invalid password | Anonymous | Login page open | `admin.abs`; invalid password | Submit invalid password | No login; safe generic error; no password disclosure |  | NOT RUN | High |  |  |
| MOD01-AUTH-003 | Host login rejects unknown username | Anonymous | Login page open | Unknown username | Submit credentials | No login; generic error; audit/security behavior as designed |  | NOT RUN | High |  |  |
| MOD01-AUTH-004 | Host login requires username | Anonymous | Login page open | Blank username | Submit without username | Client/server validation shown; request not authenticated |  | NOT RUN | Medium |  |  |
| MOD01-AUTH-005 | Host login requires password | Anonymous | Login page open | Blank password | Submit without password | Validation shown; password field remains masked |  | NOT RUN | Medium |  |  |
| MOD01-AUTH-006 | Tenant login accepts tenant admin | Anonymous | Tenant account active | `laila.hasan`; password separately | Open `/login`; submit valid credentials | Tenant landing page opens for assigned tenant |  | NOT RUN | Critical |  |  |
| MOD01-AUTH-007 | Tenant login rejects host credentials | Anonymous | Tenant login open | Host credentials | Submit host account at `/login` | Access rejected or safely routed per design; no tenant context |  | NOT RUN | High |  |  |
| MOD01-AUTH-008 | Host login rejects tenant credentials | Anonymous | Host login open | Tenant credentials | Submit tenant account at `/host/login` | Access rejected; no host dashboard |  | NOT RUN | High |  |  |
| MOD01-AUTH-009 | Password input is masked | Anonymous | Either login open | Any value | Type into password field | Characters are obscured; no value shown in UI |  | NOT RUN | Medium |  |  |
| MOD01-AUTH-010 | Logout terminates session | Host Admin | Host logged in | None | Logout; use browser Back; revisit protected route | Protected route requires login; cached sensitive content unavailable |  | NOT RUN | High |  |  |
| MOD01-AUTH-011 | Session survives normal navigation | Tenant Admin | Tenant logged in | None | Navigate between permitted tenant pages | Session remains valid; correct tenant context remains visible |  | NOT RUN | Medium |  |  |
| MOD01-AUTH-012 | Direct protected route redirects anonymous user | Anonymous | Clean browser session | Protected host and tenant URLs | Paste protected URLs | Redirect to correct login; intended target handled safely |  | NOT RUN | High |  |  |

## 6. Session isolation test cases

> **Bangla explanation (বাংলা):** Tenant isolation হলো MOD-01-এর প্রধান নিরাপত্তা শর্ত। Tenant A-এর URL, ID, cookie বা API request বদলে Tenant B-এর data দেখা বা পরিবর্তন করা যাবে না।

| Test Case ID | Title / Objective | Role | Pre | Data | Steps | Exp | Act | Status | Severity if failed | Ev | Remarks |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MOD01-ISO-001 | Tenant Admin sees only own tenant | Tenant Admin | Two QC tenants exist | Tenant A and B | Login as A; view tenant pages | Only Tenant A name, branches, modules, and settings appear |  | NOT RUN | Critical |  |  |
| MOD01-ISO-002 | Tenant URL ID tampering is denied | Tenant Admin | Tenant A logged in | Tenant B ID | Replace route/query ID with B ID | Denied/redirected; no B data exposed |  | NOT RUN | Critical |  |  |
| MOD01-ISO-003 | Tenant API ID tampering is denied | Tenant Admin | Browser DevTools permitted | Tenant B ID | Replay permitted request with B identifier | 403/404 or equivalent; no B response |  | NOT RUN | Critical |  |  |
| MOD01-ISO-004 | Host session cannot be mistaken for tenant session | Host Admin | Host logged in | Tenant URL | Visit tenant-only route | Correct authorization behavior; no accidental tenant impersonation |  | NOT RUN | High |  |  |
| MOD01-ISO-005 | Parallel tenant browser sessions remain separate | Tenant Admin | Separate browser profiles | Tenant A/B credentials | Login A and B in separate profiles; navigate | Each profile retains only its own context |  | NOT RUN | Critical |  |  |
| MOD01-ISO-006 | Logout clears tenant context | Tenant Admin | Tenant A logged in | None | Logout; login as B in same browser | No A data, menu state, or cached form data leaks to B |  | NOT RUN | High |  |  |
| MOD01-ISO-007 | Cross-tenant branch access is denied | Tenant Admin | Branch exists under B | B branch ID | Attempt direct B branch URL/API as A | Access denied; no update possible |  | NOT RUN | Critical |  |  |

## 7. Tenant list test cases

| Test Case ID | Title / Objective | Role | Pre | Data | Steps | Exp | Act | Status | Severity if failed | Ev | Remarks |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MOD01-LIST-001 | Open tenant list | Host Admin | Logged in | None | Open Company/Tenant list | List loads without error and shows permitted tenants |  | NOT RUN | High |  |  |
| MOD01-LIST-002 | List shows required columns | Host Admin | List loaded | None | Inspect headers and a row | Name/code/status and designed management fields are legible |  | NOT RUN | Medium |  |  |
| MOD01-LIST-003 | Search by exact tenant code | Host Admin | QC tenant exists | `QC01-YYYYMMDD-HHMM` | Search exact code | Matching tenant returned; unrelated rows excluded |  | NOT RUN | Medium |  |  |
| MOD01-LIST-004 | Search by partial tenant name | Host Admin | QC tenant exists | `MOD01 QC` | Search partial name | Expected matching rows returned |  | NOT RUN | Medium |  |  |
| MOD01-LIST-005 | Search handles no result | Host Admin | List loaded | Unique absent text | Search absent text | Clear empty-state message; no error |  | NOT RUN | Low |  |  |
| MOD01-LIST-006 | Status filter works | Host Admin | Active and suspended examples exist | Status value | Filter by status | Only selected status is shown |  | NOT RUN | Medium |  |  |
| MOD01-LIST-007 | Paging preserves valid result set | Host Admin | Enough records for paging | Page size/default | Change page or next page | Correct records/page state; no duplicate/omitted visible rows |  | NOT RUN | Medium |  |  |
| MOD01-LIST-008 | Open tenant details from list | Host Admin | QC tenant listed | QC tenant | Select row/action | Correct tenant detail page opens |  | NOT RUN | High |  |  |

## 8. Tenant create test cases

> **Bangla explanation (বাংলা):** Create test চলাকালে tenant code অবশ্যই unique হতে হবে। একই code দিয়ে second create করলে duplicate record বা partial onboarding তৈরি হওয়া গ্রহণযোগ্য নয়।

| Test Case ID | Title / Objective | Role | Pre | Data | Steps | Exp | Act | Status | Severity if failed | Ev | Remarks |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MOD01-CREATE-001 | Open create tenant form | Host Admin | Logged in | None | Choose Create Tenant | Form opens with clear required markers |  | NOT RUN | Medium |  |  |
| MOD01-CREATE-002 | Create valid minimal tenant | Host Admin | Form open | Unique code; name | Complete mandatory fields; save | One tenant created; success confirmation shown |  | NOT RUN | Critical |  |  |
| MOD01-CREATE-003 | Create valid full tenant | Host Admin | Form open | Name, code, contact, package | Complete all supported fields; save | Values persist accurately in details/list |  | NOT RUN | High |  |  |
| MOD01-CREATE-004 | Tenant code is required | Host Admin | Form open | Blank code | Complete other fields; save | Validation prevents save |  | NOT RUN | High |  |  |
| MOD01-CREATE-005 | Tenant name is required | Host Admin | Form open | Blank name | Complete other fields; save | Validation prevents save |  | NOT RUN | High |  |  |
| MOD01-CREATE-006 | Duplicate tenant code rejected | Host Admin | Existing QC code | Existing code | Create second tenant with same code | Clear duplicate validation; no duplicate row/DB record |  | NOT RUN | Critical |  |  |
| MOD01-CREATE-007 | Leading/trailing spaces handled | Host Admin | Form open | Spaced name/code | Save with spaces around values | Safe trim or explicit validation; no ambiguous duplicate |  | NOT RUN | Medium |  |  |
| MOD01-CREATE-008 | Invalid code characters handled | Host Admin | Form open | Unsupported symbols | Save invalid code | Validation message; no malformed tenant created |  | NOT RUN | Medium |  |  |
| MOD01-CREATE-009 | Maximum field length handled | Host Admin | Form open | Boundary-length name/code | Submit at and above limit | Boundary accepted if valid; overflow rejected safely |  | NOT RUN | Medium |  |  |
| MOD01-CREATE-010 | Cancel does not create tenant | Host Admin | Populated unsaved form | Unique code | Click Cancel/Back; confirm leave if prompted | No tenant or onboarding artifacts created |  | NOT RUN | Medium |  |  |
| MOD01-CREATE-011 | Double submit is idempotent | Host Admin | Form valid | Unique code | Rapidly click Save / submit twice | One tenant created; UI prevents duplicate action |  | NOT RUN | Critical |  |  |
| MOD01-CREATE-012 | Create produces audit entry | Host Admin | Valid creation completed | New tenant code | Review audit history | Creation actor/time/entity/action recorded |  | NOT RUN | High |  |  |

## 9. Tenant edit test cases

| Test Case ID | Title / Objective | Role | Pre | Data | Steps | Exp | Act | Status | Severity if failed | Ev | Remarks |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MOD01-EDIT-001 | Edit tenant display name | Host Admin | Existing active QC tenant | Revised name | Edit and save | New name persists in detail and list |  | NOT RUN | High |  |  |
| MOD01-EDIT-002 | Edit permitted contact details | Host Admin | Existing tenant | Valid contact data | Edit permitted fields; save | Accurate persistence and display |  | NOT RUN | Medium |  |  |
| MOD01-EDIT-003 | Required field cannot be cleared | Host Admin | Edit form open | Blank required value | Clear and save | Validation prevents invalid state |  | NOT RUN | High |  |  |
| MOD01-EDIT-004 | Duplicate code edit rejected | Host Admin | Two QC tenants | Other tenant code | Change code to existing code | Rejected; original data remains intact |  | NOT RUN | Critical |  |  |
| MOD01-EDIT-005 | Cancel edit preserves saved values | Host Admin | Existing tenant | Unsaved change | Change; cancel/back | Persisted values remain unchanged |  | NOT RUN | Medium |  |  |
| MOD01-EDIT-006 | Edit produces audit and status history appropriately | Host Admin | Existing tenant | Revised value | Save edit; inspect history | Audit captures change; status history only changes when status changes |  | NOT RUN | High |  |  |

## 10. Onboarding test cases

| Test Case ID | Title / Objective | Role | Pre | Data | Steps | Exp | Act | Status | Severity if failed | Ev | Remarks |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MOD01-ONB-001 | Start onboarding for new tenant | Host Admin | Newly created tenant | QC tenant | Open onboarding action | Guided onboarding state opens for correct tenant |  | NOT RUN | High |  |  |
| MOD01-ONB-002 | Create initial branch | Host Admin | Onboarding active | `QC-BR-01` | Enter initial branch details | Branch is created and tied to tenant |  | NOT RUN | Critical |  |  |
| MOD01-ONB-003 | Select subscription package | Host Admin | Package available | Valid package | Select package; continue | Package selection persists |  | NOT RUN | High |  |  |
| MOD01-ONB-004 | Set tenant modules | Host Admin | Onboarding active | Enabled module set | Select approved modules | Module settings persist for tenant only |  | NOT RUN | High |  |  |
| MOD01-ONB-005 | Set usage limits | Host Admin | Onboarding active | Valid limits | Enter limits; continue | Limits validate and persist |  | NOT RUN | High |  |  |
| MOD01-ONB-006 | Mandatory onboarding step enforced | Host Admin | Step incomplete | Omit required value | Continue/finish | Cannot complete until requirement satisfied |  | NOT RUN | High |  |  |
| MOD01-ONB-007 | Invalid branch data is rejected | Host Admin | Branch step open | Invalid/blank branch code | Continue | Validation prevents invalid branch creation |  | NOT RUN | Medium |  |  |
| MOD01-ONB-008 | Back navigation retains entered values | Host Admin | Multiple steps entered | Valid draft values | Go Back then Next | Values retained unless intentionally changed |  | NOT RUN | Medium |  |  |
| MOD01-ONB-009 | Refresh/resume onboarding is safe | Host Admin | Incomplete onboarding | Existing draft | Refresh or reopen tenant | State is recoverable; no duplicate artifacts |  | NOT RUN | High |  |  |
| MOD01-ONB-010 | Complete onboarding activates usable setup | Host Admin | All valid steps complete | QC tenant | Finish onboarding; login/inspect | Expected tenant, branch, package, modules, limits available |  | NOT RUN | Critical |  |  |

## 11. Status lifecycle test cases

| Test Case ID | Title / Objective | Role | Pre | Data | Steps | Exp | Act | Status | Severity if failed | Ev | Remarks |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MOD01-STATUS-001 | View initial tenant status | Host Admin | New tenant exists | QC tenant | Open details | Status displayed consistently with lifecycle state |  | NOT RUN | Medium |  |  |
| MOD01-STATUS-002 | Activate eligible tenant | Host Admin | Valid configured tenant | QC tenant | Select Activate; confirm | Status changes to Active and is persisted |  | NOT RUN | Critical |  |  |
| MOD01-STATUS-003 | Suspend active tenant | Host Admin | Active QC tenant | Reason if required | Select Suspend; confirm | Status becomes Suspended; access follows policy |  | NOT RUN | Critical |  |  |
| MOD01-STATUS-004 | Suspended tenant login follows policy | Tenant Admin | Tenant suspended | Tenant credentials | Attempt `/login` | Login/access blocked or restricted per approved policy |  | NOT RUN | Critical |  |  |
| MOD01-STATUS-005 | Reactivate suspended tenant | Host Admin | Suspended tenant | QC tenant | Select Activate/reactivate | Tenant returns to correct usable state |  | NOT RUN | Critical |  |  |
| MOD01-STATUS-006 | Invalid lifecycle transition denied | Host Admin | Tenant in state with invalid target | Target status | Attempt invalid transition | Action unavailable or denied without data damage |  | NOT RUN | High |  |  |
| MOD01-STATUS-007 | Status change creates history | Host Admin | Transition completed | QC tenant | Inspect status history | From/to status, actor, timestamp, and reason captured if supported |  | NOT RUN | High |  |  |
| MOD01-STATUS-008 | Status change creates audit event | Host Admin | Transition completed | QC tenant | Inspect audit log | Traceable status action recorded |  | NOT RUN | High |  |  |

## 12. Branch test cases

| Test Case ID | Title / Objective | Role | Pre | Data | Steps | Exp | Act | Status | Severity if failed | Ev | Remarks |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MOD01-BRANCH-001 | View branch list | Tenant Admin | Tenant logged in | None | Open Branches | Own tenant branches load correctly |  | NOT RUN | High |  |  |
| MOD01-BRANCH-002 | Create valid branch | Tenant Admin | Branch permission available | `QC-BR-01` | Create branch with valid fields | Branch created under current tenant |  | NOT RUN | High |  |  |
| MOD01-BRANCH-003 | Branch code required | Tenant Admin | Create form open | Blank code | Save | Validation prevents save |  | NOT RUN | Medium |  |  |
| MOD01-BRANCH-004 | Branch name required | Tenant Admin | Create form open | Blank name | Save | Validation prevents save |  | NOT RUN | Medium |  |  |
| MOD01-BRANCH-005 | Duplicate branch code rejected | Tenant Admin | Existing branch | Existing `QC-BR-01` | Create same code | Duplicate rejected within tenant scope |  | NOT RUN | High |  |  |
| MOD01-BRANCH-006 | Edit branch details | Tenant Admin | Existing branch | Revised name | Edit and save | Revised permitted fields persist |  | NOT RUN | Medium |  |  |
| MOD01-BRANCH-007 | Cancel branch edit | Tenant Admin | Existing branch | Unsaved change | Edit; cancel | No unsaved change persists |  | NOT RUN | Low |  |  |
| MOD01-BRANCH-008 | Deactivate/active branch lifecycle | Tenant Admin | Existing active branch | Branch | Change branch status if supported | State persists and UI/access follows policy |  | NOT RUN | High |  |  |
| MOD01-BRANCH-009 | Branch cannot cross tenant boundary | Tenant Admin | Tenant A/B branches exist | B branch ID | Tamper direct URL/API | B branch not viewed or changed |  | NOT RUN | Critical |  |  |
| MOD01-BRANCH-010 | Branch action writes audit trail | Tenant Admin | Branch change complete | Branch | Review audit data | Action is attributable and tenant-scoped |  | NOT RUN | High |  |  |

## 13. Subscription test cases

| Test Case ID | Title / Objective | Role | Pre | Data | Steps | Exp | Act | Status | Severity if failed | Ev | Remarks |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MOD01-SUB-001 | View available subscription packages | Host Admin | Packages seeded | None | Open package/subscription view | Available packages are listed accurately |  | NOT RUN | Medium |  |  |
| MOD01-SUB-002 | Assign valid package | Host Admin | Active tenant; package exists | Valid package | Assign package; save | Tenant subscription created/updated |  | NOT RUN | Critical |  |  |
| MOD01-SUB-003 | Subscription dates validate | Host Admin | Assignment form open | End before start | Save invalid dates | Validation prevents invalid period |  | NOT RUN | High |  |  |
| MOD01-SUB-004 | Required package selection enforced | Host Admin | Assignment form open | No package | Save | Validation shown; no partial subscription |  | NOT RUN | High |  |  |
| MOD01-SUB-005 | Change package records effective result | Host Admin | Existing subscription | Different package | Change package | Correct current/effective subscription displayed |  | NOT RUN | High |  |  |
| MOD01-SUB-006 | Enabled modules follow configuration | Host Admin | Subscription assigned | Module set | View/manage modules | Tenant module records reflect intended selection |  | NOT RUN | High |  |  |
| MOD01-SUB-007 | Usage limits accept valid boundary | Host Admin | Limits view open | Valid min/max | Save limits | Values persist and are displayed consistently |  | NOT RUN | High |  |  |
| MOD01-SUB-008 | Negative/invalid usage limit rejected | Host Admin | Limits view open | Negative/text value | Save | Validation prevents invalid numeric value |  | NOT RUN | High |  |  |
| MOD01-SUB-009 | Expired subscription behavior visible | Host Admin | Controlled expired QC subscription | Expired date | Open tenant/access view | Expiry status and restrictions follow policy |  | NOT RUN | Critical |  |  |
| MOD01-SUB-010 | Subscription change audited | Host Admin | Change completed | QC tenant | Inspect audit log | Package/modules/limits action traceable |  | NOT RUN | High |  |  |

## 14. Settings test cases

| Test Case ID | Title / Objective | Role | Pre | Data | Steps | Exp | Act | Status | Severity if failed | Ev | Remarks |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MOD01-SET-001 | Open tenant settings | Tenant Admin | Tenant logged in | None | Open Settings | Correct tenant settings load |  | NOT RUN | High |  |  |
| MOD01-SET-002 | Save valid tenant setting | Tenant Admin | Settings open | Valid value | Change supported setting; save | Value persists after refresh |  | NOT RUN | High |  |  |
| MOD01-SET-003 | Required setting validation | Tenant Admin | Settings open | Blank required value | Save | Validation shown; old value retained |  | NOT RUN | Medium |  |  |
| MOD01-SET-004 | Invalid format validation | Tenant Admin | Settings open | Invalid supported format | Save | Field-level safe validation shown |  | NOT RUN | Medium |  |  |
| MOD01-SET-005 | Cancel preserves setting | Tenant Admin | Settings open | Unsaved value | Change; cancel | Saved setting remains unchanged |  | NOT RUN | Low |  |  |
| MOD01-SET-006 | Settings are tenant isolated | Tenant Admin | Tenant A/B exist | Tenant A setting | Change A; inspect B | B setting unaffected |  | NOT RUN | Critical |  |  |
| MOD01-SET-007 | Unauthorized setting route denied | Anonymous | Clean session | Settings URL | Paste protected settings URL | Login/authorization barrier applied |  | NOT RUN | High |  |  |
| MOD01-SET-008 | Setting change audited | Tenant Admin | Setting saved | Changed value | Inspect audit trail | Actor, time, target, and action recorded |  | NOT RUN | High |  |  |

## 15. Audit test cases

| Test Case ID | Title / Objective | Role | Pre | Data | Steps | Exp | Act | Status | Severity if failed | Ev | Remarks |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MOD01-AUDIT-001 | Audit list opens for authorized role | Host Admin | Logged in | None | Open audit view | Audit records load without exposure beyond role |  | NOT RUN | High |  |  |
| MOD01-AUDIT-002 | Tenant creation audit exists | Host Admin | Create performed | New tenant | Filter/find create event | Actor/action/entity/time captured |  | NOT RUN | High |  |  |
| MOD01-AUDIT-003 | Tenant edit audit exists | Host Admin | Edit performed | QC tenant | Find edit event | Meaningful change event captured |  | NOT RUN | High |  |  |
| MOD01-AUDIT-004 | Status audit exists | Host Admin | Status change performed | QC tenant | Find status event | Lifecycle event recorded |  | NOT RUN | High |  |  |
| MOD01-AUDIT-005 | Branch creation audit exists | Tenant Admin | Branch create performed | `QC-BR-01` | Find event | Tenant-scoped branch action captured |  | NOT RUN | High |  |  |
| MOD01-AUDIT-006 | Subscription audit exists | Host Admin | Subscription change performed | QC tenant | Find event | Subscription action captured |  | NOT RUN | High |  |  |
| MOD01-AUDIT-007 | Settings audit exists | Tenant Admin | Setting change performed | Setting key | Find event | Setting action captured without secret disclosure |  | NOT RUN | High |  |  |
| MOD01-AUDIT-008 | Audit timestamp is plausible | Host Admin | Events available | Current time | Compare event timestamp | Timestamp/timezone follows configured standard |  | NOT RUN | Medium |  |  |
| MOD01-AUDIT-009 | Audit actor is correct | Host Admin | Event performed by known user | User identity | Compare actor | Actor matches authenticated initiator |  | NOT RUN | High |  |  |
| MOD01-AUDIT-010 | Audit filtering/search works | Host Admin | Multiple events | Entity/action/text | Apply filters/search | Intended records returned without unrelated leak |  | NOT RUN | Medium |  |  |
| MOD01-AUDIT-011 | Tenant user cannot view other tenant audit | Tenant Admin | Tenant A/B data exists | B identifier | Attempt list/URL/API access | No B audit details exposed |  | NOT RUN | Critical |  |  |
| MOD01-AUDIT-012 | Audit is not editable through UI | Host Admin | Audit record visible | Existing record | Look for edit/delete; attempt permitted UI paths | No unauthorized alteration/deletion capability |  | NOT RUN | Critical |  |  |

## 16. Security test cases

> **Bangla explanation (বাংলা):** এই security tests-এ ক্ষতিকর payload ব্যবহার করবেন না। শুধুমাত্র controlled QC account ও harmless validation strings ব্যবহার করুন। Sensitive response, token, password, বা personal data evidence-এ redact করুন।

| Test Case ID | Title / Objective | Role | Pre | Data | Steps | Exp | Act | Status | Severity if failed | Ev | Remarks |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MOD01-SEC-001 | Anonymous host route protection | Anonymous | Clean session | Host route | Open protected host URL | Redirect/deny; no sensitive content |  | NOT RUN | Critical |  |  |
| MOD01-SEC-002 | Anonymous tenant route protection | Anonymous | Clean session | Tenant route | Open protected tenant URL | Redirect/deny; no tenant content |  | NOT RUN | Critical |  |  |
| MOD01-SEC-003 | Host-only action denied to tenant user | Tenant Admin | Tenant logged in | Host action URL | Attempt direct navigation | Access denied; no action executed |  | NOT RUN | Critical |  |  |
| MOD01-SEC-004 | Tenant-only boundary enforced | Tenant Admin | A/B tenants exist | B tenant/branch ID | Tamper route identifier | No cross-tenant read/write |  | NOT RUN | Critical |  |  |
| MOD01-SEC-005 | API rejects missing authentication | Anonymous | API endpoint known | Protected request | Send/replay without session | 401/redirect/safe denial; no data |  | NOT RUN | Critical |  |  |
| MOD01-SEC-006 | API rejects insufficient authorization | Tenant Admin | A logged in | Host/B resource | Request protected resource | 403/404 or safe equivalent |  | NOT RUN | Critical |  |  |
| MOD01-SEC-007 | Login error avoids account enumeration | Anonymous | Login open | Known vs unknown user | Compare invalid-login responses | Response is equivalently safe |  | NOT RUN | High |  |  |
| MOD01-SEC-008 | Password never appears in page/source evidence | Anonymous | Login page | Test credential | Inspect UI/network safely | Password masked; not rendered/logged in plain view |  | NOT RUN | Critical |  |  |
| MOD01-SEC-009 | Input validation handles HTML-like text | Host Admin | Safe disposable field | Harmless markup text | Enter/save/view field | Encoded/displayed safely; no script execution |  | NOT RUN | High |  |  |
| MOD01-SEC-010 | Input validation handles quote characters | Host Admin | Disposable field | Quotes/apostrophes | Enter/save/search | No server error, injection symptom, or corrupted query |  | NOT RUN | High |  |  |
| MOD01-SEC-011 | CSRF-sensitive change behavior checked | Host Admin | Authenticated session | State-changing form | Inspect normal request/submit from app | Change has expected anti-forgery/session safeguards |  | NOT RUN | High |  |  |
| MOD01-SEC-012 | Logout invalidates protected API use | Host Admin | Logged in then logged out | Previous route | Reuse/back/replay normal request | Authorization not retained after logout |  | NOT RUN | High |  |  |
| MOD01-SEC-013 | Error responses do not expose internals | Anonymous | Invalid input route | Invalid ID/payload | Trigger safe validation error | No stack trace, SQL, filesystem, secret, or token disclosed |  | NOT RUN | High |  |  |
| MOD01-SEC-014 | Security headers/cookie attributes observed | Anonymous | Browser DevTools permitted | Login response | Inspect response/cookie metadata | Secure configuration observed per environment capability; record gaps |  | NOT RUN | Medium |  |  |

## 17. Database verification test cases

Only the Database Observer performs these tests. All queries are read-only. Never run `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, DDL, or migration commands during QC.

| Test Case ID | Title / Objective | Role | Pre | Data | Steps | Exp | Act | Status | Severity if failed | Ev | Remarks |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MOD01-DB-001 | Tenant record created | Database Observer | Create completed | `:tenant_code` | Run Q1 | One expected tenant row exists |  | NOT RUN | Critical |  |  |
| MOD01-DB-002 | Branch belongs to tenant | Database Observer | Branch created | `:tenant_id` | Run Q2 | Branch rows carry correct tenant foreign key |  | NOT RUN | Critical |  |  |
| MOD01-DB-003 | Subscription record exists | Database Observer | Subscription assigned | `:tenant_id` | Run Q3 | Expected subscription/package relationship exists |  | NOT RUN | High |  |  |
| MOD01-DB-004 | Tenant modules are scoped | Database Observer | Modules configured | `:tenant_id` | Run Q4 | Module rows match selected configuration |  | NOT RUN | High |  |  |
| MOD01-DB-005 | Usage limits are persisted | Database Observer | Limits saved | `:tenant_id` | Run Q5 | Stored limits match permitted UI values |  | NOT RUN | High |  |  |
| MOD01-DB-006 | User is tenant scoped | Database Observer | Tenant user exists | `:tenant_id` | Run Q6 | User record is associated with expected tenant |  | NOT RUN | Critical |  |  |
| MOD01-DB-007 | Audit record exists | Database Observer | Change performed | `:tenant_id` | Run Q7 | Audit action references expected tenant/event |  | NOT RUN | High |  |  |
| MOD01-DB-008 | Status history is chronological | Database Observer | Status changed | `:tenant_id` | Run Q8 | Status transitions are present in chronological order |  | NOT RUN | High |  |  |
| MOD01-DB-009 | No unexpected duplicate tenant code | Database Observer | Create/duplicate test completed | `:tenant_code` | Run Q9 | Count is exactly one for valid created code |  | NOT RUN | Critical |  |  |

### 17.1 Approved read-only PostgreSQL queries

Connect only to database `abs_healthcare_pilot` with user `abshealthcare`; password is **Provided separately through secure channel**.

```sql
-- Q1: tenant record and status
SELECT id, tenant_code, tenant_name, tenant_status, onboarding_status, created_at, updated_at
FROM tenants
WHERE tenant_code = :tenant_code;

-- Q2: branches scoped to the tested tenant
SELECT id, tenant_id, code, name, status, is_active, created_at
FROM branches
WHERE tenant_id = :tenant_id
ORDER BY created_at;

-- Q3: subscriptions and package reference
SELECT ts.id, ts.tenant_id, ts.package_id, ts.subscription_status,
       ts.subscription_start, ts.subscription_end, ts.billing_cycle,
       sp.package_code, sp.package_name
FROM tenant_subscriptions ts
LEFT JOIN subscription_packages sp ON sp.id = ts.package_id
WHERE ts.tenant_id = :tenant_id AND ts.is_active = true
ORDER BY ts.created_at DESC;

-- Q4: enabled modules for tenant (via module_registry join)
SELECT tm.id, tm.tenant_id, mr.module_code, mr.module_name,
       tm.is_enabled, tm.module_status, tm.created_at
FROM tenant_modules tm
JOIN module_registry mr ON mr.id = tm.module_id
WHERE tm.tenant_id = :tenant_id AND tm.is_active = true
ORDER BY mr.module_code;

-- Q5: tenant usage limits (1:1 row per tenant)
SELECT id, tenant_id, max_branches, max_users, max_orders_per_month,
       max_reports_per_month, max_storage_gb, created_at, updated_at
FROM tenant_usage_limits
WHERE tenant_id = :tenant_id;

-- Q6: users assigned to tested tenant (do not export password_hash)
SELECT id, tenant_id, username, email, user_status, is_host_admin, created_at
FROM users
WHERE tenant_id = :tenant_id AND is_host_admin = false
ORDER BY username;

-- Q7: tenant-related audit events
SELECT id, tenant_id, user_id, action_type, entity_type, entity_id, created_at, created_by
FROM audit_logs
WHERE tenant_id = :tenant_id
ORDER BY created_at DESC
LIMIT 50;

-- Q8: tenant status lifecycle history
SELECT id, tenant_id, entity_type, entity_id, old_status, new_status,
       remarks, changed_by, changed_at
FROM status_histories
WHERE tenant_id = :tenant_id AND entity_type = 'Tenant'
ORDER BY changed_at;

-- Q9: duplicate tenant code check
SELECT tenant_code, COUNT(*) AS tenant_count
FROM tenants
WHERE tenant_code = :tenant_code
GROUP BY tenant_code;

-- Q10: duplicate branch code within tenant
SELECT code, COUNT(*) AS branch_count
FROM branches
WHERE tenant_id = :tenant_id AND code = :branch_code
GROUP BY code;

-- Q11: orphan subscription check (should return zero rows)
SELECT ts.id, ts.tenant_id
FROM tenant_subscriptions ts
LEFT JOIN tenants t ON t.id = ts.tenant_id
WHERE t.id IS NULL;

-- Q12: latest audit entries (host platform or tenant)
SELECT id, tenant_id, action_type, entity_type, created_at, created_by
FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;
```

> **Bangla explanation (বাংলা):** SQL placeholders `:tenant_code` এবং `:tenant_id` execution-এর আগে প্রকৃত QC value দিয়ে replace করুন। Query শুধু read-only; result-এ password hash, token, বা sensitive column থাকলে evidence-এ include করবেন না।

## 18. UI/UX test cases

| Test Case ID | Title / Objective | Role | Pre | Data | Steps | Exp | Act | Status | Severity if failed | Ev | Remarks |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MOD01-UI-001 | Host login layout is usable | Anonymous | Desktop browser | None | Inspect `/host/login` | Labels, inputs, button, and error area are clear |  | NOT RUN | Low |  |  |
| MOD01-UI-002 | Tenant login layout is usable | Anonymous | Desktop browser | None | Inspect `/login` | Correct tenant login context is clear |  | NOT RUN | Low |  |  |
| MOD01-UI-003 | Tenant list headers align with data | Host Admin | List loaded | None | Inspect table | Headers/data/actions readable and aligned |  | NOT RUN | Low |  |  |
| MOD01-UI-004 | Empty-state messaging is actionable | Host Admin | Search no-result state | Absent search text | Search | User understands no results and recovery action |  | NOT RUN | Low |  |  |
| MOD01-UI-005 | Validation messages are understandable | Host Admin | Create form | Blank required field | Submit | Message identifies field and correction without jargon |  | NOT RUN | Low |  |  |
| MOD01-UI-006 | Required fields are visibly identified | Host Admin | Create/edit form | None | Inspect form | Required indicators are consistent and visible |  | NOT RUN | Low |  |  |
| MOD01-UI-007 | Save feedback is visible | Host Admin | Valid form | QC update | Save | Clear success/failure feedback prevents uncertainty |  | NOT RUN | Medium |  |  |
| MOD01-UI-008 | Destructive status action has confirmation | Host Admin | Active tenant | Suspend action | Initiate suspend | Confirmation explains impact and allows cancel |  | NOT RUN | Medium |  |  |
| MOD01-UI-009 | Keyboard tab order is logical | Host Admin | Form open | None | Tab through controls | Focus order follows visual/workflow order |  | NOT RUN | Low |  |  |
| MOD01-UI-010 | Visible focus indicator exists | Host Admin | Form open | None | Navigate with keyboard | Focused control is visually identifiable |  | NOT RUN | Medium |  |  |
| MOD01-UI-011 | Enter key behavior is safe | Host Admin | Populated form | Valid draft | Press Enter in fields | No unintended destructive/double action |  | NOT RUN | Medium |  |  |
| MOD01-UI-012 | Page refresh behavior is understandable | Host Admin | Form/list state | Draft/search | Refresh | State is safely retained, reset, or warned as designed |  | NOT RUN | Medium |  |  |
| MOD01-UI-013 | Mobile-width layout is usable | Host Admin | Narrow viewport | None | Inspect core pages at mobile width | No critical overlap/cutoff; controls usable |  | NOT RUN | Medium |  |  |
| MOD01-UI-014 | Tablet-width layout is usable | Host Admin | Medium viewport | None | Inspect core pages | Tables/actions remain usable |  | NOT RUN | Low |  |  |
| MOD01-UI-015 | Long tenant name is handled | Host Admin | Test tenant available | Long valid name | View list/detail | No clipping of critical content or broken layout |  | NOT RUN | Low |  |  |
| MOD01-UI-016 | Status uses clear visual meaning | Host Admin | Different statuses exist | Active/suspended | Inspect badges/text | Status is distinguishable without color alone where practical |  | NOT RUN | Low |  |  |
| MOD01-UI-017 | Error page is user-safe | Anonymous | Safe invalid route/input | Invalid route | Navigate safely | Friendly recovery guidance; no internals exposed |  | NOT RUN | Medium |  |  |
| MOD01-UI-018 | Browser back navigation is safe | Host Admin | Save action complete | None | Use Back after save | No duplicate submit or misleading stale state |  | NOT RUN | Medium |  |  |

## 19. Performance observation table

Performance observations are not load tests. Use one normal QC browser and record approximate elapsed time, network condition, and evidence.

| Observation ID | Scenario | Target observation | Actual time | Status | Evidence / remarks |
|---|---|---|---|---|---|
| MOD01-PERF-001 | `GET /api/health` | Responds successfully without visible delay |  | NOT RUN |  |
| MOD01-PERF-002 | Host login | Dashboard available in acceptable QC time |  | NOT RUN |  |
| MOD01-PERF-003 | Tenant login | Tenant landing page available in acceptable QC time |  | NOT RUN |  |
| MOD01-PERF-004 | Tenant list initial load | List/action controls become usable promptly |  | NOT RUN |  |
| MOD01-PERF-005 | Tenant search | Result/empty state updates promptly |  | NOT RUN |  |
| MOD01-PERF-006 | Create tenant | Save completes once without extended spinner/error |  | NOT RUN |  |
| MOD01-PERF-007 | Tenant detail/onboarding open | View opens without broken partial state |  | NOT RUN |  |
| MOD01-PERF-008 | Audit list/filter | Records/filter response remains usable |  | NOT RUN |  |

> Record a defect only when a delay materially prevents normal QC use, causes timeout, causes duplicate submission, or produces inconsistent data. Include timestamp and browser/network observation.

---

## 20. Evidence handling and naming

### 20.1 Required evidence

- Capture the initial state, material action, and final result for every PASS or FAIL where practical.
- For security and privacy cases, redact usernames other than permitted test IDs and never capture passwords, session tokens, or secrets.
- Save evidence in the approved QC evidence location; reference the relative name in the case row.

### 20.2 Naming standard

Use:

```text
MOD01-TC001-Step01.png
MOD01-TC001-Step02.png
MOD01-TC001-HealthResponse.txt
MOD01-TC042-QueryQ2.csv
MOD01-TC085-DefectABS-123.png
```

Where `TC001` is the sequential execution case number, not necessarily the suffix in the test-case ID. Use `.png` for screenshots, `.txt` for sanitized response text, and `.csv` only for approved non-sensitive query output.

> **Bangla explanation (বাংলা):** Screenshot file name একরকম রাখুন যাতে test case, step এবং defect সহজে trace করা যায়। Password, token, cookie, full connection string, বা sensitive user data দেখা গেলে screenshot redact করুন।

---

## 21. Defect template

Create one defect per independently reproducible issue. Do not combine unrelated failures.

| Field | Required content |
|---|---|
| Defect ID | Tracker-generated ID |
| Title | Concise impact-focused title |
| Module | `MOD-01 Company / Tenant Management` |
| Test Case ID | For example `MOD01-SEC-004` |
| Environment | QC Docker, URL, build/commit if available |
| Severity | Critical / High / Medium / Low |
| Priority | Project triage value |
| Preconditions | Exact account/state/data setup |
| Steps to reproduce | Numbered, deterministic steps |
| Actual result | What occurred, including safe error text |
| Expected result | Requirement/pass condition |
| Impact | Tenant, user, data, security, or workflow impact |
| Evidence | Evidence filenames and sanitized logs |
| Reproducibility | Always / Intermittent / Once |
| Reporter and date | Tester identity and date/time |
| Retest result | Pass / Fail / Blocked with evidence |

### 21.1 Severity guidance

| Severity | Use when |
|---|---|
| Critical | Cross-tenant exposure/change, authentication bypass, data corruption, or service unavailable |
| High | Core lifecycle/create/subscription failure, authorization failure, or substantial audit failure |
| Medium | Validation, persistence, workflow, or UX issue with workable mitigation |
| Low | Cosmetic, wording, alignment, or minor usability issue |

---

## 22. Entry and exit criteria

### 22.1 Entry criteria

- QC URL and `GET /api/health` are available.
- `abs-healthcare-pilot-app` and `abs-healthcare-pilot-db` are running.
- Approved host and tenant accounts are available through secure channel.
- At least two separable QC tenant contexts can be used for isolation tests.
- Subscription packages and necessary baseline data are available.
- Tester has approved read-only PostgreSQL access or a designated Database Observer is assigned.
- Evidence storage and defect tracker are available.

### 22.2 Exit criteria

- All applicable MOD01 test cases have an execution status and evidence reference or documented reason.
- All Critical failures are fixed and retested PASS, or formally accepted by authorized release authority.
- All High failures have an agreed disposition, owner, and retest/release decision.
- Tenant isolation, authentication, lifecycle, and audit high-risk cases pass.
- Database verification confirms the tested data relationships and no unexpected duplicate test tenant code remains.
- Test summary, defect list, and UAT sign-off are completed.

> **Bangla explanation (বাংলা):** Exit criteria পূরণ না হলে QC PASS ঘোষণা করা যাবে না। বিশেষ করে Critical security বা tenant isolation defect থাকলে release sign-off গ্রহণযোগ্য নয়।

---

## 23. Test summary and UAT sign-off

### 23.1 Execution summary

| Metric | Count |
|---|---:|
| Planned functional/security/database/UI cases | 144 |
| Performance observations | 8 |
| Passed |  |
| Failed |  |
| Blocked |  |
| Not run |  |
| Not applicable |  |
| Open Critical defects |  |
| Open High defects |  |

### 23.2 Sign-off decision

| Decision | Select one |
|---|---|
| QC Pass | ☐ |
| QC Pass with accepted risks | ☐ |
| QC Fail / not ready for UAT | ☐ |
| UAT Accepted | ☐ |
| UAT Rejected / deferred | ☐ |

### 23.3 Sign-off page

| Sign-off role | Name | Signature / approval reference | Date | Comments |
|---|---|---|---|---|
| Independent QC Engineer |  |  |  |  |
| QC Lead |  |  |  |  |
| Development Representative |  |  |  |  |
| Product / Business Owner |  |  |  |  |
| UAT Representative |  |  |  |  |
| Release Authority |  |  |  |  |

### 23.4 Final declaration

I confirm that the test execution recorded in this document was performed in the stated QC Docker non-production environment, using controlled QC data. Evidence and defects have been linked where required. No plaintext password has been recorded in this distributable document.

---

**End of document — ABSHealthcareLite Manual Quality Control and UAT Guide MOD-01, Version 1.0**
