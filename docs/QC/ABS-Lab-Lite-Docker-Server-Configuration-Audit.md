# ABSHealthcareLite / ABS Lab Lite Docker server configuration audit

Date: 2026-09-22  
Target server supplied by owner: `192.168.2.44`, user `abs-system`, project `~/abs-healthcare-pilot`, branch `main`  
Verdict: **BLOCKED for live QC and controlled pilot until server verification and HTTPS are completed**

The SSH audit attempt timed out on port 22. Therefore every statement about running containers, volumes, server working tree, Ubuntu/Docker versions, pgAdmin, live ports, migrations, data, logs, backups, or health remains unverified. No deployment, pull, migration, seed, restart, firewall change, or database write was attempted.

## 1. Repository architecture discovered

The original `docker-compose.yml` is a development-oriented stack with `postgres`, `app`, and opt-in `qc`. PostgreSQL 16 uses named volume `postgres_data`, but publishes `${POSTGRES_PORT:-5432}` on all host interfaces and has development credential fallbacks. The app publishes `${APP_PORT:-3000}` on all interfaces. The root Dockerfile builds the parent Next.js standalone app; it does not run the independent `lab-lite` Next.js application. The repository has a parent `/api/health` endpoint that checks Prisma database connectivity.

The parent Prisma seed is not production-safe automation: it creates/updates ABMG tenant data, users/roles, sample patients, appointments, audit rows, lab/result/verification data, and other tenant-specific content. `scripts/seed-host-catalog.ts` is the existing safe, idempotent host-catalog path. Phase 4 now adds `seed:master`, limited to that host catalog plus the global module registry. `seed:uat:doctors-point` remains explicit UAT-only.

Lab Lite is a separate Next.js/PostgreSQL application with its own SQL migrations and database identity guard. It was absent as a Compose runtime service. Its Electron client already talks only to authenticated HTTP APIs and rejects non-HTTPS cloud URLs except loopback development.

## 2. Findings and required changes

### BLOCKER

- Live server state is unknown because SSH timed out. Verify clean `main`, exact commit, Compose services, containers, ports, mounts, logs, and migration state on the server.
- No validated production/QC HTTPS hostname, certificate, renewal, or reverse-proxy installation exists in evidence.
- Existing `docker-compose.yml` exposes PostgreSQL on the host and contains development credential defaults; it must not be used as the server production/QC definition.
- Existing Compose does not run Lab Lite cloud APIs at all.
- Lab Lite accepted only dev/test database identities. It now explicitly accepts separate `qc` and `production` identities, but the QC container path has not run on the server.
- No verified server backup schedule, off-server copy, retention, owner, encryption, or restore drill exists.

### HIGH

- The full Prisma seed mixes master data and tenant/demo/business samples. Never run `prisma db seed` automatically on QC/production.
- Running pgAdmin exposure and authentication are unknown. Restrict it to VPN/admin subnet or SSH tunnel; never expose it as a public user service.
- Server-side Lab Lite operational monitoring and alerts are not yet proven.
- Image/release retention and database-compatible rollback have not been operationally tested.

### MEDIUM

- The supplied server OS is Ubuntu 23.10, an interim release that is no longer suitable as an unqualified long-lived production base; confirm actual OS and plan a supported LTS host.
- The original Compose uses fixed `container_name` values, hindering QC/production coexistence and Compose project isolation.
- Root build context previously included the unrelated Lab Lite tree. `.dockerignore` now excludes it; Lab Lite has its own Docker context and ignore file.

### LOW

- pgAdmin is reported as installed infrastructure but is not represented in the repository Compose file, so ownership/configuration drift is possible.
- Host reverse-proxy headers/ciphers require verification with the actual installed Nginx/version and certificate tooling.

## 3. Final proposed QC Compose architecture

`compose.server-qc.yml` is a standalone, explicit QC definition. It does not alter the developer Compose stack.

```text
HTTPS reverse proxy on host
  ├─ 127.0.0.1:3000 → healthcare-app-qc
  │                     └─ healthcare-postgres-qc
  │                        volume: abs_healthcare_qc_postgres_data
  └─ 127.0.0.1:3100 → lab-lite-app-qc
                        └─ lab-lite-postgres-qc
                           volume: abs_lab_lite_qc_postgres_data
```

Neither PostgreSQL service publishes a host port. Apps publish loopback only. Separate internal networks, databases, credentials, volumes, application containers, and migration tool containers prevent accidental cross-environment/database access. Production must use a distinct Compose project, database names, volumes, hostnames, secrets, and backup paths; do not rename this QC stack into production.

Configuration files:

- `compose.server-qc.yml`
- `deploy/server-qc.env.example`
- `lab-lite/Dockerfile`
- `deploy/nginx/abs-healthcare-qc.conf.template`

