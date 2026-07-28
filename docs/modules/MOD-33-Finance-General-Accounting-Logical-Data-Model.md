# MOD-33 — Technology-Neutral Logical Data Model

| Field | Value |
| :--- | :--- |
| Status | ARCHITECTURE APPROVED |
| Implementation | Planned / Not Started |
| AI-QC | NOT RUN |
| Manual QC/UAT | NOT RUN |
| Production | Not Approved |
| Scope | Logical design only; not a Prisma schema |

This document removes schema-level assumptions before the later Prisma design task. It does not authorize tables, migrations, routes, services, seeds, or balance caches.

## Accounting source of truth

Only immutable lines of a **Posted Voucher** are authoritative accounting records. Voucher headers provide lifecycle, source, period, currency, and reversal context. Draft/Submitted/Approved vouchers, operational source documents, subledger projections, reports, caches, and statement layouts are not posted accounting facts.

No pre-calculated balance table is authoritative. Any later projection must be optional, rebuildable exclusively from posted voucher lines, versioned by projection logic, monitored for drift, and disposable without loss of accounting history.

## Cross-entity rules

- Every tenant-owned record carries `tenantId`; branch-owned records also carry `branchId`. Foreign keys must be checked within the same tenant and, where required, the same branch.
- Primary identities are opaque immutable IDs. Human-readable codes and numbers are alternate keys, never reused after financial use.
- Editable masters use `rowVersion` (or an equivalent compare-and-swap token). Posted vouchers and posted lines are append-only and have no edit concurrency path.
- Financial and audit records are never hard-deleted. Masters may be archived/inactivated only when history remains resolvable.
- All state transitions record actor, time, reason/comment where applicable, correlation/request ID, and before/after values through MOD-04 audit conventions.
- Source traceability uses `sourceModule`, `sourceDocumentType`, `sourceDocumentId`, optional source-line reference, `sourceStateVersion`, and `idempotencyKey`.
- Monetary fields use fixed-precision decimal semantics; currency scale and rounding policy are explicit. Timestamps are stored as instants; fiscal dates are business dates.
- Baseline indexes begin with `tenantId`; branch/date, account/date, party/date, source, status, and idempotency access paths are added as specified below.
- Retention is tenant-policy and law driven, with a recommended minimum of seven completed fiscal years pending owner/statutory confirmation. Archival must preserve queryability, audit chain, and legal export.

## Phase classification

### Minimum P1 entities

`FiscalYear`, `AccountingPeriod`, `Account`, `AccountSystemRole`, `AccountRoleMapping`, `Voucher`, `VoucherLine`, `VoucherStatusHistory`, and `OpeningBalanceBatch`.

`Currency` may use the existing localization/platform currency catalog if it meets immutable ISO-code and scale requirements; otherwise it is a minimal P1 reference entity. A dedicated Party table is not required for the first P1 journal foundation if existing patient/customer/supplier identities can be referenced through a validated typed reference.

### P2 entities

`Party` with typed extensions where needed, `PartyAccount`, `BankAccount`, `BankReconciliation`, `BankReconciliationLine`, and `DocumentAttachment`. Operational multi-currency activates `ExchangeRate` in P2 or later. `FinancialStatementLayout` and `FinancialStatementNode` are P2 only if owner-approved customization is required.

### Deferred

`PostingBatch` is deferred until a demonstrated bulk-processing need. `SubledgerEntry` is deferred and should exist only as a rebuildable projection if voucher-line dimensions cannot meet measured reporting needs. Rich party profile extensions, tenant-editable statement formulas, and automated exchange gain/loss are deferred.

### Do not create

- No authoritative account-balance, daily-balance, trial-balance, party-balance, or financial-statement-result table.
- No separate PatientLedger GL, SupplierLedger GL, PharmacyLedger, MedicationStockLedger, or module-specific journal table.
- No duplicate Department, CostCenter, Project, Patient, Supplier, Employee, Shareholder, FixedAsset, Item, Warehouse, or Branch master inside MOD-33.
- No mutable posted-journal staging table presented as accounting truth.

## Entity specifications

### FiscalYear — P1

