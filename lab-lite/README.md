# ABS Lab Lite

ABS Lab Lite is an independently runnable laboratory and patient-billing product through Phase 3. It combines the isolated Next.js/PostgreSQL cloud application with an installed Windows client using encrypted SQLite, bounded offline authorization, local billing/printing, and application-level synchronization.

## Safety boundaries

- Only explicitly separated databases named `abs_lab_lite_dev`, `abs_lab_lite_test`, `abs_lab_lite_qc`, or `abs_lab_lite_production` are accepted by the application and migration runner. The expected name must also exactly match the connected database.
- The bundled catalog is synthetic, `UNREVIEWED`, and contains no clinical reference ranges or patient result defaults.
- Posted bills, collections, cancellation adjustments, refund workflow, reporting, and receipt print events are persisted with immutable transaction snapshots and tenant-scoped idempotency.
- Clinical findings remain separate from catalog result-field definitions. There is no patient-result persistence in this application.
- The installed client permits only the bounded offline scope documented below. Due collection, cancellation posting, refund approval, and refund payout remain online-only.
- The local PostgreSQL trust configuration is for loopback development only and must not be reused in production.

## Local setup (Windows / PostgreSQL 18)

The validated isolated cluster uses `127.0.0.1:55432` and stores data under the ignored `lab-lite/.runtime/pgdata` directory. From `lab-lite`:

```powershell
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
New-Item -ItemType Directory -Force .runtime | Out-Null
& "$pgBin\initdb.exe" -D .runtime\pgdata -U lablite_admin -A trust --no-locale -E UTF8
Add-Content .runtime\pgdata\postgresql.conf "`nlisten_addresses = '127.0.0.1'`nport = 55432"
& "$pgBin\pg_ctl.exe" -D .runtime\pgdata -l .runtime\postgres.log start
& "$pgBin\createdb.exe" -h 127.0.0.1 -p 55432 -U lablite_admin abs_lab_lite_dev
& "$pgBin\createdb.exe" -h 127.0.0.1 -p 55432 -U lablite_admin abs_lab_lite_test
Copy-Item .env.example .env.local
Copy-Item .env.example .env.test
```

Set `.env.local` to the dev database and `.env.test` to the test database as shown in the checked-in examples. Use different 32+ character session peppers outside local development.

```powershell
npm install
npm run db:migrate
npm run db:seed-catalog
$env:BOOTSTRAP_ADMIN_PASSWORD = '<a unique 12+ character mixed password>'
npm run db:bootstrap
Remove-Item Env:BOOTSTRAP_ADMIN_PASSWORD
npm run dev
```

The bootstrap password is required, has no fallback, and is never printed. To stop the isolated cluster:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D .runtime\pgdata stop
```

## Verification

```powershell
npm test
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
```

`npm test` always loads `.env.test`, checks the exact database identity, applies checksum-protected migrations, and only then resets test-owned tables.

## Phase 2 financial rules

- Money is converted to integer minor units. Inputs beyond two decimals use round-half-up; discount remainders are assigned deterministically to the last line.
- The server reloads tenant prices and validates quantities, discounts, payment methods, tenant ownership, and permissions. Client totals are not trusted.
- Bill posting and split initial collections commit atomically.
- Due collection, cancellation, and refund operations serialize on the bill row.
- Original bills/lines are preserved. Cancellation is an append-only adjustment; refunds progress through requested, approved/rejected, then paid.
- Refund makers cannot approve their own requests. Approval alone does not affect cash reporting.
- Identical operation retries return the original response; changed payload reuse is rejected.

Receipt formats are configured per tenant (`A4`, `A5`, `POS80`, `POS58`). Referral-partner data is hidden from patient receipts unless explicitly enabled.

Optional synthetic browser-UAT data requires a caller-supplied checker password and never stores or prints it:

```powershell
$env:UAT_CHECKER_PASSWORD = '<synthetic checker password>'
npm run db:seed-browser-uat
Remove-Item Env:UAT_CHECKER_PASSWORD
```

See [schema and migration reconciliation](docs/SCHEMA-AND-MIGRATION-RECONCILIATION.md) for ownership rules, provenance, RLS posture, and future migration policy.
See [Windows client operations](docs/PHASE-3-WINDOWS-CLIENT.md) for installation, activation, offline scope, synchronization, backup, recovery, and replacement procedures.
See the [Phase 4 field-readiness execution report](docs/phase4/EXECUTION-REPORT.md) for the current BLOCKED verdict, executed installer/upgrade/rollback evidence, defect classifications, and mandatory pilot-entry work.

## Phase 3 Windows client

The client source is under `desktop/`. It uses Electron with a local renderer; privileged APIs, encrypted SQLite, device credentials, and synchronization remain in the sandboxed main process/preload boundary.

```powershell
cd desktop
npm install --ignore-scripts
node node_modules\electron\install.js
npm run typecheck
npm test
npm run make
```

The Squirrel installer is generated at `desktop/out/make/squirrel.windows/x64/ABS-Lab-Lite-Setup.exe`. This development artifact is unsigned; do not distribute it as a production installer. `npm test` executes the native encrypted database test under the bundled Electron runtime.
