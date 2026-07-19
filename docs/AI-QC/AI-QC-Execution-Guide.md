# ABSHealthcareLite — AI-QC Execution Guide

**Document:** AI-QC-Execution-Guide.md  
**Framework version:** v1.0 (Frozen)  
**Audience:** Cursor AI agents and human QC leads  
**Project root:** `abs-healthcare-pilot/`

---

## Purpose

This guide defines **exactly how Cursor must execute every AI-QC run** for ABSHealthcareLite. Follow it sequentially. Do not improvise outside the frozen framework (`AI-QC-v1.0.md`).

---

## Mandatory Principles

| Rule | Description |
|------|-------------|
| **Never guess** | Report only what evidence supports |
| **Never assume** | If docs or code cannot be verified, mark **Manual Verification Required** |
| **Never modify code during QC** | Read-only inspection only |
| **Always provide evidence** | Commands, file paths, line references, observed behavior |
| **Always include affected files** | Every finding lists file(s) |
| **Always classify severity** | Critical / Major / Minor |
| **Always provide PASS/FAIL score** | Use the 30-point checklist |
| **Stop after requested module** | Do not continue to unrequested gates or modules |

---

## Pre-Flight Checklist

Before starting any module QC:

- [ ] Confirm QC scope in the user task (e.g. Foundation only, Host only)
- [ ] Confirm framework version: `AI-QC-v1.0.md`
- [ ] Confirm report output path: `docs/AI-QC/reports/NNN-<Module>.md`
- [ ] Do **not** edit application source, Prisma, API, or database

---

## Execution Steps

### Step 1 — Review Product Book first

1. Open `docs/ProductBook/ABSHealthcareLite_Product_Master_Book_v4_UIUXBlueprint.md`
2. Extract for the scoped module:
   - Module ID and name
   - Navigation placement
   - Role access matrix
   - UI section requirements
   - Workflow summary

**Output:** Module expectations list (bullet points with doc section references).

---

### Step 2 — Review Module Book

1. Open the module folder under `docs/<NN>-<ModuleName>/`
2. Read `<ModuleName>_v1.md`
3. Read `Mockups/WireframeMockup.md`, `ScreenFlow.md`, `NavigationMap.md` if present
4. Extract:
   - Routes and screen names
   - Mandatory fields and field names
   - Status workflow
   - Host vs Tenant vs Branch rules
   - Role permissions

**Output:** Field list, workflow steps, and route map from Module Book.

---

### Step 3 — Review Sample Data Dictionary

1. Open `docs/PDF/ABSHealthcareLite_Sample_Data_Dictionary.md` (or UIUX mockup dictionary)
2. Identify sample tenants, branches, users, catalog codes, and pricing relevant to the module
3. Cross-check seed files: `prisma/seed.ts`, `prisma/seed/`

**Output:** Expected sample entities and codes for QC scenarios.

---

### Step 4 — Review Architecture Rules (when in scope)

For foundation or cross-cutting modules:

1. `docs/Architecture/01-MasterModuleDependencyGuide.md`
2. `docs/Architecture/03-SystemLayerArchitecture.md`
3. `docs/Architecture/04-Phase2-DiagnosticSchemaDesign.md`
4. `docs/03-RolePermission/RolePermission_v1.md` (RBAC)

**Output:** Host/Tenant/Branch boundaries and dependency notes.

---

### Step 5 — Review Implementation

Inspect **read-only**:

| Area | Locations |
|------|-----------|
| Routes | `src/app/**/page.tsx` |
| Layouts / guards | `src/app/**/layout.tsx`, `src/proxy.ts`, `src/lib/auth.ts` |
| Navigation | `src/lib/navigation.ts`, `src/lib/module-registry.ts` |
| Server actions | `src/app/actions/` |
| Components | `src/components/` |
| Database | `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed/` |
| Config | `.env.example`, `package.json`, `next.config.ts` |

Run commands **only when scope includes baseline** (Foundation gate):

```powershell
git status
npm ci          # or verify package-lock + node_modules
npm run build
npm run lint    # if configured
npx prisma migrate status
npx prisma db seed   # only if DB QC is in scope and user permits
```

Record **exact command output** (exit code + summary).

---

### Step 6 — Compare All Differences

Build a comparison table:

| Requirement (doc) | Implementation (code) | Match? | Severity if mismatch |
|-------------------|----------------------|--------|----------------------|
| … | … | Yes/No | Critical/Major/Minor |

Flag:

- Missing pages
- Extra undocumented pages
- Wrong field names
- Wrong navigation
- Wrong role access
- Mock vs DB-backed gaps

---

### Step 7 — Score the 30-Point Checklist

Use Section 4 of `AI-QC-v1.0.md`:

- Documentation (D1–D5)
- UI (U1–U5)
- Functional (F1–F5)
- Database (DB1–DB5)
- Security (S1–S5)
- Workflow (W1–W5)

Mark N/A only with written justification.

Apply **Automatic FAIL Rules** (Section 6 of framework).

---

### Step 8 — Write the Report

1. Copy structure from `AI-QC-Report-Template.md`
2. Save to `docs/AI-QC/reports/NNN-<Module>.md`
3. Include:
   - Executive Summary
   - Commands Executed (if baseline run)
   - 30-Point Checklist table
   - Classified findings (Critical / Major / Minor)
   - Manual Verification Required section
   - Overall Score and Final Verdict

---

### Step 9 — Update Backlog (if findings exist)

For each Critical/Major finding (and tracked Minor):

1. Add row to backlog tracker (see `backlog/README.md`)
2. Link to report file and finding ID

---

### Step 10 — Stop

- **Do not fix code**
- **Do not continue** to the next module unless explicitly requested
- Output summary: score, verdict, report path, backlog items created

---

## Severity Classification Guide

| Severity | When to use | Examples |
|----------|-------------|----------|
| **Critical** | Automatic-fail rules, data integrity, auth bypass, cross-tenant access | Mock auth in production scope, host/tenant isolation broken |
| **Major** | Feature/workflow broken, wrong role nav, lint/build gate fail, doc route missing | Wrong landing route, disabled module accessible |
| **Minor** | Cosmetic, naming drift, missing error boundary, doc typo | Unused import, README drift |

---

## Foundation Gate — Quick Command Reference

When scope is **Foundation only**, run checks A–E from the Foundation QC task:

- Baseline: git, npm ci, build, lint, prisma schema/migrations/seed, `.env.example`
- Routes: `/login`, `/host/login`, dashboard guards, isolation
- Session: loginKind, tenant/branch context, logout, cookie persistence
- Role/nav: role-based sidebar and landing route
- Database: connectivity, migrate, seed idempotency, tenant scoping in actions

---

## What Cursor Must Not Do During QC

- Edit `.ts`, `.tsx`, `.prisma`, or config files
- Run migrations that change schema (read `migrate status` only unless user requests)
- Commit changes
- Assume Product Book content without reading files
- Mark PASS without evidence
- Expand scope beyond the user’s module gate

---

## Related Documents

- `AI-QC-v1.0.md` — Frozen framework and checklist
- `AI-QC-Report-Template.md` — Report structure
- `README.md` — Folder and backlog overview