- **Purpose/owner/scope:** MOD-33 fiscal envelope; tenant-wide, with branch books referencing it.
- **Identity and fields:** `id`; `tenantId`, `code`, `name`, `startDate`, `endDate`, `baseCurrencyCode`, `status`, `closedAt/by`, `rowVersion`.
- **Uniqueness/FKs:** unique `(tenantId, code)` and non-overlapping date range; base currency references platform `Currency`.
- **Relationships/lifecycle:** owns periods and opening batches; Draft → Open → Closing → Closed. Reopen is governed and audited, not a silent status edit.
- **Mutability/delete:** dates editable only before opening and before dependent vouchers; archive, never delete after use.
- **Trace/audit/concurrency:** creation and every status/date change audited; `rowVersion`.
- **Indexes/volume/retention/migration:** tenant+date/status; normally 1–2 active and tens retained per tenant; retain with books; migration must validate no overlaps and map legacy dates.

### AccountingPeriod — P1

- **Purpose/owner/scope:** MOD-33 posting-control interval; tenant fiscal year, optionally carrying branch-specific lock overlays later.
- **Identity and fields:** `id`; `tenantId`, `fiscalYearId`, `periodNo`, `name`, `startDate`, `endDate`, `status`, `softClosedAt`, `lockedAt`, `reopenedUntil`, `rowVersion`.
- **Uniqueness/FKs:** unique `(tenantId, fiscalYearId, periodNo)`; dates contiguous, within fiscal year, non-overlapping.
- **Relationships/lifecycle:** Future → Open → SoftClosed → Locked; controlled Reopened returns to the prior status on expiry.
- **Mutability/delete:** dates immutable after first dependent voucher; no delete after use.
- **Trace/audit/concurrency:** open/close/reopen reason, approvers, prior state, correlation ID; `rowVersion`.
- **Indexes/volume/retention/migration:** tenant+status and tenant+date-range; about 12–13 per year; permanent with ledger; migration derives period from valid posting date.

### Account — P1

- **Purpose/owner/scope:** MOD-33 tenant Chart of Accounts; recommended tenant-wide with optional branch availability, pending owner approval.
- **Identity and fields:** `id`; `tenantId`, `code`, localized names, `parentAccountId`, `accountType`, `normalBalance`, `isPostable`, `isControlAccount`, `isActive`, hierarchy path/level, allowed currency behavior, `rowVersion`.
- **Uniqueness/FKs:** unique code in approved COA scope; parent is same tenant; cycles prohibited; only postable leaves accept lines.
- **Relationships/lifecycle:** parent/children, role mappings, voucher lines; Draft → Active → Inactive/Archived.
- **Mutability/delete:** code, type, parent, and control nature locked after posting unless a governed migration proves no semantic rewrite; never delete used accounts.
- **Trace/audit/concurrency:** all structural/activation changes audited; `rowVersion`.
- **Indexes/volume/retention/migration:** tenant+code unique, tenant+parent, tenant+type+active; hundreds to low thousands; permanent; legacy mapping requires signed mapping and balanced reconciliation.

### AccountSystemRole — P1 reference

- **Purpose/owner/scope:** MOD-33 stable semantic keys such as `PATIENT_AR`, `AP_CONTROL`, `CASH`, `BANK`, `RETAINED_EARNINGS`; platform-defined and versioned.
- **Identity and fields:** immutable `roleKey`; description, required dimensions/party types, allowed account types, phase.
- **Uniqueness/FKs:** role key globally unique; referenced by mappings and intents.
- **Lifecycle/mutability/delete:** Published → Deprecated; meaning immutable, never delete a referenced key.
- **Trace/audit/concurrency:** release/version audit; no row concurrency if code-controlled.
- **Indexes/volume/retention/migration:** key lookup; tens; permanent; aliases require explicit migration.

### AccountRoleMapping — P1

- **Purpose/owner/scope:** MOD-33 resolves a system role to an account for tenant and optional branch/effective period.
- **Identity and fields:** `id`; `tenantId`, optional `branchId`, `roleKey`, `accountId`, `effectiveFrom/To`, `isActive`, `rowVersion`.
- **Uniqueness/FKs:** one active non-overlapping mapping per `(tenant, branch-or-default, roleKey)`; account and branch same tenant.
- **Relationships/lifecycle:** Draft → Active → Superseded; historical mapping remains attached to posted intent resolution.
- **Mutability/delete:** activated mapping is superseded, not rewritten or deleted after use.
- **Trace/audit/concurrency:** actor/reason and effective-date audit; `rowVersion`.
- **Indexes/volume/retention/migration:** tenant+role+branch+effective date; tens/hundreds; retain permanently; legacy codes need verified role mapping.

