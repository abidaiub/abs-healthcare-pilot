# Docker Deployment Architecture

## Decision

ABSHealthcareLite uses two image targets with different responsibilities:

| Target / service | Purpose | Included | Excluded |
| --- | --- | --- | --- |
| `runner` / `app` | Serve the production Next.js application | Standalone server, traced runtime dependencies, static and public assets | Full source, dev dependencies, `tsx`, Prisma CLI, migrations, seed and verification scripts |
| `qc` / `qc` | Run short-lived quality-control and maintenance jobs | Full repository source, dev dependencies, generated Prisma client, Prisma CLI, `tsx`, migrations, seed, backfill and verification scripts | Published ports and a long-running production process |

The production container is intentionally immutable with respect to database schema and seed
data. Its only command is `node server.js`. This keeps the attack surface and image size close to
the Next.js standalone output and prevents every application restart from also becoming a
database maintenance event.

The QC image is built from the same repository revision as the app image. It is larger by design,
but it is created only for an explicit job and removed when that job finishes. Rebuild it whenever
source, dependencies, Prisma schema, migrations, or scripts change.

## Compose services

- `postgres` is the persistent PostgreSQL service and must be healthy before a QC job begins.
- `app` builds the Dockerfile `runner` target, publishes the configured application port, and
  serves Next.js only.
- `qc` builds the Dockerfile `qc` target, has no published ports, and belongs to the `qc` profile.
  An explicit `docker compose run --rm qc ...` invokes it even though ordinary production
  `docker compose up -d` does not start it. QC commands also run as the unprivileged `node` user.

The QC container receives the Compose-network `DATABASE_URL`. Application-aware checks receive
`APP_BASE_URL=http://app:3000`; `BASE_URL` carries the same value for existing browser scripts and
is the smoke runner's legacy fallback. The smoke runner uses `APP_HEALTH_URL` when supplied;
otherwise it appends `/api/health` to `APP_BASE_URL`, then `BASE_URL`. This checks both HTTP
availability and database connectivity through the application's health endpoint.

## Production deployment workflow

Build the app and matching maintenance image from the same checked-out commit:

```powershell
docker compose build app qc
```

Start PostgreSQL and apply production migrations before starting the new app:

```powershell
docker compose up -d postgres
docker compose run --rm qc npm run db:migrate:deploy
docker compose up -d app
```

Run the smoke gate after the app becomes healthy:

```powershell
docker compose run --rm qc npm run verify:smoke
docker compose ps
```

For an existing deployment, take the normal backup and rollback precautions required by the
migration being deployed. Do not use `prisma migrate dev` or `prisma db push` as a production
deployment command.

## QC and maintenance workflow

Repository verification:

```powershell
docker compose run --rm qc npm run verify:dpdc
docker compose run --rm qc npm run verify:mod00
docker compose run --rm qc npm run verify:tenant-admin-user-mgmt
```

Tenant Admin permission backfill:

```powershell
docker compose run --rm qc npm run backfill:tenant-admin-user-mgmt
docker compose run --rm qc npm run verify:tenant-admin-user-mgmt
```

Prisma maintenance and controlled QC seeding:

```powershell
docker compose run --rm qc npm run db:generate
docker compose run --rm qc npm run db:migrate:deploy
docker compose run --rm qc npm run db:seed
```

Application smoke verification:

```powershell
docker compose run --rm qc npm run verify:smoke
```

The smoke command expects the `app` service to already be running. Verification and backfill
commands require only PostgreSQL unless the individual script documents an application dependency.

## Operational controls

- Run migrations, seed, and backfill commands as separately logged deployment steps. A failed job
  exits non-zero and must stop promotion.
- Use the QC image built from the same Git commit as the deployed app. Do not run a floating or
  older maintenance image against a newer schema.
- Do not assign a restart policy or public port to `qc`. Remove each one-off container with `--rm`.
- Treat database credentials supplied to `qc` as production secrets and restrict permission to run
  maintenance jobs.
- Do not install development tooling into `app` to diagnose a QC failure. Inspect the failed QC
  job, correct the repository or environment, rebuild `qc`, and rerun the job.

## Local source override (optional)

The default QC image contains a versioned copy of the repository and is suitable for deployment.
For local-only iteration, an operator may add a separate Compose override that bind-mounts the
working tree into `/app`. Do not use such an override in production because it breaks the guarantee
that the app and QC runner were built from the same repository revision.
