# MOD-33 — Finance & General Accounting — Detailed Architecture

| Field | Value |
|-------|-------|
| **Module** | MOD-33 |
| **Numeric ID** | 33 |
| **Display name** | Finance & General Accounting |
| **Document type** | Detailed Architecture (design) |
| **Documentation** | DETAILED ARCHITECTURE APPROVED (design) |
| **Implementation** | NOT STARTED |
| **AI-QC** | NOT RUN |
| **Manual QC/UAT** | NOT RUN |
| **Production** | NOT APPROVED |
| **Date** | 2026-07-26 |
| **Scope (summary)** | [MOD-33-Finance-General-Accounting.md](./MOD-33-Finance-General-Accounting.md) |
| **Suite overview** | [05-Business-Operations-Suite.md](../Architecture/05-Business-Operations-Suite.md) |
| **ADRs** | [ADR-001](../Architecture/ADR/ADR-001-Central-Accounting-Posting-Engine.md), [ADR-005](../Architecture/ADR/ADR-005-MOD-16-Patient-Ledger-vs-GL.md), [ADR-006](../Architecture/ADR/ADR-006-GRNI-Clearing-Three-Way-Matching.md), [ADR-007](../Architecture/ADR/ADR-007-Posted-Voucher-Immutability-Reversal.md), [ADR-009](../Architecture/ADR/ADR-009-BDT-First-Multi-Currency-Ready.md), [ADR-010](../Architecture/ADR/ADR-010-Generic-Party-Subledger-Model.md) |

**Mode:** Documentation architecture only. No Prisma schema, routes, UI, or runtime code in this phase.

---

## Approved policies (baseline — do not reinterpret)

| Policy | Decision |
|--------|----------|
| Accounting basis | **Accrual** |
| Posted vouchers | **Immutable**; corrections via **reversal + repost** (ADR-007) |
| Currency | **BDT-first**, multi-currency-ready (ADR-009) |
| Purchase clearing | **GRNI clearing at GRN**; procurement posts via adapter (ADR-006) |
| GL write authority | **MOD-33 is the only writer of GL** (ADR-001) |
| Isolation | **Tenant + branch isolation mandatory** |
| Double-entry | Balanced debit = credit mandatory on every post |
| Idempotency / source traceability / optimistic concurrency / full audit | Mandatory |

---

## 1. Purpose and business scope

MOD-33 is the central, reusable double-entry accounting engine for ABSHealthcareLite. It owns:

- Fiscal calendar (fiscal year, accounting periods, open/close/lock governance)
- Chart of Accounts (hierarchy, types, system/control roles, mappings)
- Voucher lifecycle and numbering
- Central posting engine (`JournalIntent` → posted voucher lines)
- Subledgers via generic party model
- Cash Book, Bank Book, bank reconciliation
- General Ledger / Account Ledger
- Statutory and management financial statements (TB, P&L, BS, Cash Flow, Changes in Equity)
- Opening balances, closing entries, retained earnings treatment
- Branch consolidation views
- Document attachments, audit history, print/export contracts

Operational modules (billing, procurement, inventory, payroll, assets, manufacturing) never insert GL rows. They emit balanced journal intents through adapters; MOD-33 validates, posts, and remains the source of truth for enterprise books.

---

## 2. Supported business types

| Business type | MOD-33 role | Notes |
|---------------|-------------|-------|
| Healthcare / Diagnostic | Recommended (Optional→Recommended for small diagnostic) | Patient AR via party type `patient`; MOD-10 operational billing posts via adapter |
| Hospital / Clinic | Recommended | Multi-branch, multi-department dims optional via MOD-41 |
| Trading | Required | Customer/supplier parties; inventory valuation posts from MOD-35 |
| Distribution | Required | Same as trading; branch consolidation common |
| Manufacturing | Required | Costing/WIP posts from MOD-42 via posting engine |

COA templates and party types must remain vertical-agnostic. Healthcare-specific UX (patient 360) stays in MOD-16; trading AR uses the same engine with `customer` party type (ADR-010).

---

## 3. Actors and roles

| Actor / role (logical) | Typical duties |
|------------------------|----------------|
| Accountant / Voucher Clerk | Create draft vouchers, attach documents, submit |
| Approver | Approve/reject submitted vouchers; add comments |
| Poster / Chief Accountant | Post approved vouchers; reverse with reason |
| Finance Controller | Period open/close/lock; reopen requests; statement sign-off |
| Auditor (read) | Inquiry, export, audit trail review |
| Branch Finance User | Branch-scoped voucher and book inquiry |
| System / Adapter | Machine actor posting from source modules with idempotency keys |
| Tenant Admin (RBAC) | Assign finance permissions; not a substitute for SoD |

Exact permission codes are implementation detail; segregation of duties rules are in §17.

---

## 4. Dependencies

| Dependency | Why |
|------------|-----|
| MOD-01 / MOD-01A | Tenant, host/tenant boundaries |
| MOD-02 | Branch / org structure |
| MOD-03 | Auth / session |
| MOD-04 | RBAC / permissions |
| MOD-06 | Localization, number/date formatting, RTL |
| MOD-07 | Audit infrastructure patterns |

**Does not depend on** MOD-10/16/24/34/35/36/38/39/41/42 for core engine existence; those are consumers/adapters.

---

## 5. Consumers

| Consumer | Integration |
|----------|-------------|
| MOD-10 (future) | Invoice / payment / discount / reversal posting adapter |
| MOD-16 | Patient subledger UX / AR projection (not GL statements) — ADR-005 |
| MOD-24 | Operational billing hold; accounting must not bypass holds |
| MOD-34 | Supplier invoice, advance, payment, GRNI clearing posts |
| MOD-35 | Inventory valuation, adjustment, COGS-related posts |
| MOD-36 | Capitalization, depreciation, disposal posts |
| MOD-38 | Payroll / settlement posts |
| MOD-39 | Capital, dividend, reserve posts |
| MOD-41 | Reads GL actuals for budget vs actual; owns cost-center masters |
| MOD-42 | Material, labor, overhead, WIP, FG costing posts |
| Future MOD-28/29 | Charges/clearance with MOD-10/16/33 |

---

## 6. Tenant and branch model

| Rule | Requirement |
|------|-------------|
| Tenant isolation | Every accounting entity carries `tenantId`; queries always filter by tenant |
| Branch scope | Vouchers and books are branch-scoped; branchId mandatory on voucher header |
| COA scope | **Owner decision** — tenant-wide COA vs branch-specific overlays (see Owner Decision Register) |
| Consolidation | Cross-branch consolidation is a reporting view within tenant; never cross-tenant |
| System posts | Adapter posts must include tenantId + branchId from source document |

---

## 7. Fiscal year and accounting period model

| Concept | Description |
|---------|-------------|
| FiscalYear | Tenant-scoped calendar (e.g. Jul–Jun or Jan–Dec). Fields: code, name, startDate, endDate, status (`Open` / `Closed`), baseCurrencyId |
| AccountingPeriod | Child of FiscalYear; typically monthly. Fields: periodNo, startDate, endDate, status (`Future` / `Open` / `SoftClosed` / `Locked`) |
| Uniqueness | `(tenantId, fiscalYearCode)`; `(tenantId, fiscalYearId, periodNo)` |
| Active FY | At most one “current open” FY recommended for day-to-day posting; prior open periods allowed until locked |