### Voucher — P1

- **Purpose/owner/scope:** MOD-33 journal header and lifecycle/source envelope; tenant + mandatory branch.
- **Identity and fields:** `id`; tenant/branch/FY/period IDs, type, number, transaction/posting dates, status, transaction/base currency, exchange-rate snapshot, narration/reference, source fields, `sourceStateVersion`, `idempotencyKey`, approval context, reversal links, created/submitted/approved/posted actors and times, `rowVersion`.
- **Uniqueness/FKs:** unique idempotency key per tenant; voucher number unique in approved numbering scope; fiscal/period/branch/currency same tenant; reversal links same tenant.
- **Relationships/lifecycle:** lines, history, attachments, opening batch; Draft → Submitted → Approved → Posted or Rejected; Posted may be offset by separate Reversal.
- **Mutability/delete:** editable in Draft; lifecycle-limited metadata thereafter; financially immutable when Posted; draft cancellation is retained, not hard-deleted.
- **Trace/audit/concurrency:** complete source, request, actor and transition audit; `rowVersion` before posting, append-only after.
- **Indexes/volume/retention/migration:** tenant+branch+postingDate, account via lines, source triple, status, voucher number, idempotency; high volume; permanent statutory retention; migrated history tagged with migration batch and reconciliation evidence.

### VoucherLine — P1

- **Purpose/owner/scope:** MOD-33 authoritative debit/credit journal facts; inherits tenant and branch from voucher, with redundant tenant key allowed for isolation/indexing.
- **Identity and fields:** `id`; `voucherId`, `lineNo`, `accountId`, transaction/base debit and credit, typed party/subledger reference, department/cost-center/project/item/asset references, description, line/source reference.
- **Uniqueness/FKs:** unique `(voucherId, lineNo)`; account same tenant; dimensions validated against owning modules and source scope.
- **Relationships/lifecycle:** exists with voucher; no independent status.
- **Mutability/delete:** draft lines editable; all posted lines immutable and never deleted.
- **Trace/audit/concurrency:** source-line trace plus parent audit; draft writes protected by voucher version.
- **Indexes/volume/retention/migration:** tenant+account+posting path, party, dimensions, voucher; very high (multiple per voucher); retain with voucher; migrated lines must balance per voucher and batch.

### VoucherStatusHistory — P1

- **Purpose/owner/scope:** MOD-33 append-only transition/approval/rejection/reversal evidence; inherits voucher tenant.
- **Identity and fields:** `id`; `voucherId`, from/to status, actor type/id, timestamp, comment/reason, approval level, correlation ID.
- **Uniqueness/FKs:** voucher FK; optional request-transition dedupe key.
- **Lifecycle/mutability/delete:** append-only; never edit or delete.
- **Trace/audit/concurrency:** is itself audit evidence and also covered by MOD-04 tamper controls.
- **Indexes/volume/retention/migration:** voucher+time, actor+time; several per voucher; retain with voucher; import legacy approval events only when trustworthy, otherwise mark unavailable.

### OpeningBalanceBatch — P1

- **Purpose/owner/scope:** MOD-33 governed cutover/opening load; tenant + branch + fiscal year.
- **Identity and fields:** `id`; tenant/branch/FY, cutover date, source description/hash, status, transaction/base totals, validation summary, posted voucher references, `rowVersion`.
- **Uniqueness/FKs:** one approved active batch per declared cutover scope unless explicit superseding reversal; all references same tenant.
- **Relationships/lifecycle:** Draft → Validated → Approved → Posted or Rejected; correction by reversing posted vouchers and new batch.
- **Mutability/delete:** editable before approval; immutable once posted; no delete after validation evidence is relied on.
- **Trace/audit/concurrency:** importer, approvers, file hash, reconciliation and exceptions; `rowVersion`.
- **Indexes/volume/retention/migration:** tenant+branch+FY+status; very low; permanent; import requires AR/AP party detail and signed TB reconciliation.

### Currency — existing platform model preferred; P1 reference

- **Purpose/owner/scope:** platform localization reference consumed by MOD-33.
- **Identity and fields:** immutable ISO 4217 code; display name, symbol, decimal scale, active flag.
- **Uniqueness/FKs:** code unique globally; referenced by FY, voucher, bank and rates.
- **Lifecycle/mutability/delete:** Published → Inactive; scale/code immutable after use; never delete.
- **Trace/audit/concurrency:** reference-data version audit.
- **Indexes/volume/retention/migration:** code; low; permanent; normalize legacy codes. Do not duplicate if the platform model meets these rules.

