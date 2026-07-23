# MOD-04 Deployment Notes

**Module:** Audit Center  
**Date:** 23 July 2026

## Pre-deploy checklist

```bash
npm ci
npx prisma generate
npx prisma db push
npm run db:seed
npm run verify:mod01
npm run verify:mod02
npm run verify:mod04
npm run build
```

## Schema changes

Additive indexes on `audit_logs`:

- `tenant_id + action_type`
- `user_id`

No destructive migration. Safe for existing environments.

## Environment variables

No new variables. Requires working `DATABASE_URL`.

## Post-deploy smoke test

1. Login as `laila.hasan` / `Tenant@2026!`
2. Open **Settings → Audit Center**
3. Confirm rows load for ABMG tenant only
4. Open detail on one row
5. Export CSV
6. Login as `arif.hossain` — confirm `/settings/audit` is blocked

## QC Docker

Same stack as MOD-01. Rebuild container after pull:

```bash
docker compose up -d --build
```

## Rollback

Revert to prior git tag/commit and redeploy. Indexes may remain without functional impact.

See `docs/modules/MOD-04-Audit-Center.md` §13 for full rollback steps.
