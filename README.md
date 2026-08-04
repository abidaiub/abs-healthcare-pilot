# ABSHealthcareLite Pilot

Clean development foundation for the **ABSHealthcareLite** healthcare platform pilot. This workspace is intentionally scoped to infrastructure and scaffolding — business modules are not implemented yet.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 |
| Containers | Docker, Docker Compose |

## Sample data context

| Item | Value |
| --- | --- |
| Project | ABSHealthcareLite Pilot |
| Sample tenant | Al Baraka Medical Group (ABMG) |
| Sample branch | Dhaka Central Hospital (BR-DHK-01) |

These values are used in seed data, environment variables, and the landing page.

---

## Windows desktop development

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
- Git

### 1. Install dependencies

```powershell
cd abs-healthcare-pilot
npm install
```

### 2. Configure environment

```powershell
copy .env.example .env
```

Edit `.env` if you need different database credentials or ports.

### 3. Start PostgreSQL

```powershell
docker compose up -d postgres
```

Wait until the container is healthy:

```powershell
docker compose ps
```

### 4. Run database migrations and seed

```powershell
npm run db:migrate
npm run db:seed
```

When prompted for a migration name, use something like `init`.

### 5. Start the development server

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## Docker server deployment

The production app image contains only the Next.js standalone server. Database migrations,
seeding, backfills, and repository verification run in the on-demand `qc` container so that
development tooling is not added to the runtime image.

Build both targets, prepare the database, and then start the app:

```powershell
docker compose build app qc
docker compose up -d postgres
docker compose run --rm qc npm run db:migrate:deploy
# Optional for a new QC environment:
docker compose run --rm qc npm run db:seed
docker compose up -d app
docker compose run --rm qc npm run verify:smoke
```

The app is available at [http://localhost:3000](http://localhost:3000) (or the port set in `APP_PORT`).
Normal `docker compose up -d` starts only PostgreSQL and the production app; the profiled `qc`
service is created only for an explicit `docker compose run`.

Common maintenance commands:

```powershell
docker compose run --rm qc npm run verify:dpdc
docker compose run --rm qc npm run backfill:tenant-admin-user-mgmt
docker compose run --rm qc npm run db:migrate:deploy
docker compose run --rm qc npm run db:seed
```

Rebuild `qc` after changing source, scripts, Prisma schema, or dependencies. See
[`docs/QC/Docker-Deployment-Architecture.md`](docs/QC/Docker-Deployment-Architecture.md) for the
deployment boundary and operator workflow.

To stop:

```powershell
docker compose down
```

To stop and remove database volume:

```powershell
docker compose down -v
```

---

## Useful commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Generate Prisma client and build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Create and apply migrations (dev) |
| `npm run db:push` | Push schema without migration files |
| `npm run db:seed` | Seed sample tenant and branch |
| `npm run db:studio` | Open Prisma Studio |

---

## Project structure

```
abs-healthcare-pilot/
├── prisma/
│   ├── schema.prisma      # Tenant + Branch foundation models
│   └── seed.ts            # ABMG / Dhaka Central Hospital seed
├── src/
│   ├── app/               # Next.js App Router pages and API
│   ├── lib/db.ts          # Prisma client singleton
│   └── generated/prisma/  # Generated Prisma client (gitignored)
├── docker-compose.yml     # PostgreSQL + production app + on-demand QC runner
├── Dockerfile             # Production runner and QC/maintenance targets
├── .env.example           # Environment template
└── README.md
```

---

## Database schema (foundation)

Current models:

- **Tenant** — multi-tenant company (e.g. Al Baraka Medical Group)
- **Branch** — location within a tenant (e.g. Dhaka Central Hospital)

Additional module tables will be added incrementally following the ABSHealthcareLite architecture guides in the parent repository.

---

## Environment variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string for Prisma |
| `POSTGRES_*` | Docker PostgreSQL service configuration |
| `NEXT_PUBLIC_APP_NAME` | Display name in the UI |
| `NEXT_PUBLIC_SAMPLE_TENANT` | Sample tenant label |
| `NEXT_PUBLIC_SAMPLE_BRANCH` | Sample branch label |
| `APP_PORT` | Host port when running via Docker Compose |

---

## Notes

- `.env` is gitignored; commit only `.env.example`.
- On Windows, run Docker commands from PowerShell or Windows Terminal with Docker Desktop running.
- For local dev, only the `postgres` service is required. The `app` service is for containerized deployment.
- The production `app` container does not run migrations, seeds, backfills, or source-based verification scripts. Use the on-demand `qc` service for those operations.
- Prisma client is generated to `src/generated/prisma` and regenerated on `npm install` via `postinstall`.

---

## License

Private — ABSHealthcareLite pilot workspace.