Periods are the unit of close/lock governance. Voucher `postingDate` must fall inside an **Open** (or authorized reopen) period.

---

## 8. Period open, close, reopen, and lock governance

| Action | Effect | Permission (logical) |
|--------|--------|----------------------|
| Open | Allows posting | Period Admin |
| Soft close | Blocks routine posts; allows authorized adjustments | Period Admin |
| Lock | Hard block on new posts into period | Controller |
| Reopen | Temporary unlock with reason, expiry, audit | Controller + dual control **owner policy** |
| Override | Exception path only; full audit | Explicit override permission |

Rules:

- Cannot post into `Locked` periods.
- Soft-closed periods may allow reversing/adjusting vouchers if policy enabled (**owner confirm**).
- Closing FY requires all periods locked/soft-closed and closing entries completed (§26–27).
- Reopen always records actor, reason, timestamp, prior status.

---

## 9. Chart of Accounts hierarchy

Logical hierarchy (depth configurable; typical 3–5 levels):

```text
Account Group / Header
  └── Sub-group (optional)
        └── Postable account (leaf)
```

| Field (logical) | Notes |
|-----------------|-------|
| accountCode | Unique per COA scope (tenant or branch — owner decision) |
| accountName / nameLocal | i18n display |
| parentAccountId | Null for roots |
| level / path | Materialized path or level for tree queries |
| isPostable | Only leaves accept voucher lines |
| accountTypeId | Links to §10 |
| isActive | Soft disable; no delete if posted history |
| currencyBehavior | Natural currency / multi-currency allowed |

Non-postable headers exist for reporting rollups only.

---

## 10. Account types

| Type | Normal balance | Statement home |
|------|----------------|----------------|
| Asset | Debit | Balance Sheet |
| Liability | Credit | Balance Sheet |
| Equity | Credit | Balance Sheet / Changes in Equity |
| Revenue / Income | Credit | P&L |
| Expense | Debit | P&L |
| Contra-asset / Contra-liability / Contra-equity | Opposite of parent class | BS / Equity |

Optional memo/statistical accounts are **out of P1** unless owner expands scope.

---

## 11. System/control account roles

System roles map COA leaves to engine behaviors (via `AccountSystemRole` / `AccountMapping`):

| Role key (examples) | Purpose |
|---------------------|---------|
| `AR_CONTROL` | Receivables control |
| `AP_CONTROL` | Payables control |
| `GRNI_CLEARING` | Goods received not invoiced (ADR-006) |
| `CASH` | Cash book accounts |
| `BANK` | Bank book accounts |
| `VAT_INPUT` / `VAT_OUTPUT` | Tax boundary accounts (engine stores; tax calc elsewhere) |
| `RETAINED_EARNINGS` | Year-end close target |
| `OPENING_BALANCE_EQUITY` | OB control / suspense |
| `FX_GAIN` / `FX_LOSS` | Multi-currency (ready; P1 may unused) |
| `INVENTORY` / `COGS` | Mapping targets for MOD-35 posts |
| `PATIENT_AR` | Optional alias or same as AR with party type patient |

Control accounts **require** party/subledger reference when posted (§12–13).

---

## 12. Generic party/subledger strategy

Per ADR-010: one generic party/subledger model with typed parties. Core posting engine must not hard-code healthcare-only structures.

| Concept | Responsibility |
|---------|----------------|
| Party | Identity + type; may link to operational master ids |
| PartyAccount | Maps party ↔ control account (optional default AR/AP) |
| SubledgerEntry | Detail projection or line-level party dimensions on voucher lines |

**Owner decision:** single Party entity with typed profiles vs separate typed profile tables — see Owner Decision Register. Architecture assumes typed parties at minimum: patient, customer, supplier, employee, shareholder, bank account, fixed asset.

---

## 13. Patient, customer, supplier, employee, shareholder, bank, and asset subledgers

| Party type | Operational master (owner module) | Subledger purpose |
|------------|-----------------------------------|-------------------|
| patient | MOD-10/16 patient | Patient AR / dues; UX in MOD-16 |
| customer | Trading CRM / customer master (future) | Trade AR |
| supplier | MOD-34 | AP, advances, GRNI linkage |
| employee | MOD-37 | Payroll / advances / loans (posts from MOD-38) |
| shareholder | MOD-39 | Capital / dividends payable |
| bank account | MOD-33 BankAccount | Bank book / reconciliation |
| fixed asset | MOD-36 | Asset register linkage for capitalization/depr |

Voucher lines posting to control accounts must carry `partyType` + `partyId` (or bankAccountId / assetId aliases resolved to party).

---

## 14. Voucher types

| Type | Typical use |
|------|-------------|
| Journal | General double-entry adjustments |
| Receipt | Cash/bank inflow |
| Payment | Cash/bank outflow |
| Contra | Cash ↔ bank / bank ↔ bank |
| Adjustment | Controlled corrections (still immutable once posted) |
| Opening Balance | Opening balance batch voucher(s) |
| Closing | Year-end closing entries |
| Reversal | System/user-generated offset of a posted voucher |

Source-generated vouchers (from adapters) may use Journal/Receipt/Payment with `sourceModule` + `sourceDocumentType` rather than inventing many types.

---

## 15. Voucher numbering

| Aspect | Design |
|--------|--------|
| Sequence key | `(tenantId, [branchId?], voucherType, fiscalYearId)` — **owner: centralized vs branch-specific** |
| Format | Prefix + FY + sequence (exact mask owner decision) |
| Assignment | On submit or on post (recommend **on post** for gaps avoidance; draft may use temporary id) |
| Gaps | Allowed after voided drafts; posted numbers never reused |
| Concurrency | Atomic sequence allocation under tenant/branch lock |

---

## 16. Draft → Submitted → Approved → Posted → Reversed lifecycle

```text
Draft → Submitted → Approved → Posted
                 ↘ Rejected → (back to Draft)
Posted → Reversed (new reversing voucher Posted; original remains Posted+Reversed flag)
```

| Status | Editable? | Notes |
|--------|-----------|-------|
| Draft | Yes | Creator edits lines |
| Submitted | Header/lines locked for edit except withdraw (policy) | In approval queue |
| Approved | Immutable pending post | May auto-post if configured |
| Posted | Immutable | Source of truth lines exist |
| Rejected | Return to Draft | Comments required |
| Reversed | Original stays; linked reverse voucher | ADR-007 |

---

## 17. Segregation of duties

Configurable SoD (ADR-007):

| Capability | Rule |
|------------|------|
| Create vs Approve | Same user must not approve own voucher if SoD enabled |
| Approve vs Post | May be same or split by tenant policy |
| Reverse | Distinct permission; reason mandatory |
| Period lock | Not grantable to all voucher clerks |
| Adapter posts | System principal with module-scoped post permission; still audited |

SoD matrix stored as tenant finance policy; default for pilot: **create ≠ approve**.

---

## 18. Posting engine contract

See major section **Posting Engine Contract** below. Summary:

- Input: `JournalIntent` + lines
- Validates balance, period, accounts, party, currency, permissions, idempotency
- Transactionally creates/posts `Voucher` + `VoucherLine` (+ status history, optional SubledgerEntry)
- Returns `postedVoucherId` to source adapter
- **Only MOD-33** persists posted GL lines

---

## 19. Journal intent contract (JournalIntent + JournalIntentLine fields)

### JournalIntent (logical fields)

