# MOD-04 Audit Center — Administrator Guide

**Audience:** Host operators and tenant primary administrators

## Permission setup

Audit Center access is controlled by MOD-03 permission matrix resource **`/settings/audit`**.

| Flag | Capability |
|------|------------|
| View | Open grid and detail panel |
| Print | Export CSV |

Default pilot seed grants full audit access to **TENANT_ADMIN** only.

To grant audit access to another role:

1. **Settings → Roles & Permissions**
2. Open target role → **Permission matrix**
3. Enable **View** (and **Print** if export needed) for **Audit Center**
4. Save — change is audited

## Tenant isolation

- Tenant Audit Center shows only rows where `tenant_id` matches the signed-in tenant.
- Host platform events (`tenant_id IS NULL`) appear only in **Host Console → Audit Log** (`/host/audit`).
- Never share host audit URLs with tenant users.

## Operational monitoring

Recommended weekly review:

1. Filter **Action = LOGIN** — review authentication activity
2. Filter **Entity = User** or **PermissionMatrix** — review IAM changes
3. Filter **Module = MOD-03** — permission matrix edits

## Seeding and verification

After deploy or schema change:

```bash
npm run db:seed
npm run verify:mod04
```

## Troubleshooting

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Empty grid | No mutations yet or filters too narrow | Clear filters; perform a test user edit |
| Access denied | Role lacks `/settings/audit` view | Update permission matrix |
| Export fails | Missing Print permission | Enable Print on role |
| Missing old/new values | Legacy writer did not populate `changeData` | Expected for older rows; enhance writers incrementally |

## Security notes

- Passwords must never appear in audit `changeData` (writers must redact).
- CSV exports contain operational metadata — handle per data policy.
- Self-audit VIEW/PRINT rows confirm who exported or inspected logs.