### ExchangeRate — P2/deferred activation

- **Purpose/owner/scope:** MOD-33 rate source and dated quote; tenant or approved shared provider.
- **Identity and fields:** `id`; tenant/provider, from/to currency, rate type, effective instant/date, rate, source/reference, approval status, `rowVersion`.
- **Uniqueness/FKs:** unique provider/pair/type/effective instant; currencies valid and different.
- **Relationships/lifecycle:** Draft → Approved → Superseded; vouchers copy an immutable snapshot rather than depend on future edits.
- **Mutability/delete:** approved rate immutable; correction creates a new version.
- **Trace/audit/concurrency:** source and approval audit; `rowVersion`.
- **Indexes/volume/retention/migration:** pair+effective date; medium; retain while referenced; no synthetic historic rates without evidence.

### Party — P2 unless existing typed references suffice

- **Purpose/owner/scope:** MOD-33 lightweight generic subledger identity linking operational masters; tenant-wide, optional branch defaults.
- **Identity and fields:** `id`; `tenantId`, party type(s), display code/name, owning module, operational ID, active state, `rowVersion`.
- **Uniqueness/FKs:** unique owning-module/operational-type/ID per tenant; overlap handled by roles on one party where owner-approved.
- **Relationships/lifecycle:** optional typed profiles and party accounts; Active → Inactive/Merged.
- **Mutability/delete:** identity link and merge governed; never delete with journal use.
- **Trace/audit/concurrency:** create/type/merge audit; `rowVersion`.
- **Indexes/volume/retention/migration:** operational reference, display code, type; potentially patient-scale; retain referenced shells permanently; deduplicate through reviewed crosswalk.

### PartyProfile or typed extensions — P2/deferred

- **Purpose/owner/scope:** typed finance-only attributes that cannot remain in operational masters; tenant scoped and owned by the operational module where practical.
- **Identity and fields:** party ID plus profile type; credit terms/finance classification only, not copied demographics.
- **Uniqueness/FKs:** one active profile per party/type; party same tenant.
- **Lifecycle/mutability/delete:** editable active profile; archive, no history destruction.
- **Trace/audit/concurrency:** changes audited with `rowVersion`.
- **Indexes/volume/retention/migration:** party+type; only parties needing extension; retain financial history. Avoid creating empty one-to-one tables.

### PartyAccount — P2

- **Purpose/owner/scope:** MOD-33 allowed/default party-to-control-account relationship; tenant and optional branch/effective dates.
- **Identity and fields:** `id`; party, account, role, branch, effective range, active state, `rowVersion`.
- **Uniqueness/FKs:** non-overlapping active mapping per party/role/branch; same-tenant party/account.
- **Lifecycle/mutability/delete:** Draft → Active → Superseded; supersede used mappings.
- **Trace/audit/concurrency:** mapping-change audit; `rowVersion`.
- **Indexes/volume/retention/migration:** party, account, role; medium/high; retain with postings; legacy mapping reconciled to control accounts.

### BankAccount — P2

- **Purpose/owner/scope:** MOD-33 bank-book master linked one-to-one or many-to-one to a postable bank GL account; tenant + branch.
- **Identity and fields:** `id`; bank/branch name, masked account number and protected token, currency, GL account, opening date, active state, `rowVersion`.
- **Uniqueness/FKs:** protected account fingerprint unique per tenant; GL account same tenant and valid BANK role.
- **Lifecycle/mutability/delete:** Draft → Active → Closed/Archived.
- **Trace/audit/concurrency:** sensitive-field access and changes audited; `rowVersion`.
- **Indexes/volume/retention/migration:** tenant+branch+active, fingerprint; low; retain after closure; never store credentials in this entity.

### BankReconciliation — P2

- **Purpose/owner/scope:** MOD-33 reconciliation session for one bank account and statement interval; tenant + branch.
- **Identity and fields:** `id`; bank account, statement from/to, opening/closing balance, status, preparer/approver, `rowVersion`.
- **Uniqueness/FKs:** prevent overlapping Approved sessions for same bank account unless policy explicitly permits.
- **Relationships/lifecycle:** owns reconciliation lines; Draft → InProgress → Submitted → Approved or Reopened.
- **Mutability/delete:** editable before approval; approved session immutable, correction through reopen with audit.
- **Trace/audit/concurrency:** statement source/hash, approvals, reopen reason; `rowVersion`.
- **Indexes/volume/retention/migration:** bank+date+status; monthly per account; statutory retention; legacy unmatched items may enter as documented opening reconciling items.

