import type { PoolClient } from "pg";
import { query } from "./db";

export const ROLE_GRANTS = {
  LAB_ADMIN: [
    ["tenant_settings", "read"], ["tenant_settings", "update"],
    ["branches", "read"], ["branches", "create"], ["branches", "update"],
    ["users", "read"], ["users", "create"], ["users", "update"],
    ["catalog", "read"], ["catalog", "create"], ["catalog", "update"],
    ["directories", "read"], ["directories", "create"], ["directories", "update"],
    ["patients", "read"], ["patients", "create"], ["patients", "update"],
    ["billing", "read"], ["billing", "create"], ["billing", "update"], ["discount", "approve"],
    ["billing_adjustment", "create"], ["billing_adjustment", "approve"],
    ["refund", "create"], ["refund", "approve"], ["refund", "update"],
    ["receipts", "read"], ["receipts", "create"],
    ["collection_reports", "read"], ["collection_reports", "export"],
    ["devices", "read"], ["devices", "create"], ["devices", "update"],
  ],
  COUNTER: [
    ["catalog", "read"], ["directories", "read"],
    ["patients", "read"], ["patients", "create"], ["patients", "update"],
    ["billing", "read"], ["billing", "create"], ["billing", "update"],
    ["refund", "create"], ["receipts", "read"], ["receipts", "create"],
    ["collection_reports", "read"],
  ],
  ACCOUNTS_VIEWER: [["billing", "read"], ["billing", "export"], ["receipts", "read"], ["collection_reports", "read"], ["collection_reports", "export"]],
} as const;

export type SessionPrincipal = {
  sessionId: string;
  tenantId: string;
  branchId: string;
  userId: string;
  username: string;
  displayName: string;
  forcePasswordChange: boolean;
  permissions: ReadonlySet<string>;
};

export function permissionKey(resource: string, action: string) { return `${resource}:${action}`; }

export async function seedSystemRoles(client: PoolClient, tenantId: string) {
  for (const [code, grants] of Object.entries(ROLE_GRANTS)) {
    const role = await client.query<{ id: string }>(
      `insert into roles(tenant_id,code,name,is_system) values($1,$2,$3,true)
       on conflict(tenant_id,code) do update set name=excluded.name,is_active=true returning id`,
      [tenantId, code, code.replaceAll("_", " ")],
    );
    for (const [resource, action] of grants) {
      await client.query(
        `insert into role_permissions(tenant_id,role_id,resource,action) values($1,$2,$3,$4)
         on conflict(tenant_id,role_id,resource,action) do nothing`,
        [tenantId, role.rows[0].id, resource, action],
      );
    }
  }
}

export async function hasPermission(principal: SessionPrincipal, resource: string, action: string) {
  return principal.permissions.has(permissionKey(resource, action));
}

export function assertPermission(principal: SessionPrincipal, resource: string, action: string) {
  if (!principal.permissions.has(permissionKey(resource, action))) {
    const error = new Error(`Forbidden: ${resource}:${action}`) as Error & { status?: number };
    error.status = 403;
    throw error;
  }
}

export async function loadPermissions(tenantId: string, userId: string) {
  const result = await query<{ resource: string; action: string }>(
    `select distinct rp.resource,rp.action from user_roles ur
     join roles r on r.tenant_id=ur.tenant_id and r.id=ur.role_id and r.is_active
     join role_permissions rp on rp.tenant_id=r.tenant_id and rp.role_id=r.id
     where ur.tenant_id=$1 and ur.user_id=$2 and ur.is_active`, [tenantId, userId],
  );
  return new Set(result.rows.map((row) => permissionKey(row.resource, row.action)));
}
