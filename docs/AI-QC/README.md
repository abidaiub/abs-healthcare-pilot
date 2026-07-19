# ABSHealthcareLite — AI Quality Control (AI-QC)

**Documentation root:** `docs/AI-QC/`  
**Project:** ABSHealthcareLite Pilot (`abs-healthcare-pilot`)  
**Framework version:** v1.0 (Frozen)

---

## Purpose of AI QC

AI Quality Control (AI-QC) is the **official, evidence-based audit process** used to verify that ABSHealthcareLite implementation aligns with approved product documentation, architecture rules, and healthcare workflow requirements **before** manual QA and UAT.

AI-QC is performed by Cursor (or equivalent AI agents) under a **read-only mandate**: inspect, compare, score, and report — never modify application code during an audit run.

Goals:

- Detect documentation drift early
- Verify Host / Tenant / Branch isolation and foundation readiness
- Score modules against a consistent 30-point checklist
- Produce repeatable reports for development and manual QA handoff
- Maintain a traceable backlog of open, fixed, and deferred findings

---

## Folder Structure

```
docs/
├── PDF/                          # Exported / reference PDFs and markdown snapshots
└── AI-QC/
    ├── README.md                 # This file — AI-QC program overview
    ├── AI-QC-v1.0.md             # Frozen QC framework (official standard)
    ├── AI-QC-Execution-Guide.md  # Step-by-step instructions for running AI-QC
    ├── AI-QC-Report-Template.md  # Standard report format for all module audits
    ├── reports/                  # Completed AI-QC report files (one per module/run)
    │   └── README.md
    ├── backlog/                  # Finding tracker across QC cycles
    │   └── README.md
    └── manual-qc/                # Independent Manual QC / UAT packs
        ├── README.md
        ├── source/               # Editable guides (Markdown)
        ├── pdf/                  # Distributable PDFs (no passwords)
        ├── results/              # Execution result templates
        └── evidence/             # Screenshots, DB output, deployment reports
```

Related (outside AI-QC folder):

- `docs/QC/` — deployment and manual QC guides (e.g. Docker QC)
- `docs/AI-QC/manual-qc/` — **MOD-01 independent Manual QC / UAT pack** (source, PDF, results, evidence)
- `docs/<module>/` — Module Book documentation
- `docs/ProductBook/` — Product Master Book and UI/UX Blueprint

---

## How Reports Are Stored

| Rule | Description |
|------|-------------|
| **Location** | All completed AI-QC reports live in `docs/AI-QC/reports/` |
| **Naming** | Sequential prefix + module slug: `001-Foundation.md`, `002-Host.md`, `003-Tenant.md`, … |
| **Immutability** | Do not edit a signed-off report after Manual QA acceptance; create a new report for re-QC (e.g. `001-Foundation-R2.md`) |
| **Evidence** | Every finding must cite file paths, commands run, and observed vs expected behavior |
| **Template** | All reports must follow `AI-QC-Report-Template.md` |

---

## How Backlog Is Managed

The backlog in `docs/AI-QC/backlog/` tracks findings **across** report runs:

| Column / Field | Purpose |
|----------------|---------|
| **ID** | Unique finding identifier (e.g. `FND-2026-001`) |
| **Priority** | P0 Critical, P1 Major, P2 Minor |
| **Status** | Open, In Progress, Fixed, Verified, Deferred |
| **Owner** | Developer or team responsible |
| **Source report** | Link to report file that first raised the finding |
| **Module** | Foundation, Host, Tenant, Diagnostic, etc. |

Workflow:

1. AI-QC run produces findings → copied or summarized into backlog
2. Development fixes issues → status → **Fixed**
3. Re-QC verifies fix → status → **Verified**
4. Production-only or out-of-scope items → **Deferred** with documented reason

See `backlog/README.md` for the backlog table format.

---

## Difference Between AI QC and Manual QC

| Aspect | AI QC | Manual QC |
|--------|-------|-----------|
| **Executor** | Cursor / AI agent (read-only) | Human QA engineer |
| **Primary input** | Product Book, Module Book, code, schema | AI-QC report + live application |
| **Output** | Scored report, checklist, backlog items | Test execution evidence, sign-off |
| **Code changes** | **Never** during audit | N/A |
| **Browser testing** | Limited; flags manual verification | Full exploratory and regression testing |
| **When it runs** | After development, before manual QA | After AI-QC **PASS** or **PASS WITH OBSERVATIONS** |
| **Authority** | Gates readiness for manual QA | Gates UAT / release |

AI-QC does **not** replace Manual QC. It reduces manual effort by catching structural, documentation, and foundation issues early.

---

## Quick Start

1. Read `AI-QC-v1.0.md` — understand scope, checklist, and verdict rules
2. Read `AI-QC-Execution-Guide.md` — run an audit for the requested module only
3. Copy `AI-QC-Report-Template.md` into `reports/NNN-<Module>.md`
4. Log findings in `backlog/` as needed
5. Stop after the requested module — do not continue to unrequested gates

---

## Version

| Document | Version |
|----------|---------|
| AI-QC Framework | v1.0 (Frozen) |
| This README | 1.1 — 19 July 2026 |

---

## MOD-01 Program Status (QC Handoff)

| Gate | Status |
|------|--------|
| AI QC | PASS (`reports/001-Foundation-ReQC-01.md`) |
| Independent AI Review | PASS (Re-QC-01) |
| Manual QC Guide | **READY** (`manual-qc/source/001-CompanyTenant-Manual-QC-v1.0.md`) |
| Manual QC PDF | **READY** — `manual-qc/pdf/001-CompanyTenant-Manual-QC-v1.0.pdf` (19 pages, generated 19 Jul 2026) |
| QC Docker Deployment | **BLOCKED** — see `manual-qc/evidence/001-CompanyTenant/deployment/` |
| Manual QC Execution | **PENDING** |
| UAT | **PENDING** |
| Production Approval | **NOT APPROVED** |