| Field | Required | Notes |
|-------|----------|-------|
| tenantId | Yes | |
| branchId | Yes | |
| sourceModule | Yes | e.g. `MOD-10`, `MOD-34` |
| sourceDocumentType | Yes | e.g. `Invoice`, `Payment`, `GRN` |
| sourceDocumentId | Yes | Stable id |
| sourceDocumentNo | Optional | Display |
| idempotencyKey | Yes | Unique per tenant |
| voucherType | Yes | |
| postingDate | Yes | Drives period |
| documentDate | Optional | |
| currencyId | Yes | BDT for P1 |
| exchangeRate | Conditional | Required if ≠ base |
| exchangeRateDate / snapshotId | Conditional | |
| narration | Optional | |
| costCenterId / projectId | Optional | MOD-41 dims |
| createdBy / requestedBy | Yes | User or system |
| expectedVersion / sourceVersion | Optional | Optimistic concurrency vs source |

### JournalIntentLine

| Field | Required | Notes |
|-------|----------|-------|
| lineNo | Yes | |
| accountId / accountCode | Yes | Resolved to postable leaf |
| debit | One of Dr/Cr | Non-negative; one side > 0 |
| credit | One of Dr/Cr | |
| amountTxn | Yes | In document currency |
| amountBase | Yes | In tenant base (BDT) |
| partyType / partyId | Conditional | Required for control accounts |
| bankAccountId | Conditional | Cash/bank lines |
| costCenterId / projectId | Optional | |
| taxCode / taxAmount | Optional | Boundary fields only |
| narration | Optional | |
| sourceLineId | Optional | Traceability |

Full validation and transactional rules: major section below.

---

## 20. Idempotency

| Rule | Detail |
|------|--------|
| Key | `idempotencyKey` unique per `tenantId` |
| Behavior | Replay returns original `postedVoucherId` without double post |
| Scope | Adapter must use deterministic key from source doc + event type (e.g. `MOD-10:Invoice:123:post`) |
| Failed attempts | Partial failure must not leave orphan posted lines; transaction rollback |
| Reverse events | Separate key (`…:reverse`) |

---

## 21. Optimistic concurrency

| Surface | Mechanism |
|---------|-----------|
| Voucher draft/edit | `rowVersion` / `updatedAt` check on update |
| Period / COA masters | Same |
| Source adapter | Optional `sourceVersion`; reject stale post if source changed after intent built |
| Sequences | DB-level atomic increment, not optimistic alone |

Conflict → fail with concurrency error; client refreshes and retries.

---

## 22. Immutable posted vouchers

Per ADR-007:

- No update/delete of posted header or lines
- No silent rewrite of amounts, accounts, parties, dates
- Metadata-only exceptions (e.g. attachment add) must not alter financial meaning; prefer attachment entity linked by id
- Printed legal copies bind to posted snapshot

---

## 23. Reversal and repost

| Step | Behavior |
|------|----------|
| Reverse | Create new voucher with swapped Dr/Cr (or sign-inverted), same accounts/parties, link `reversesVoucherId` / `reversedByVoucherId` |
| Period | Reversal postingDate must be in open period (may be current period even if original period locked — **owner policy**) |
| Repost | New intent from corrected source; new idempotency key |
| Audit | Reason, actor, timestamps mandatory |

Original posted voucher remains forever as historical fact.

---

## 24. Source traceability

Every posted voucher stores:

| Field | Purpose |
|-------|---------|
| sourceModule | Origin module |
| sourceDocumentType / Id / No | Origin document |
| idempotencyKey | Dedup |
| postedVoucherId on source | Back-link from operational doc |
| optional sourceEventId | For multi-event docs |

Inquiry: “from voucher → source” and “from source → voucher” both required.

---

## 25. Opening balances

| Aspect | Design |
|--------|--------|
| Entity | `OpeningBalanceBatch` + lines → Opening Balance voucher(s) |
| Timing | Before or at FY open; typically once per FY/branch |
| Balance check | Asset + Expense = Liability + Equity + Revenue (or TB balance in base currency) |
| Control | Differences to `OPENING_BALANCE_EQUITY` / suspense with strict clearance policy |
| Subledger | Party OB lines required for AR/AP controls |
| Migration | See §52–53 and Hybrid cutover recommendation |

---

## 26. Closing entries

Year-end (or period) closing:

1. Ensure periods eligible for close
2. Generate closing voucher(s): close P&L accounts to Income Summary / Retained Earnings
3. Lock periods / FY
4. Optional auto-create next FY opening from BS balances

Closing vouchers are posted, immutable, reversible only under controller policy.

---

## 27. Retained earnings

| Rule | Design |
|------|--------|
| Mapping | System role `RETAINED_EARNINGS` points to equity leaf |
| Close | Net P&L for FY posts to RE |
| Interim | P&L YTD for BS “current year earnings” may be computed, not necessarily posted monthly |
| Dividends | MOD-39 posts reduce RE / create dividend payable — not owned by MOD-33 UI |

---

## 28. Multi-currency-ready design

Per ADR-009:

- Tenant `baseCurrencyId` = BDT for Bangladesh pilots
- Documents carry `currencyId`, `exchangeRate`, amounts in txn + base
- P1 UI may be BDT-only; schema/contracts must not hard-block FX
- Reports always label currency; mixed-currency TB in base only for P1/P2

**Owner decision:** when to enable operational multi-currency (phase).

---

## 29. Exchange-rate snapshots

| Entity | Purpose |
|--------|---------|
| Currency | ISO code, decimals, symbol |
| ExchangeRate | Rate from currency → base for a date / source |
| Snapshot on voucher | Persist rate used at post time (immutable with voucher) |

Never revalue historical posted amounts silently. Future revaluation journals are separate intents (deferred).

---

## 30. Cash Book

| Aspect | Design |
|--------|--------|
| Definition | Movements on accounts with system role `CASH` |
| Columns | Date, voucher no, narration, Dr, Cr, running balance |
| Filters | Branch, date range, cash account |
| Phase | P2 |

Derived from posted voucher lines — not a separate cash ledger table required for P1.

---

## 31. Bank Book

Same pattern as Cash Book for `BANK` role accounts / `BankAccount` linkage. Phase P2.

---

## 32. Bank reconciliation

| Entity | Purpose |
|--------|---------|
| BankReconciliation | Statement date, opening/closing statement balance, status |
| BankReconciliationLine | Match book lines ↔ statement lines; unmatched flags |

Rules:

- Only posted bank book lines eligible
- Cleared marks do not alter posted amounts
- Difference = statement closing − book closing (explainable)
- Phase P2

---

## 33. General Ledger

Enterprise GL = set of all **posted voucher lines** (plus headers for metadata). Inquiry screens aggregate by account/period. **Source of truth = posted voucher lines** (ADR-001/007).

---

## 34. Account Ledger

Per-account chronological listing with running balance (base currency). Party filter when control account. Print/export required.

---

## 35. Trial Balance

| Aspect | Design |
|--------|--------|
| Input | Posted lines in period/FY range, branch or consolidated |
| Output | Account, opening, debit, credit, closing |
| Balance proof | Total Dr = Total Cr |
| Phase | P1 foundation |

Computed from posted lines; cached balance tables **not recommended for P1** (see Posting Engine section).

---

## 36. Profit and Loss

