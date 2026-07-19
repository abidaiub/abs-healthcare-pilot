# MOD-01 QC Deployment Report

| Field | Value |
|-------|-------|
| Report ID | MOD01-QC-Deployment-Report-20260719-2135 |
| Module | MOD-01 — Company / Tenant Management |
| Target environment | **QC Docker** — `http://192.168.2.44:3000` (documented LAN QC host) |
| Live production | **NOT targeted** — confirmed |
| Deployment date | 19 July 2026 |
| Deployment verdict | **BLOCKED** |

---

## 1. Target environment confirmation

| Check | Result |
|-------|--------|
| Documented QC host | `192.168.2.44` per `docs/QC/ABSHealthcareLite-Pilot-Docker-QC-Guide.md` |
| Database name | `abs_healthcare_pilot` (QC compose default — **not** live production) |
| Compose file | `docker-compose.yml` (postgres + app services) |
| Production DNS / live customer DB | **Not modified** |
| Environment positively identified as QC | **Yes** (by documentation and DB naming) |

**Blocker:** Deployment workstation cannot reach QC host (`Test-Connection 192.168.2.44` = **False**) and **Docker CLI is not installed** on the deployment workstation. Remote QC deployment could not be executed from this session.

---

## 2. Git state (pre-deployment audit)

| Item | Value |
|------|-------|
| Branch | `main` |
| Base commit (HEAD at audit start) | `c3bd35b` |
| MOD-01 changes | Present as **uncommitted** working tree (host auth, tenant CRUD, manual QC docs) |
| Secrets in Git | `.env` gitignored; `.local/` credentials gitignored — **no secrets committed** |

**Note:** Deploy to QC should use an explicit commit/tag after MOD-01 fixes are committed. Current deployment was **not performed** due to infrastructure blockers.

---

## 3. Docker configuration inspected

| Item | Detail |
|------|--------|
| `Dockerfile` | Multi-stage Node 20 Alpine; `prisma generate` + `npm run build`; entrypoint `scripts/docker-entrypoint.sh` |
| `docker-compose.yml` | Services: `postgres` (`abs-healthcare-pilot-db`), `app` (`abs-healthcare-pilot-app`) |
| Volume | `postgres_data` (persistent — **must not delete**) |
| Entrypoint | `prisma migrate deploy` then `node server.js` |
| Seed at startup | **Not automatic** — manual: `docker compose exec app npx prisma db seed` |

### Environment variable names (values not printed)

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`
- `APP_PORT`
- `DATABASE_URL`
- `NODE_ENV`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_SAMPLE_TENANT`
- `NEXT_PUBLIC_SAMPLE_BRANCH`

---

## 4. Pre-deployment build verification (local workstation)

Executed on deployment workstation **without Docker**:

| Step | Command | Result |
|------|---------|--------|
| Type check + build | `npm run build` | **PASS** |
| Prisma validate | `npx prisma validate` | **PASS** |
| Migration status (local DB) | `npx prisma migrate status` | **Up to date** (4 migrations) |
| MOD-01 auth/seed script | `npx tsx scripts/verify-mod01-auth.ts` | **PASS** (11/11) |
| Seed idempotency (local) | `npm run db:seed` ×2 | **PASS** (prior session) |
| Lint (full project) | `npm run lint` | **FAIL** — 51 issues (42 errors), predominantly pre-existing JSX-in-try/catch in diagnostic/MOD-02 pages |
| New MOD-01 lint regressions | Spot-check host/saas files | **None observed** in MOD-01 changed files |

**MOD-01 build errors:** None. Deployment blocked on **infrastructure access**, not application build.

---

## 5. Database backup (Part F)

| Item | Result |
|------|--------|
| QC PostgreSQL backup | **NOT EXECUTED** — QC host unreachable; no Docker on workstation |
| Approved backup location | QC server local backup path (operator-defined on `192.168.2.44`) |
| Backup filename | N/A |
| Checksum | N/A |

**Required before QC deployment on server:**

```powershell
# On QC Docker host (192.168.2.44) — adjust path to approved backup folder
docker exec abs-healthcare-pilot-db pg_dump -U abshealthcare -d abs_healthcare_pilot -Fc -f /tmp/abs_healthcare_pilot-pre-mod01-<YYYYMMDD-HHMM>.dump
```

Do not commit backup files to Git.

---

## 6. Docker image build and tag (Part G)