Docker/Compose is not installed on the development PC, so Compose engine validation and image builds are NOT RUN. The YAML was parsed successfully and contains six services, two internal networks, and two persistent volumes. Both the parent and Lab Lite production Next.js builds pass locally; the parent build initially exposed and then received a minimal type-narrowing correction in the existing Doctors Point UAT seed.

## 4. PostgreSQL persistence and backup

Named QC volumes are explicitly `abs_healthcare_qc_postgres_data` and `abs_lab_lite_qc_postgres_data`, mounted at `/var/lib/postgresql/data`. Recreating application containers does not remove them. `docker compose down` normally retains named volumes. **Never run `docker compose down -v`, `docker volume rm`, or prune commands against this project**, because they can destroy the databases.

Create timestamped custom-format backups to a server-owned directory not inside the container/volume, then encrypt/copy off-server according to policy:

```bash
install -d -m 0700 ~/backups/abs-healthcare-qc
docker compose --env-file /secure/path/server-qc.env -f compose.server-qc.yml exec -T healthcare-postgres-qc sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > ~/backups/abs-healthcare-qc/healthcare-$(date -u +%Y%m%dT%H%M%SZ).dump
docker compose --env-file /secure/path/server-qc.env -f compose.server-qc.yml exec -T lab-lite-postgres-qc sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > ~/backups/abs-healthcare-qc/lab-lite-$(date -u +%Y%m%dT%H%M%SZ).dump
sha256sum ~/backups/abs-healthcare-qc/*.dump
```

Restore drills must target newly created verification databases/volumes, never overwrite QC in place. One disposable pattern is:

```bash
docker run -d --name abs-lab-lite-restore-verify --env-file /secure/path/restore.env -v abs_lab_lite_restore_verify:/var/lib/postgresql/data postgres:16-alpine
docker exec abs-lab-lite-restore-verify sh -c 'until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do sleep 2; done'
cat ~/backups/abs-healthcare-qc/lab-lite-YYYYMMDDTHHMMSSZ.dump | docker exec -i abs-lab-lite-restore-verify sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --exit-on-error --clean --if-exists'
docker exec abs-lab-lite-restore-verify sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select name, checksum, applied_at from lab_lite_schema_migrations order by name"'
```

Use an equivalent separately named restore container/volume for the parent database and run Prisma migration-status plus business reconciliation queries. Record hash, duration, row/financial totals, owner, and result. Retain the restore volume until the drill is signed off; remove it only through the approved cleanup procedure. A real schedule/retention/off-server destination must be approved on the server.

## 5. HTTPS/reverse proxy

Render the checked-in Nginx template with the approved QC hostnames, loopback ports, and certificate paths. Restrict `envsubst` to the named template variables so Nginx variables such as `$host`, `$request_uri`, and `$proxy_add_x_forwarded_for` remain intact:

```bash
set -a; . /secure/path/server-qc.env; set +a
envsubst '${HEALTHCARE_QC_HOSTNAME} ${HEALTHCARE_QC_APP_PORT} ${HEALTHCARE_QC_TLS_CERTIFICATE} ${HEALTHCARE_QC_TLS_PRIVATE_KEY} ${LAB_LITE_QC_HOSTNAME} ${LAB_LITE_QC_APP_PORT} ${LAB_LITE_QC_TLS_CERTIFICATE} ${LAB_LITE_QC_TLS_PRIVATE_KEY}' < deploy/nginx/abs-healthcare-qc.conf.template | sudo tee /etc/nginx/conf.d/abs-healthcare-qc.conf >/dev/null
sudo nginx -t
```

Obtain a trusted certificate, validate automatic renewal and full chain, restrict to TLS 1.2/1.3, redirect HTTP to HTTPS, preserve host/proto/client IP, and allow 120 seconds for bounded synchronization requests. Add HSTS only after both virtual hosts and renewal are proven. Do not add permissive CORS: the native client uses authenticated HTTPS from its main process, and browser access remains same-origin.

## 6. Firewall

- Permit TCP 443 from the approved pilot/VPN networks; TCP 80 only for redirect and ACME if required.
- Permit TCP 22 only from named administration networks/VPN.
- Deny external/LAN access to 3000, 3100, 5432, Docker API sockets, and container bridge networks.
- Restrict pgAdmin to VPN/admin subnet or an SSH tunnel.
- Permit outbound DNS/NTP/certificate renewal and approved backup destination only as operationally required.
- Record and test the effective Ubuntu firewall plus upstream router/VLAN policy; do not rely solely on Docker port bindings.

## 7. Desktop endpoint configuration

During server-controlled activation, enter only the approved Lab Lite QC HTTPS origin, for example the value represented by `LAB_LITE_QC_APP_ORIGIN`. The application stores the origin and device identifiers locally; the device secret remains DPAPI-protected. Never embed database credentials, server peppers, signing private keys, activation codes, or production URLs containing secrets in the Electron package. The desktop must never connect to port 5432.

## 8. Production-safe migration procedure