Revenue and expense accounts for period/FY; optional cost-center/project filters (dims from MOD-41). Layout via `FinancialStatementLayout` (P2+).

---

## 37. Balance Sheet

Assets = Liabilities + Equity at as-of date; includes RE and current-year earnings treatment. Branch or consolidated.

---

## 38. Cash Flow

Indirect method recommended for P2 (net income → adjustments → operating/investing/financing). Requires classification tags on accounts or statement nodes. Direct method optional later.

---

## 39. Changes in Equity

Movements in equity accounts: opening, profit, dividends, capital, OCI (if any), closing. Depends on MOD-39 for dividend/capital source docs when those modules live.

---

## 40. Branch consolidation

| Mode | Behavior |
|------|----------|
| Single branch | Default books |
| Multi-branch consolidated | Sum posted lines across selected branches within tenant |
| Eliminations | Inter-branch elimination journals — **deferred** unless owner prioritizes |

No cross-tenant consolidation in this module.

---

## 41. Cost center/project references (MOD-41 owns masters; MOD-33 accepts optional dims)

| Rule | Owner |
|------|-------|
| Cost center / project masters | **MOD-41** |
| Optional `costCenterId` / `projectId` on voucher lines | **MOD-33** accepts and stores |
| Validation | If present, must exist and be active for tenant; MOD-33 does not own master UI |
| Budget control | MOD-41; MOD-33 does not block posts for budget in P1/P2 unless later policy |

---

## 42. Tax/VAT integration boundary

| In MOD-33 | Out of MOD-33 |
|-----------|---------------|
| VAT control accounts, tax amounts on lines as posted | Tax engine, rate tables, return filing |
| Posting of tax lines supplied by adapters | Computation of VAT on invoices (billing/tax module) |

Adapters supply already-calculated tax lines. MOD-33 validates accounts and balance only.

**Owner decision:** which module owns tax engine long-term.

---

## 43. Document attachments

| Aspect | Design |
|--------|--------|
| Entity | `DocumentAttachment` linked to voucher (and optionally OB batch) |
| Storage | Platform file service pattern; metadata in MOD-33 |
| Posted vouchers | Attachments addable; cannot change financial lines |
| Security | Same RBAC as voucher view |

---

## 44. Audit history

| Event | Audited |
|-------|---------|
| Master changes (FY, period, COA) | Before/after |
| Voucher status transitions | `VoucherStatusHistory` |
| Post / reverse | Actor, reason, ids |
| Period lock/reopen | Actor, reason |
| Permission-denied attempts | Security log (platform) |

Align with MOD-07 patterns; finance retains domain status history even if platform audit exists.

---

## 45. Approval comments and rejection

| Field | Use |
|-------|-----|
| comment | Required on reject; optional on approve |
| actorId / at | Audit |
| fromStatus / toStatus | History row |

Rejected vouchers return to Draft; comments visible to creator.

---

## 46. Print/export requirements

| Artifact | Formats (planned) |
|----------|-------------------|
| Voucher | Print / PDF |
| Account ledger, Cash/Bank book | Print / PDF / Excel |
| TB, P&L, BS, Cash Flow, Equity | Print / PDF / Excel |
| Party statement | Print / PDF |
| Bank reconciliation | Print / PDF |

Volume 4 UI rules: i18n labels, RTL layout, persistent monetary totals where grids apply. No hardcoded English in user-facing strings.

---

## 47. Localization and RTL

- All labels via MOD-06 i18n dictionaries
- RTL layout for Arabic/Urdu (and other RTL locales) when tenant language requires
- Number/date/currency formatting from locale; storage remains canonical decimals + ISO dates
- Account names support local description fields

---

## 48. Accessibility

Planned UI must meet WCAG AA: keyboard voucher grids, focus order, status not by color alone, screen-reader labels on Dr/Cr, sufficient contrast. Status badges for voucher/period state.

---

## 49. Mobile/responsive scope

| Surface | Expectation |
|---------|-------------|
| Approval worklist | Responsive / usable on tablet |
| Inquiry (TB, ledgers) | Desktop-first; horizontal scroll acceptable on small screens |
| Heavy voucher entry | Desktop-first for P1/P2 |
| Bank recon | Desktop-first |

---

## 50. Security and RBAC

| Control | Requirement |
|---------|-------------|
| Permission checks | Every mutate and sensitive read |
| Tenant isolation | Mandatory in all queries |
| Branch scoping | Enforce user branch access |
| Adapter auth | Service identity + module scope |
| SoD | Configurable (§17) |
| Export | Permission-gated (may include PII on party statements) |

---

## 51. Performance expectations

| Operation | Target (design) |
|-----------|-----------------|
| Post single voucher (≤100 lines) | Sub-second typical on pilot hardware |
| TB for 12 periods, mid-size COA | Interactive (< few seconds) via indexed aggregation |
| Account ledger month | Interactive with pagination |
| Consolidation | Acceptable batch/interactive hybrid |

Indexes: `(tenantId, branchId, postingDate)`, `(tenantId, accountId, postingDate)`, idempotency unique, source document lookup. Avoid full-table scans for books.

---

## 52. Migration from existing Invoice/InvoicePayment

Current pilot has operational billing (`Invoice` / `InvoicePayment`) under MOD-10 without MOD-33 GL. Options:

| Option | Description |
|--------|-------------|
| (1) Opening-balance-only | At go-live, post AR/AP/cash OB from due balances; leave history operational-only |
| (2) Historical catch-up | Generate intents for all historical invoices/payments |
| (3) Hybrid cutover | OB from dues + optional catch-up of **current open FY** documents only |

**Recommendation for pilot: Hybrid cutover** — see Existing Billing Integration section. Owner must confirm.

---

## 53. Legacy opening-balance strategy

1. Freeze operational cutover datetime
2. Extract open AR by patient/customer, open AP (if any), cash/bank balances, inventory value (from MOD-35 when live)
3. Load `OpeningBalanceBatch` with party detail
4. Post OB vouchers in open FY period 0 / opening period
5. Validate TB and subledger vs operational dues report
6. Do **not** rewrite all historical invoices into GL in P2

---

## 54. Backward compatibility

| Concern | Approach |
|---------|----------|
| Existing Invoice/Payment APIs | Remain source of operational truth until adapter enabled |
| MOD-16 Patient Ledger UX | Continues over operational dues; later also over subledger |
| No breaking rename of billing tables | Accounting adds links (`postedVoucherId`) nullable |
| Feature flags | Tenant enable MOD-33 posting only after QC |

---

## 55. Failure and rollback scenarios

| Scenario | Behavior |
|----------|----------|
| Unbalanced intent | Reject; no write |
| Locked period | Reject |
| Idempotent replay | Return prior success |
| Mid-post DB failure | Transaction rollback; no partial posted lines |
| Approval after period lock | Cannot post; return to adjust date or reopen |
| Adapter timeout after success | Replay via idempotency |
| Reverse after FY lock | Denied unless reopen policy |

---

## 56. Data retention

| Data | Retention |
|------|-----------|
| Posted vouchers / lines | Legal retention (tenant policy; recommend ≥ 7 years design default) |
| Drafts | Shorter; purge policy optional |
| Attachments | Same as related voucher |
| Audit / status history | Retain with vouchers |
| Soft-delete | Masters soft-delete; posted financials never hard-deleted |

---

## 57. AI-QC requirements

After implementation (not this phase):