| Item | Result |
|------|--------|
| Image built on QC host | **NOT EXECUTED** (blocked) |
| Recommended tag pattern | `abs-healthcare-pilot:qc-<git-short-sha>-20260719` |
| Example SHA tag | `abs-healthcare-pilot:qc-c3bd35b-20260719` |
| Image digest | N/A |

**Commands for QC operator (on reachable QC host):**

```powershell
cd <repo-path>
git pull
docker compose build --no-cache app
docker tag abs-healthcare-pilot-app abs-healthcare-pilot:qc-<SHA>-20260719
```

---

## 7. Migration plan (Part H)

| Item | Detail |
|------|--------|
| Migration command (QC/production-style) | `prisma migrate deploy` (via entrypoint) |
| Pending migrations | None at audit time (4 applied locally) |
| Destructive migrations detected | **None** |
| Seed after deploy | `docker compose exec app npx prisma db seed` (idempotent) |

**Never run on QC:** `migrate dev`, `migrate reset`, `db push --force-reset`, `DROP DATABASE`.

---

## 8. Deployment execution (Part I)

| Step | Status |
|------|--------|
| Pull/transfer source to QC host | **BLOCKED** — host unreachable |
| Preserve QC `.env` / secrets | N/A |
| `docker compose up -d --build` | **NOT RUN** |
| Post-deploy seed | **NOT RUN** |
| Container health verification | **NOT RUN** |

---

## 9. Post-deployment verification (Part J)

**Not executed** — deployment blocked. Use this checklist on QC host after successful deploy:

| Check | URL / command | Expected |
|-------|---------------|----------|
| Health | `GET http://192.168.2.44:3000/api/health` | `"status":"ok"`, database connected |
| Host login page | `/host/login` | Loads |
| Invalid host password | Submit wrong password | Rejected |
| Valid host login | `admin.abs` + secure password | `/host/dashboard` |
| Tenant list | `/host/tenants` | DB-backed tenants |
| ABMG tenant | Tenant detail | Subscription, modules, limits |
| Audit | `/host/audit` | Persisted audit rows |
| Settings API | `GET /api/v1/companies/{id}/settings` | Auth required |
| Host/tenant isolation | Cross-navigate | Blocked by proxy |

---

## 10. Security verification

| Check | Result (this session) |
|-------|------------------------|
| Secrets in Git | **None committed** |
| Passwords in deployment report | **Redacted** |
| Connection strings in report | **Variable names only** |
| MOD-01 auth script | Validates password rejection/acceptance |

---

## 11. Rollback readiness (Part K)

| Item | Value |
|------|-------|
| Previous image tag/digest | Record from QC host: `docker images abs-healthcare-pilot` before deploy |
| Previous Git commit | Tag deployed commit before upgrade |
| Database backup reference | `abs_healthcare_pilot-pre-mod01-<timestamp>.dump` on QC host |
| App rollback command | `docker compose down app && docker compose up -d app` with previous image tag |
| DB rollback | **Manual restore from backup only** — Prisma has no automatic down-migration |
| Trigger rollback | Health fail, auth bypass, data corruption, migration error |
| Approval owner | QC lead / platform operator |

---

## 12. Known limitations

1. QC LAN host `192.168.2.44` not reachable from current deployment workstation.
2. Docker Desktop/CLI not installed on deployment workstation.
3. Seed is not automatic in container entrypoint — operator must run seed after first deploy.
4. Full lint suite still fails (pre-existing non-MOD-01 issues).
5. Manual QC pack PDF generation pending Playwright browser install on workstation.

---

## 13. Rollback / next steps for QC operator

1. Ensure VPN/LAN access to `192.168.2.44`.
2. Take PostgreSQL backup (Section 5).
3. Pull latest MOD-01 commit and run `docker compose up -d --build`.
4. Run `docker compose exec app npx prisma db seed`.
5. Execute smoke tests (Section 9).
6. Hand off to independent QC engineer with:
   - `docs/AI-QC/manual-qc/pdf/001-CompanyTenant-Manual-QC-v1.0.pdf`
   - Credentials via secure channel (`.local/001-QC-Credentials.txt` on secure share only)

---

## 14. Final deployment verdict

**BLOCKED**

Reason: QC Docker host unreachable and Docker CLI unavailable on deployment workstation. Application build and MOD-01 verification **passed locally**. Deployment must be completed by QC operator on `192.168.2.44` using commands in this report.

---

*Confidentiality: This report contains no passwords, tokens, or full connection strings.*