Stop on a dirty server tree or unexpected branch/commit. Back up before risky migrations. Build images first, start only databases, run migrations with disposable tool containers, verify migration status, then replace apps:

```bash
git status --short
git branch --show-current
git pull --ff-only origin main
docker compose --env-file /secure/path/server-qc.env -f compose.server-qc.yml build healthcare-app-qc healthcare-tools-qc lab-lite-app-qc lab-lite-tools-qc
docker compose --env-file /secure/path/server-qc.env -f compose.server-qc.yml up -d healthcare-postgres-qc lab-lite-postgres-qc
docker compose --env-file /secure/path/server-qc.env -f compose.server-qc.yml run --rm healthcare-tools-qc npx prisma migrate status
docker compose --env-file /secure/path/server-qc.env -f compose.server-qc.yml run --rm healthcare-tools-qc npx prisma migrate deploy
docker compose --env-file /secure/path/server-qc.env -f compose.server-qc.yml run --rm lab-lite-tools-qc npm run db:migrate
docker compose --env-file /secure/path/server-qc.env -f compose.server-qc.yml up -d healthcare-app-qc lab-lite-app-qc
```

Never run `prisma migrate dev`, `prisma db push`, or alter migration history on QC/production. Lab Lite uses its independent checksum-protected SQL ledger and exact database-name verification.

## 9. Master/reference seed strategy

After migrations, and only under a change ticket, run:

```bash
docker compose --env-file /secure/path/server-qc.env -f compose.server-qc.yml run --rm healthcare-tools-qc npm run seed:master
docker compose --env-file /secure/path/server-qc.env -f compose.server-qc.yml run --rm lab-lite-tools-qc npm run seed:master
```

The parent command is limited to the idempotent host diagnostic catalog and module registry. The Lab Lite command installs its versioned synthetic/unreviewed catalog templates without overwriting tenant price/customizations. Clinical governance approval remains required before offering content to a customer.

## 10. QC seed strategy

Do not run full `npm run db:seed` automatically. Doctors Point and Lab Lite browser UAT seeds remain explicit, require caller-supplied synthetic passwords, and may run only against confirmed QC/UAT databases under a separate change ticket. No UAT seed is permitted in production.

## 11. Backup and restore procedure

Back up both PostgreSQL databases independently before deployment/migration and on the approved schedule. Hash, encrypt, copy off-server, enforce retention, and test restoration quarterly or before pilot go-live. Restore into an isolated verification project first. Compare migration ledgers, tenant counts, bills/invoices, collections/payments, device inbox/outbox acknowledgements, and reconciliation totals. Desktop encrypted backups are operational edge recovery only and never replace server backups.

## 12. Deployment verification checklist

- [ ] Server reachable; supported OS, Docker/Compose versions, disk, clock/NTP, and firewall recorded.
- [ ] `main`, expected commit, clean worktree, and approved release/hash verified.
- [ ] Rendered Compose inspected without printing secrets; only intended services/volumes/networks exist.
- [ ] Both backups completed, hashed, off-server copied, and restore sample verified.
- [ ] Images built without secrets in layers/logs; dependency/security scan reviewed.
- [ ] Parent Prisma migration status clean; deploy succeeds; status clean afterward.
- [ ] Lab Lite checksum migration succeeds against exactly `abs_lab_lite_qc`.
- [ ] Both PostgreSQL containers healthy with persistent mounts; no host 5432 mapping.
- [ ] Both apps healthy; logs contain no startup/database/auth/device blocker.
- [ ] `curl -f http://127.0.0.1:3000/api/health` and port 3100 health pass on host.
- [ ] External HTTPS health passes with valid chain/hostname; HTTP redirects; renewal test passes.
- [ ] Unauthorized device/API, revoked device, sync/retry/conflict, and cross-scope tests pass through HTTPS.
- [ ] pgAdmin and SSH are inaccessible outside approved admin path.
- [ ] Monitoring, alert delivery, backup job, contacts, and rollback artifact verified.

## 13. Rollback

Application rollback and database restore are separate decisions. Retain commit-addressed images/config and the previous signed desktop release. If migrations are backward compatible, point the affected app service to the prior approved image and recreate only that app. Do not run reverse Prisma/custom SQL migrations. If the database change is incompatible or corrupt, stop writes, preserve evidence, create new volumes/databases, restore the pre-migration backups, verify ledgers/reconciliation, then start the compatible images. Never use `down -v` as rollback.

## 14. Final verdict

**BLOCKED.** The repository now contains a safer, isolated QC configuration and procedures, but the target server was unreachable; Docker image/Compose execution was not possible locally; HTTPS, firewall, volumes, migrations, backups, logs, health, pgAdmin restriction, and restore are not evidenced on `192.168.2.44`. This is not READY FOR QC and not READY FOR CONTROLLED PILOT until the server checklist passes. No real customer deployment occurred.