- Unbalanced post rejected
- Idempotency replay safe
- Immutability of posted rows
- Period lock enforcement
- Tenant/branch isolation tests
- Control account requires party
- Reversal linkage integrity
- Adapter examples (invoice/payment) balance and trace
- No direct GL writes from non-MOD-33 modules

**Status now:** AI-QC **NOT RUN**.

---

## 58. Manual QC/UAT requirements

- COA setup and FY/period lifecycle
- Voucher SoD (create ≠ approve)
- Post, reverse, repost happy paths
- Cash/Bank books and recon (P2)
- TB / P&L / BS reconcile to sample books
- Hybrid cutover OB vs patient dues
- RTL / i18n smoke
- Permission matrix UAT

**Status now:** Manual QC/UAT **NOT RUN**.

---

## 59. Go-live gate

All must be true before Production approval:

| Gate | Required state |
|------|----------------|
| Documentation | DETAILED ARCHITECTURE APPROVED (this doc) + module scope current |
| Implementation | Complete for enabled phase (P1/P2) |
| AI-QC | Passed for in-scope suite |
| Manual QC/UAT | Passed with sign-off |
| Migration | Hybrid cutover runbook executed / verified |
| Production | Explicit **APPROVED** (currently **NOT APPROVED**) |

---

## 60. Out-of-scope items

- Prisma schema, API routes, UI screens in this documentation phase
- Procurement matching UI (MOD-34), inventory engine (MOD-35), FA register (MOD-36)
- HR/Payroll masters and runs (MOD-37/38)
- Shareholder workflows (MOD-39), budgeting UI (MOD-41), manufacturing (MOD-42)
- Tax return engine / e-filing
- Intercompany multi-tenant consolidation
- Full historical rewrite of all billing into GL
- Cached balance tables as P1 requirement
- Operational diagnostic billing UI (MOD-10) and patient 360 (MOD-16)

---

## Proposed Logical Data Model (no Prisma)

Technology-neutral entity catalogue. **No Prisma schema** — field lists only.

### Phase recommendation

| Tier | Entities |
|------|----------|
| **MINIMUM P1** | FiscalYear, AccountingPeriod, Account, AccountSystemRole, AccountMapping, Voucher, VoucherLine, VoucherStatusHistory, Party, PartyAccount *(or equivalent)*, Currency, OpeningBalanceBatch, PostingBatch *(optional thin)* |
| **MINIMUM P2** | + BankAccount, BankReconciliation, BankReconciliationLine, FinancialStatementLayout, FinancialStatementNode, DocumentAttachment, ExchangeRate, SubledgerEntry *(if not fully covered by voucher line party fields)* |
| **DEFERRED** | Heavy balance projection tables, inter-branch elimination entities, revaluation batches, multi-book parallel ledgers |

---

### FiscalYear

| Aspect | Detail |
|--------|--------|
| Purpose | Tenant fiscal calendar header |
| Ownership | MOD-33 |
| Tenant / branch | Tenant; not branch-specific |
| Key fields | id, tenantId, code, name, startDate, endDate, status, baseCurrencyId, rowVersion |
| Uniqueness | (tenantId, code) |
| FKs | baseCurrencyId → Currency |
| Lifecycle | Draft/Open/Closed |
| Audit | Created/updated by/at |
| Indexes | (tenantId, status) |
| Concurrency | rowVersion |
| Soft-delete / immutability | Soft-deactivate; no delete if periods/vouchers exist |
| Traceability | n/a |
| Volume | Low (tens per tenant) |

### AccountingPeriod

| Aspect | Detail |
|--------|--------|
| Purpose | Posting windows inside FY |
| Ownership | MOD-33 |
| Scope | Tenant (+ FY) |
| Key fields | id, tenantId, fiscalYearId, periodNo, name, startDate, endDate, status |
| Uniqueness | (tenantId, fiscalYearId, periodNo) |
| FKs | fiscalYearId |
| Lifecycle | Future/Open/SoftClosed/Locked |
| Indexes | (tenantId, startDate, endDate), (tenantId, status) |
| Volume | Low–medium (~12–24/FY) |

### Account

| Aspect | Detail |
|--------|--------|
| Purpose | COA node |
| Ownership | MOD-33 |
| Scope | Tenant (branch overlay = owner decision) |
| Key fields | id, tenantId, accountCode, name, nameLocal, parentId, level, isPostable, accountType, isActive, currencyId?, rowVersion |
| Uniqueness | (tenantId, accountCode) [or + branchId] |
| FKs | parentId → Account |
| Lifecycle | Active/Inactive |
| Indexes | (tenantId, parentId), (tenantId, accountType) |
| Soft-delete | Soft inactive; immutable code if posted |
| Volume | Hundreds–low thousands |

### AccountSystemRole

| Aspect | Detail |
|--------|--------|
| Purpose | Enumerates system role keys |
| Ownership | MOD-33 |
| Scope | Platform or tenant-extensible |
| Key fields | roleKey, description, requiresParty, allowedPartyTypes |
| Volume | Low |

### AccountMapping

| Aspect | Detail |
|--------|--------|
| Purpose | Maps roleKey → Account for tenant |
| Ownership | MOD-33 |
| Scope | Tenant |
| Key fields | tenantId, roleKey, accountId, branchId? |
| Uniqueness | (tenantId, roleKey, branchId?) |
| FKs | accountId |
| Volume | Low |

### Voucher

| Aspect | Detail |
|--------|--------|
| Purpose | Journal header |
| Ownership | MOD-33 |
| Scope | Tenant + branch |
| Key fields | id, tenantId, branchId, voucherType, voucherNo, status, postingDate, documentDate, currencyId, exchangeRate, fiscalYearId, periodId, narration, sourceModule, sourceDocumentType, sourceDocumentId, idempotencyKey, reversesVoucherId, reversedByVoucherId, rowVersion, postedAt, postedBy |
| Uniqueness | idempotencyKey per tenant; voucherNo per numbering scope |
| Lifecycle | Draft→…→Posted; Reversed flag/links |
| Indexes | (tenantId, branchId, postingDate), (tenantId, sourceDocumentType, sourceDocumentId), unique idempotency |
| Immutability | Posted header financially immutable |
| Volume | High (growth with operations) |

### VoucherLine

| Aspect | Detail |
|--------|--------|
| Purpose | **Source of truth** GL lines |
| Ownership | MOD-33 |
| Scope | Via voucher |
| Key fields | id, tenantId, voucherId, lineNo, accountId, debit, credit, amountTxn, amountBase, partyType, partyId, bankAccountId, costCenterId, projectId, taxCode, taxAmount, narration, sourceLineId |
| Uniqueness | (voucherId, lineNo) |
| FKs | voucherId, accountId, partyId? |
| Immutability | Immutable when voucher Posted |
| Indexes | (tenantId, accountId, voucherId), (tenantId, partyType, partyId) |
| Volume | Very high (× lines per voucher) |

### VoucherStatusHistory

| Aspect | Detail |
|--------|--------|
| Purpose | Approval/post audit trail |
| Key fields | voucherId, fromStatus, toStatus, actorId, at, comment |
| Volume | Medium (× transitions) |

### PostingBatch

| Aspect | Detail |
|--------|--------|
| Purpose | Optional grouping for adapter bulk posts / OB |
| Scope | Tenant |
| Key fields | id, tenantId, sourceModule, status, startedAt, completedAt |
| P1 | Optional; can defer if single-voucher post suffices |
| Volume | Low–medium |

