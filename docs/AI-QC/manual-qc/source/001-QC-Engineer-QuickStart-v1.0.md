# QC Engineer Quick Start Guide
## ABSHealthcareLite Pilot — MOD-01

| Document control | Value |
|---|---|
| Document version | 1.0 |
| Prepared date | 19 July 2026 |
| Environment | QC Docker (non-production) |
| Intended audience | Independent QC engineers |
| Classification | Internal QC working document |

> **Credential handling:** Passwords are **not printed in this document**. Obtain credentials from the secure channel or `.local/001-QC-Credentials.txt` on the QC workstation (never email or chat).

---

## 1. Documents you need

| Document | Path / location | Purpose |
|---|---|---|
| Manual QC test guide (PDF) | `docs/AI-QC/manual-qc/pdf/001-CompanyTenant-Manual-QC-v1.0.pdf` | Full test cases (142 cases) |
| Result template | `docs/AI-QC/manual-qc/results/001-CompanyTenant-Manual-QC-Result-Template.md` | Copy and fill during execution |
| QC credentials | `.local/001-QC-Credentials.txt` (secure channel only) | Host and tenant login passwords |
| Docker QC guide | `docs/QC/ABSHealthcareLite-Pilot-Docker-QC-Guide.md` | Server and container details |
| Deployment report | `docs/AI-QC/manual-qc/evidence/001-CompanyTenant/deployment/` | Latest deploy status |

> **Bangla (বাংলা):** প্রথমে Manual QC PDF খুলুন, result template কপি করুন, credentials secure channel থেকে নিন। Test case গুলো PDF অনুযায়ী চালান।

---

## 2. QC environment URLs

| Item | Value |
|---|---|
| Application | `http://192.168.2.44:3000` |
| Health check | `GET http://192.168.2.44:3000/api/health` |
| Host login | `http://192.168.2.44:3000/host/login` |
| Tenant login | `http://192.168.2.44:3000/login` |
| Host username | `admin.abs` |
| Tenant username | `laila.hasan` |
| Passwords | Provided separately through secure channel |
| App container | `abs-healthcare-pilot-app` |
| Database container | `abs-healthcare-pilot-db` |
| Database name | `abs_healthcare_pilot` |

**Expected health response:** JSON with `"status": "ok"` and `"database": "connected"`.

---

## 3. QC server — deploy and verify (operator)

Run on the QC Docker host after `git pull`:

```powershell
cd abs-healthcare-pilot
git pull origin main
docker compose up -d --build
docker compose exec app npx prisma db seed
```

Verify:

```powershell
curl http://192.168.2.44:3000/api/health
docker ps --filter name=abs-healthcare-pilot
```

> **Note:** Container startup runs migrations only. Seed is **manual** (command above).

---

## 4. Local development (optional — for developers)

Use only if testing on a developer workstation, not for official QC sign-off.

```powershell
cd abs-healthcare-pilot
copy .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

| Local URL | Path |
|---|---|
| App | `http://localhost:3000` |
| Health | `http://localhost:3000/api/health` |
| Host login | `http://localhost:3000/host/login` |
| Tenant login | `http://localhost:3000/login` |

Optional verification:

```powershell
npx tsx scripts/verify-mod01-auth.ts
npm run build
```

---

## 5. Manual QC workflow (QC engineer)

### Step 1 — Pre-test checks

1. Open health endpoint and save the JSON response as evidence.
2. Confirm Docker containers are running.
3. Use a clean or isolated browser profile.
4. Record tester name, date, and environment in the result file.
5. Do **not** modify other testers' data in shared QC.

### Step 2 — Prepare result file

Copy the result template to a dated file, for example:

`001-CompanyTenant-Manual-QC-Result-20260719.md`

### Step 3 — Execute test cases

1. Open `001-CompanyTenant-Manual-QC-v1.0.pdf`.
2. Execute every `MOD01-*` test case in order (unless a dependency note says otherwise).
3. For each case record: **Actual Result**, **Status**, **Evidence**, **Tester Remarks**.
4. Status values: `PASS`, `FAIL`, `BLOCKED`, `NOT APPLICABLE`, or `NOT RUN`.

### Step 4 — Test data naming

| Data item | Convention |
|---|---|
| Tenant code | `QC01-YYYYMMDD-HHMM` |
| Tenant name | `MOD01 QC Tenant` |
| Branch code | `QC-BR-01` |
| Unique suffix | Execution timestamp, e.g. `20260719-1958` |

Use a **new timestamp suffix** for each run. Log every tenant ID and code created.

### Step 5 — Save evidence

| Evidence type | Folder |
|---|---|
| Screenshots | `docs/AI-QC/manual-qc/evidence/001-CompanyTenant/screenshots/` |
| Database output | `docs/AI-QC/manual-qc/evidence/001-CompanyTenant/database/` |
| Security tests | `docs/AI-QC/manual-qc/evidence/001-CompanyTenant/security/` |

Screenshot naming: `MOD01-<TCID>-StepNN.png` (example: `MOD01-AUTH-001-Step01.png`).

### Step 6 — Sign-off

Complete sign-off only when exit criteria in Manual QC guide Section 13 are met. Do not mark UAT or production approved from this pack alone.

---

## 6. Quick command reference

| Task | Command |
|---|---|
| Pull latest code | `git pull origin main` |
| QC Docker deploy | `docker compose up -d --build` |
| QC database seed | `docker compose exec app npx prisma db seed` |
| Health check | `curl http://192.168.2.44:3000/api/health` |
| List containers | `docker ps --filter name=abs-healthcare-pilot` |
| MOD-01 auth verify (local) | `npx tsx scripts/verify-mod01-auth.ts` |
| Regenerate Manual QC PDF | `node scripts/generate-manual-qc-pdf.mjs` |
| Local dev server | `npm run dev` |

---

## 7. Roles during testing

| Role | Purpose |
|---|---|
| Host Admin | Create, edit, activate, suspend, and review tenants |
| Tenant Admin | Manage assigned tenant only |
| Unauthorized / Anonymous | Validate login and access rejection |
| Database Observer | Run approved **read-only** SQL only |

---

## 8. Important rules

1. **QC only** — target is `192.168.2.44` / `abs_healthcare_pilot`, not live production.
2. **No passwords in evidence** — blur or omit password fields in screenshots.
3. **No destructive SQL** — read-only database checks only.
4. **Stop on FAIL** — log defect ID before dependent cases if a blocker is found.
5. **Independent execution** — AI Re-QC PASS does not replace manual test execution.

---

## 9. Support references

| Topic | Document |
|---|---|
| Full test cases | `001-CompanyTenant-Manual-QC-v1.0.pdf` |
| AI Re-QC baseline | `docs/AI-QC/reports/001-Foundation-ReQC-01.md` |
| Module specification | `docs/01-CompanyTenant/CompanyTenant_v1.md` |
| Git repository | `https://github.com/abidaiub/abs-healthcare-pilot.git` |
| Latest commit | `main` branch — check `git log -1` on QC host before testing |

---

## 10. Contact and escalation

| Situation | Action |
|---|---|
| Health check fails | Escalate to deployment operator; do not start functional QC |
| Credentials missing | Request via secure channel; do not use placeholder passwords |
| Environment blocked | Mark affected cases `BLOCKED` and reference deployment report |
| Defect found | Record in result file; attach screenshot evidence |