### BankReconciliationLine — P2

- **Purpose/owner/scope:** MOD-33 match between statement item and posted bank voucher line.
- **Identity and fields:** `id`; reconciliation ID, optional voucher-line ID, statement reference/date/amount, match type/status, cleared date, comment.
- **Uniqueness/FKs:** a posted bank line cannot be actively cleared twice; parent and voucher line same tenant/bank.
- **Lifecycle/mutability/delete:** Unmatched → Matched → Cleared; inherits approved immutability.
- **Trace/audit/concurrency:** match/unmatch actor and reason; parent `rowVersion` or line version.
- **Indexes/volume/retention/migration:** reconciliation, voucher line, reference/date/amount; medium/high; retain with header.

### DocumentAttachment — P2, existing document service preferred

- **Purpose/owner/scope:** link MOD-33 records to immutable document-service objects; tenant scoped.
- **Identity and fields:** `id`; owner type/ID, document object/version ID, filename/media type/size/hash, classification, uploader/time.
- **Uniqueness/FKs:** owner and document same tenant; unique owner/document version link.
- **Lifecycle/mutability/delete:** Active → Superseded/RetentionHold/Archived; posted evidence cannot be silently replaced.
- **Trace/audit/concurrency:** upload/view/remove/hold audit; append-only link versions.
- **Indexes/volume/retention/migration:** owner, hash, retention state; medium; follow financial retention and legal hold. Do not duplicate file blobs if platform storage exists.

### FinancialStatementLayout / FinancialStatementNode — P2 or deferred

- **Purpose/owner/scope:** MOD-33 presentation definitions, never balances; tenant template with optional branch applicability.
- **Identity and fields:** layout ID/type/name/version/status; node ID, parent, order, label, account-selection rule, sign/display rule, subtotal/formula restriction.
- **Uniqueness/FKs:** layout version/name unique per tenant/type; acyclic node tree; referenced accounts same tenant.
- **Lifecycle/mutability/delete:** Draft → Validated → Published → Retired; published versions immutable.
- **Trace/audit/concurrency:** publish approval and validation results; draft `rowVersion`.
- **Indexes/volume/retention/migration:** tenant+type+status, layout+parent+order; low; retain versions used for issued statements. Formula language must be constrained, deterministic, and non-code-executing.

### PostingBatch — deferred

- **Purpose/owner/scope:** MOD-33 operational grouping and restart visibility for bulk journal intents; tenant + branch where homogeneous.
- **Identity and fields:** batch ID, source, request counts, status, started/completed times, correlation ID, `rowVersion`.
- **Uniqueness/FKs:** source batch reference unique per tenant; individual intents still require independent idempotency.
- **Lifecycle/mutability/delete:** Queued → Running → Completed/PartiallyFailed/Failed; batch status never changes accounting truth.
- **Trace/audit/concurrency:** per-intent result references and operator audit; `rowVersion`.
- **Indexes/volume/retention/migration:** tenant+source+status+time; low/medium; retain operational evidence per policy. Do not use as a journal header.

### SubledgerEntry — do not create as P1 authority; optional projection only

- **Purpose/owner/scope:** possible MOD-33 read projection of posted voucher lines by typed party.
- **Identity and fields:** deterministic source voucher-line ID plus projection version and derived party/account/amount/date fields.
- **Uniqueness/FKs:** one projection row per source line and projection version.
- **Lifecycle/mutability/delete:** rebuildable; may be dropped and regenerated; never directly edited or posted to.
- **Trace/audit/concurrency:** records source line and projector version; checkpoint concurrency only.
- **Indexes/volume/retention/migration:** party/date/account; very high; retention no longer than source and rebuildable. Reports must be able to reconcile it to posted lines.

## Prisma-design entry gate

Before schema design, owners must resolve the decisions referenced in the Owner Decision Register, especially party overlap/profile shape, COA scope/code, voucher numbering, period reopen authority, migration strategy, multi-currency phase, dimension ownership, and retention. Schema design must provide a mapping from every logical invariant here to a database constraint, transaction check, application validation, or documented reason why enforcement is deferred.