### Party

| Aspect | Detail |
|--------|--------|
| Purpose | Generic subledger identity (ADR-010) |
| Ownership | MOD-33 (links to operational masters) |
| Scope | Tenant |
| Key fields | id, tenantId, partyType, displayName, operationalModule, operationalId, isActive |
| Uniqueness | (tenantId, partyType, operationalId) |
| Volume | High (patients/customers) |
| Owner decision | Typed profiles vs single table |

### PartyAccount

| Aspect | Detail |
|--------|--------|
| Purpose | Default control account mapping per party |
| Key fields | partyId, accountId, roleKey |
| Volume | Medium |

### SubledgerEntry

| Aspect | Detail |
|--------|--------|
| Purpose | Optional explicit subledger projection |
| Recommendation | **P1:** party fields on VoucherLine may suffice; SubledgerEntry **P2/DEFERRED** unless reporting needs force it |
| Volume | Very high if used |

### Currency

| Aspect | Detail |
|--------|--------|
| Purpose | Currency master |
| Key fields | code, name, decimals, symbol |
| Scope | Platform + tenant allow-list optional |
| Volume | Low |

### ExchangeRate

| Aspect | Detail |
|--------|--------|
| Purpose | Rate history |
| Key fields | fromCurrencyId, toCurrencyId, rateDate, rate, source |
| Uniqueness | (from, to, rateDate, source) |
| Phase | Ready in model; heavy UI deferred |
| Volume | Medium over time |

### BankAccount

| Aspect | Detail |
|--------|--------|
| Purpose | Bank book master linked to GL account + party type bank |
| Scope | Tenant + branch |
| Key fields | id, tenantId, branchId, glAccountId, bankName, accountNoMasked, currencyId, isActive |
| Phase | P2 |
| Volume | Low |

### BankReconciliation / BankReconciliationLine

| Aspect | Detail |
|--------|--------|
| Purpose | Statement matching |
| Phase | P2 |
| Key fields (header) | bankAccountId, statementDate, openingBalance, closingBalance, status |
| Key fields (line) | bookVoucherLineId?, statementRef, amount, matchStatus |
| Volume | Medium |

### OpeningBalanceBatch

| Aspect | Detail |
|--------|--------|
| Purpose | Controlled OB load |
| Key fields | tenantId, branchId, fiscalYearId, status, totals, postedVoucherId |
| Lifecycle | Draft→Validated→Posted |
| Volume | Low |

### FinancialStatementLayout / FinancialStatementNode

| Aspect | Detail |
|--------|--------|
| Purpose | Configurable P&L/BS/CF line structures |
| Phase | P2+ |
| Key fields | layoutType, name; nodes: parentId, accountId or formula, sign, sequence |
| Owner decision | How much customization vs fixed IFRS-lite templates |
| Volume | Low |

### DocumentAttachment

| Aspect | Detail |
|--------|--------|
| Purpose | Files linked to vouchers/batches |
| Key fields | ownerType, ownerId, fileId, fileName, uploadedBy, at |
| Phase | P2 recommended; P1 optional |
| Volume | Medium |

---

## Posting Engine Contract (technology-neutral)

### Purpose

Single entry point for all enterprise accounting posts (ADR-001). Adapters build intents; engine posts vouchers.

### API shape (logical)

```text
postJournal(intent: JournalIntent): PostingResult
reverseVoucher(command: ReverseCommand): PostingResult
previewJournal(intent: JournalIntent): ValidationResult   // optional, non-persisting
```

`PostingResult`: `{ postedVoucherId, voucherNo, status, replayed: boolean }`

### Validation rules (must all pass)

1. tenantId / branchId present and authorized
2. idempotencyKey unique or exact replay
3. postingDate ∈ open (or allowed) AccountingPeriod
4. currency known; exchangeRate present if ≠ base; snapshot persisted
5. ≥ 2 lines (or 1 compound policy denied — require balanced multi-line)
6. Each line: postable account, active, correct tenant
7. Σ debit = Σ credit in **base** (and txn currency if single-currency doc)
8. Control/system accounts require partyType/partyId (or bankAccountId)
9. Optional dims: costCenter/project valid if supplied (MOD-41 masters)
10. Permissions / SoD for non-system actors
11. Source document reference present for adapter posts
12. Optimistic concurrency token accepted if provided

### Transactional behavior

- Single DB transaction: voucher + lines + status history (+ subledger if used) + idempotency record
- On any failure → full rollback
- On success → source adapter stores `postedVoucherId`
- Reversal creates **new** posted voucher; never mutates original lines

### Source of truth

**Posted `VoucherLine` rows are the GL source of truth.**

Optional reporting projections (materialized balances) only if justified by measured performance. **Recommendation: do not implement cached balance tables for P1.** Recompute TB/ledgers from indexed posted lines; revisit projections in later phases if volume proves insufficient.

---

## Existing Billing Integration (MOD-10 / MOD-16 / MOD-24)

### Ownership boundaries

| Concern | Owner |
|---------|-------|
| Operational invoice, payment, discount, refund UX/data | MOD-10 |
| Patient 360 / patient ledger UX | MOD-16 (ADR-005) |
| Billing hold / clearance gates | MOD-24 |
| GL / financial statements / books | MOD-33 |
| Journal posting | MOD-33 engine via MOD-10 adapter |

MOD-16 is **not** GL, Account Ledger, Cash/Bank Book, or TB/P&L/BS.

### Accounting examples (illustrative, accrual, BDT)

**Invoice (patient charge recognized):**

```text
Dr  Patient AR (control)         1,000   party=patient
    Cr  Diagnostic Revenue                 1,000
```

**Payment:**

```text
Dr  Cash / Bank                    600
    Cr  Patient AR (control)               600   party=patient
```

**Discount (after invoice):**

```text
Dr  Sales Discount / Revenue reduce  50
    Cr  Patient AR                         50
```

**Payment reversal (ADR-007 style):**

```text
Dr  Patient AR                     600
    Cr  Cash / Bank                        600
```
(linked reversing voucher; original payment voucher immutable)

VAT lines (if applicable) supplied by billing/tax calculation as additional intent lines to VAT control accounts — MOD-33 does not compute VAT.

### Migration options

| Option | Pros | Cons |
|--------|------|------|
| (1) OB-only | Fastest; clean books | No FY detail in GL for pre-cutover ops |
| (2) Full historical catch-up | Complete GL history | Expensive, error-prone, P2 overload |
| (3) Hybrid | Balanced | Needs clear cutover runbook |

### Recommendation — Hybrid cutover (pilot)

1. Keep operational `Invoice` / `InvoicePayment` as operational source of truth.
2. At go-live, take **AR opening** from open due balances (patient/customer subledger OB).
3. Optionally catch up **current open FY** invoices/payments only into MOD-33.
4. Do **not** rewrite all historical years into GL in P2.
5. MOD-16 continues dues UX; reconcile dues vs AR control after cutover.
6. MOD-24 holds remain operational — posting adapter must respect uncleared holds (no revenue recognition bypass).

**Owner must confirm** hybrid strategy before implementation.

---

## Owner Decision Register

Unresolved owner-policy questions — **do not silently decide in implementation**:

| # | Topic | Options / notes | Status |
|---|-------|-----------------|--------|
| 1 | Party model | Single Party + type vs typed profile tables | **Unresolved** |
| 2 | COA template strategy | Fixed starter templates per edition vs fully blank | **Unresolved** |
| 3 | Account-code format | Numeric segmented vs free alphanumeric; length | **Unresolved** |
| 4 | Branch-specific vs tenant-wide COA | Tenant-wide recommended lean default, but confirm | **Unresolved** |
| 5 | Voucher numbering | Centralized tenant vs branch-specific sequences | **Unresolved** |
| 6 | Period close permissions | Who may soft-close / lock / reopen; dual control? | **Unresolved** |
| 7 | Historical migration | OB-only / full catch-up / **hybrid (recommended)** | **Recommend hybrid — owner confirm** |
| 8 | Reporting source-of-truth | Posted lines only vs projections | **Recommend posted lines; owner confirm** |
| 9 | Balance caching | None in P1 vs materialized balances | **Recommend none in P1; owner confirm** |
| 10 | Multi-currency phase | Ready-only vs operational FX in which phase | **Unresolved** |
| 11 | Tax engine boundary | Which module computes VAT long-term | **Unresolved** |
| 12 | Cost center ownership | **Recommend MOD-41 owns masters**; MOD-33 optional dims | **Recommend MOD-41 — owner confirm** |
| 13 | FS layout customization | Fixed layouts vs tenant-editable nodes | **Unresolved** |
| 14 | Reversal into locked original period | Force current open period vs reopen | **Unresolved** |

### Approved policies (restate)

- Accrual basis
- Posted vouchers immutable; reversal + repost
- BDT-first, multi-currency-ready
- GRNI clearing at GRN (ADR-006); procurement posts via adapter
- MOD-33 only writer of GL
- Tenant + branch isolation mandatory

---

## Cross-links

| Document | Path |
|----------|------|
| Suite overview | [docs/Architecture/05-Business-Operations-Suite.md](../Architecture/05-Business-Operations-Suite.md) |
| ADR index | [docs/Architecture/ADR/](../Architecture/ADR/) |
| ADR-001 Posting engine | [ADR-001](../Architecture/ADR/ADR-001-Central-Accounting-Posting-Engine.md) |
| ADR-005 Patient ledger vs GL | [ADR-005](../Architecture/ADR/ADR-005-MOD-16-Patient-Ledger-vs-GL.md) |
| ADR-006 GRNI | [ADR-006](../Architecture/ADR/ADR-006-GRNI-Clearing-Three-Way-Matching.md) |
| ADR-007 Immutability | [ADR-007](../Architecture/ADR/ADR-007-Posted-Voucher-Immutability-Reversal.md) |
| ADR-009 Currency | [ADR-009](../Architecture/ADR/ADR-009-BDT-First-Multi-Currency-Ready.md) |
| ADR-010 Party model | [ADR-010](../Architecture/ADR/ADR-010-Generic-Party-Subledger-Model.md) |
| Module scope | [MOD-33-Finance-General-Accounting.md](./MOD-33-Finance-General-Accounting.md) |
| Logical data model | [MOD-33-Finance-General-Accounting-Logical-Data-Model.md](./MOD-33-Finance-General-Accounting-Logical-Data-Model.md) |
| Owner Decision Register | [MOD-33-Owner-Decision-Register.md](../Architecture/MOD-33-Owner-Decision-Register.md) |

---

## Normative P0.1 closure addendum

Where earlier summary tables are less specific, this section is normative for the later Prisma design.

### Organization, dimensions, editions, and boundaries

MOD-33 supports diagnostic centers, standalone laboratories, clinics, hospitals, trading companies, distribution companies, and manufacturing companies. Editions may hide inapplicable features, but they do not change ledger invariants. Diagnostic edition may offer MOD-33 as optional/recommended; clinic/hospital as recommended; trading/distribution/manufacturing as required; Enterprise includes it. Activation remains a future tenant-controlled entitlement after implementation and QC.

Department is an existing organization reference, not a MOD-33 master. Cost center and project are optional voucher-line dimensions whose masters are owned by MOD-41 or an owner-approved shared service. Item references are owned by MOD-35 and asset references by MOD-36. References are validated at posting time, then retained as stable IDs/snapshots so later master archival cannot erase accounting meaning.

The COA recommendation is tenant-wide with branch availability controls; branch-specific COA remains an open owner decision. Reports always filter tenant first, then authorized branch set. Consolidated tenant reporting aggregates branches on the common COA and applies explicit, auditable inter-branch elimination policy. Comparative reports use the same published layout version or disclose mapping changes.

### Complete JournalIntent contract

`JournalIntent` contains:

- `tenantId`, `branchId`, `fiscalYearId`, `accountingPeriodId`
- `transactionDate`, `postingDate`, `voucherType`
- `sourceModule`, `sourceDocumentType`, `sourceDocumentId`
- deterministic `idempotencyKey`
- `transactionCurrency`, `baseCurrency`, `exchangeRate` and rate source/effective snapshot
- `narration`, `referenceNo`, attachment references
- actor and approval context
- `sourceStateVersion`
- ordered `lines`

`JournalIntentLine` contains:

- `accountId` or an `accountSystemRole` to resolve under the tenant/branch/effective-date mapping
- transaction-currency `debitAmount` and `creditAmount`
- `baseDebitAmount` and `baseCreditAmount`
- typed party reference and optional subledger reference
- department, cost-center, and project references
- item reference where applicable and asset reference where applicable
- description and stable line reference

Amounts are fixed-precision decimals. A resolved account ID and role-mapping snapshot are stored on the posted line/header trace. Attachment references are validated links, not client-supplied filesystem paths.

### Posting validation

Posting rejects unless all of the following hold:

1. Transaction-currency debit total equals credit total and base-currency debit total equals credit total under the documented rounding tolerance.
2. Debit and credit are non-negative; one line cannot contain both; every line has exactly one positive side; the journal is not empty or zero-only.
3. Fiscal year contains the posting date and the supplied accounting period belongs to it, contains the posting date, and is open for this actor/event.
4. Every account is active, postable, belongs to the tenant, is available to the branch, and is valid for the effective date.
5. Control-account, party, and subledger references are consistent; required account-role mappings exist and match allowed account types.
6. Currency codes/scales are valid; base currency matches the fiscal year; foreign currency has an approved positive rate snapshot and both currency totals balance.
7. Source status is eligible, required approval is completed, actor/system principal has scoped permission, and segregation-of-duties policy passes.
8. The idempotency key is unique for the tenant or is an exact replay; the source/event is not already posted under another key.
9. The locked source row still has `sourceStateVersion`; tenant/branch/source identity and relevant financial fields are unchanged.
10. Attachments meet tenant type, size, malware-scan, retention, access, and required-evidence policy.

Validation that depends on mutable state is repeated after locks are acquired inside the posting transaction.

### Atomic posting and safe outcomes

One database transaction must lock or otherwise compare-and-swap the relevant source state and sequence, revalidate mutable rules, allocate the voucher number, create the voucher header and lines, create source linkage and status history, create required MOD-04 audit evidence, update the source with its posted voucher reference, and commit only when every step succeeds. Any error rolls back all these writes. Events emitted to other modules use an outbox or equivalent after-commit mechanism; no consumer sees a posting that later rolls back.

