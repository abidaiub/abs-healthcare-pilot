# MOD-33 — Owner Decision Register

| Field | Value |
| :--- | :--- |
| Status | OPEN — OWNER APPROVAL REQUIRED |
| Implementation | Planned / Not Started |
| Last reviewed | 2026-07-28 |

Existing ADRs were reviewed before this register. Accepted ADR baselines are not duplicated as open decisions: central MOD-33 posting authority (ADR-001), enterprise inventory boundary (ADR-002/004), MOD-16 versus GL (ADR-005), GRNI (ADR-006), immutable reversal (ADR-007), BDT-first readiness (ADR-009), and a generic typed-party/subledger capability (ADR-010). This register captures policy detail that those ADRs do not settle. Recommendations are not approvals.

| # | Decision needed | Recommended default | Alternatives | Impact | Approval status | Phase |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| ODR-01 | Generic Party physical shape | One lightweight Party identity with role memberships; add typed finance profiles only for attributes not owned elsewhere | Separate party per type; no Party table and polymorphic operational refs | Deduplication, FKs, patient-scale volume, overlap | OPEN | Before P1 schema; profile tables P2 |
| ODR-02 | Patient/customer/supplier overlap | One real-world party may carry multiple roles; operational masters remain distinct and link through reviewed crosswalks | Always separate identities; automatic fuzzy merge | AR/AP netting, privacy, duplicate statements | OPEN | Before Party implementation |
| ODR-03 | COA templates by business type | Versioned starter templates for healthcare, trading/distribution, and manufacturing; tenant copies are independently governed | Blank COA; one universal template | Onboarding, mappings, upgrades, reporting comparability | OPEN | Before P1 seed/template design |
| ODR-04 | Account code length/hierarchy | 4–20 character segmented alphanumeric code; 3–6 logical levels; code unique tenant-wide | Fixed numeric 4/6/8 digit; unrestricted text | Import compatibility, sorting, statement tree | OPEN | Before P1 schema |
| ODR-05 | COA scope | Tenant-wide COA with branch availability/mapping, never duplicate branch trees by default | Branch-specific COA; tenant + branch overlays | Consolidation, uniqueness, permissions | OPEN | Before P1 schema |
| ODR-06 | Voucher numbering scope | Branch + voucher type + fiscal year atomic sequence | Tenant-central; branch without FY reset | Legal sequence, concurrency, gaps, printed references | OPEN | Before posting implementation |
| ODR-07 | Fiscal-year number reset | Reset each voucher-type sequence at FY boundary; never reuse numbers; include branch/type/FY in display | Continuous lifetime sequence; calendar-year reset | Audit trail, statutory expectations, migration | OPEN | Before posting implementation |
| ODR-08 | Period reopen authority | Finance Controller proposes; separate authorized owner/CFO approves; time-bound reopen; reason mandatory | Single controller; platform admin; never reopen | SoD, late adjustments, statutory lock | OPEN | Before period workflow |
| ODR-09 | Historical billing migration | Hybrid: reconciled opening AR at cutover plus optional current-open-FY catch-up | Opening-only; full history | Timeline, reporting continuity, audit risk | OPEN — hybrid recommended | Before pilot data migration |
| ODR-10 | Reporting projections/cache | Posted lines are truth; no cache P1; add only measured, rebuildable, monitored projections | Precomputed balances at launch; live-only forever | Performance, drift, recovery complexity | OPEN | P1 default; reassess P2 |
| ODR-11 | Multi-currency phase | Persist currency/rate snapshot shape in P1; activate foreign-currency operations in P2 after policy/UAT | Full P1 FX; BDT-only schema | Schema longevity, rounding, rollout risk | OPEN | Before P1 schema |
| ODR-12 | Exchange gain/loss | Realized FX on settlement in first active FX phase; unrealized revaluation deferred and separately approved | Both at launch; manual journals only | Period close, taxation, statement accuracy | OPEN | Before FX implementation |
| ODR-13 | Tax/VAT engine ownership | Source/Tax service calculates; MOD-33 validates and posts supplied tax lines; retain tax snapshot/reference | MOD-33 calculates; each source calculates independently | Compliance, consistency, adapter contract | OPEN | Before tax adapter |
| ODR-14 | Cost-center ownership | MOD-41 owns master and hierarchy; MOD-33 stores validated optional references on lines | MOD-33 owns; shared platform dimension service | Dependency direction, budget actuals | OPEN | Before dimension schema |
| ODR-15 | Project dimension ownership | Shared organization/project master or MOD-41 owns; MOD-33 consumes immutable ID/reference | MOD-33 owns; each source owns unvalidated text | Cross-module costing, archival, reports | OPEN | Before dimension schema |
| ODR-16 | Financial-statement customization | Versioned approved layouts using constrained account selectors; fixed starter layouts; no arbitrary executable formulas | Fixed only; unrestricted formula builder | Auditability, support, security | OPEN | P2 |
| ODR-17 | Cash-flow method | Indirect method for initial statement; direct-method report deferred | Direct; both | Mapping needs, reconciliation, statutory presentation | OPEN | P2 reporting |
| ODR-18 | Branch consolidation/inter-branch | Tenant consolidation from same COA; explicit due-to/due-from accounts and balanced paired inter-branch intent | Elimination only at report time; separate books | Branch TB balance, eliminations, audit | OPEN | Before multi-branch postings |
| ODR-19 | Document retention | Minimum seven completed FYs online/archive, legal hold overrides deletion; owner/legal review required | Longer fixed term; per-document class | Storage, compliance, purge jobs | OPEN | Before P2 attachments/go-live |
| ODR-20 | Bangladesh statutory vs global rules | Configurable global core plus Bangladesh policy pack (FY, VAT/tax exports, formats); legal owner validates each release | Bangladesh hard-coded; global-only baseline | Localization, compliance claims, upgrades | OPEN | Before go-live |
| ODR-21 | Posting-date versus transaction-date exceptions | Posting date controls period; transaction date retained; backdate requires open period and permission | Force dates equal; silent current-period shift | Cutoff, reporting, audit | OPEN | Before posting implementation |
| ODR-22 | Reversal of locked-period voucher | Reverse in current open period with original date/reference retained; reopen only by ODR-08 governance | Always reopen original; prohibit reversal | Comparative statements, audit, operations | OPEN | Before reversal implementation |
| ODR-23 | Statement rounding/materiality | Calculate at full precision and round only presentation totals with disclosed rounding line if needed | Round every line; silent plug | Balance presentation, export parity | OPEN | Before reporting |

## Approval protocol

The business owner records Approved/Rejected/Deferred, approver identity, decision date, rationale, and any constraints for each row. A decision that changes an accepted ADR requires an ADR supersession; editing this register alone is insufficient. No recommendation above may be encoded as irreversible schema or production policy while its status is OPEN.