| Condition | Safe result |
| :--- | :--- |
| Duplicate idempotency request with identical canonical payload | Return the original committed result with `replayed=true`; create no rows |
| Same key with different payload | Conflict/security error; no write; audit mismatch |
| Source already posted | Return its existing posting only when event/payload match; otherwise conflict |
| Locked period | Reject before writing; never shift posting date silently |
| Account deactivated during posting | In-transaction revalidation rejects and rolls back |
| Stale source state version | Concurrency conflict; caller refreshes and rebuilds intent |
| Unbalanced journal | Validation error with totals; no draft or partial posted record |
| Missing role mapping | Configuration error identifying role/scope; no fallback account |
| Timeout or uncertain client response | Caller retries the same key; engine returns committed result or safely attempts once |

Retries are bounded and limited to transient transaction/deadlock failures. Business-validation failures are not automatically retried. Posting failure leaves the operational document eligible for controlled retry and records no false posted reference.

### Reversal, correction, cancellation, and repost

The original posted voucher and lines remain unchanged. A reversal command identifies the original, reason, actor, permission, posting date, and unique idempotency key. MOD-33 creates a separate posted voucher with offsetting debit/credit lines, identical dimensional/source trace where applicable, and bidirectional links. Reversal posts only into an open period; handling a locked original period follows owner policy. The source module receives a durable reversal result and updates operational state without deleting history. A corrected repost is a third voucher with a new source version and idempotency key. The history viewer presents original → reversal → corrected repost as one audit chain.

### Existing billing adapter and operational boundaries

MOD-10 remains authoritative for operational `Invoice`, `InvoicePayment`, approved discount, cancellation eligibility, and any future refund model. MOD-33 is authoritative for posted accounting. MOD-16 displays patient-centric due/subledger/360 information and is not a GL. MOD-24 owns billing hold and report-release clearance. The adapter must not post an event whose source status or hold policy is ineligible, and posting never grants report release.

| Source event | Illustrative intent |
| :--- | :--- |
| Invoice issue | Dr Patient Accounts Receivable; Cr Service Revenue; Cr Output VAT where applicable |
| Invoice payment | Dr configured Cash/Bank; Cr Patient Accounts Receivable |
| Approved invoice discount | Dr Discount/Contra Revenue; Cr Patient Accounts Receivable |
| Payment reversal | Separate controlled reversal of the payment voucher; never delete original |
| Legally allowed invoice cancellation | Reverse the issued-invoice voucher after MOD-10 authorizes cancellation; retain invoice and reasons |
| Refund | If/when MOD-10 has an approved refund model: Dr Patient AR/refund clearing as policy requires; Cr Cash/Bank, linked to payment and approval |
| Due balance | Operational MOD-10 due remains immediate workflow truth until reconciliation is proven; MOD-33 AR is accounting truth |
| Billing hold | MOD-24 continues to block release; adapter validates hold/clearance eligibility |
| Patient ledger display | MOD-16 combines authorized operational context with reconciled MOD-33 patient subledger data and labels freshness/source |

Existing `Invoice`, `InvoicePayment`, discount, and payment-reversal models are not mutated by this architecture task. The future adapter must map their real statuses and version fields during implementation discovery rather than assuming names. It stores voucher references without allowing MOD-33 to bypass MOD-10 business rules.

### Pilot migration and rollback

The recommended but owner-unapproved pilot strategy is **hybrid cutover**:

1. Choose a signed cutover instant at the start of an open accounting period.
2. Reconcile MOD-10 invoice gross, discounts, payments, reversals, refunds if any, and due by patient/branch to a cutover schedule.
3. Post opening AR by patient plus the matching opening-control/equity entries through an approved OpeningBalanceBatch.
4. Optionally catch up only transactions from the current open fiscal year when their history can be deterministically mapped; tag older records `LEGACY_UNPOSTED_BEFORE_CUTOVER` for accounting integration without changing operational status.
5. Reconcile opening batch → AR control → MOD-10 due and sign exceptions. Preserve hashes, source extracts, mapping version, approvers, and migration audit.
6. After cutover, reversals of migrated opening items use opening-adjustment/reversal policy and never invent a historical payment posting.
7. Rollback before production acceptance reverses/cancels the cutover batch in a controlled open period and disables the adapter; it does not delete vouchers. MOD-10 remains operational throughout, preserving reporting continuity.

Operational due remains the workflow source until parallel reconciliation has passed the owner-defined period and tolerance. No historical invoice is marked posted merely because its balance was included in opening AR.

### Reports, failure behavior, and non-functional requirements

General Ledger, Account Ledger, Cash Book, Bank Book, Trial Balance, P&L, Balance Sheet, Cash Flow, Changes in Equity, branch/consolidated, and comparative reports derive from posted lines. Financial statement layouts control presentation only. Optional projections must be rebuildable and reconciled to posted lines; no cached balance is authoritative.

Statement customization is limited to versioned layouts, approved account selectors, ordering, labels, signs, subtotals, and constrained deterministic formulas. It cannot change voucher facts. Bank reconciliation matches statement items to posted bank lines without editing either.

Expected pilot volume is tens of thousands of vouchers and hundreds of thousands of lines per tenant/year; architecture must scale to millions of lines with tenant-leading indexes, bounded queries, pagination, streaming exports, and asynchronous generation for large reports. Posting targets a short transaction and deterministic outcome rather than a hard UI SLA; the implementation task must set measured budgets and load tests.

Security requires tenant/branch filters, least-privilege RBAC, scoped system principals, SoD, protected bank/attachment data, audit of read/export for sensitive reports, CSRF/session protections, input validation, and no client-trusted totals. Localization supports Bangla and Hindi labels, Arabic/Urdu RTL mirroring, locale-aware dates/numbers/currency, Unicode search/export, and translatable print layouts. Accessibility targets WCAG 2.1 AA, complete keyboard operation, visible focus, semantic tables/forms, non-color-only status, screen-reader labels, and responsive inquiry/approval screens; dense statements may use horizontal scrolling and print-specific layouts.

### Rollout, QC, go-live, and hypercare

Pilot rollout proceeds configuration sandbox → reconciled migration rehearsal → restricted finance pilot → parallel daily/period reconciliation → owner go-live decision. AI-QC remains NOT RUN until implementation exists. Manual QC/UAT must separately cover tenant/branch isolation, permissions/SoD, every lifecycle, period locks/reopen, account/party controls, balance/currency rounding, idempotency/concurrency, failures/rollback/retry, reversal chain, billing events/holds, migration reconciliation, reports/exports/prints/locales/RTL/accessibility/performance/security.

Go-live requires implemented scope, approved owner decisions, reviewed schema/migration, passing automated checks, AI-QC evidence, signed Manual QC/UAT, reconciled opening/current transactions, tested backup/restore and rollback runbook, trained users, monitoring, and explicit production approval. Hypercare includes daily AR/GL/cash/bank reconciliation, failed-intent/idempotency monitoring, projection-drift checks if any, exception ownership, rapid rollback criteria, and signed exit after the agreed stable period.

Open owner decisions are maintained in the linked Owner Decision Register and must not be silently treated as approved.

---

## Status declaration

| Gate | Status |
|------|--------|
| Documentation | DETAILED ARCHITECTURE APPROVED (design) |
| Implementation | NOT STARTED |
| AI-QC | NOT RUN |
| Manual QC/UAT | NOT RUN |
| Production | NOT APPROVED |

This file is design documentation only. It does not implement schema, routes, UI, or tenant enablement.
