import { transaction, query } from "../lib/db";
import { hashPassword, verifyPassword } from "../lib/password";
import { digestToken, generateToken } from "../lib/tokens";
import { loadPermissions, seedSystemRoles, type SessionPrincipal } from "../lib/authorization";

export async function provisionTenant(input: { tenantCode: string; tenantName: string; branchCode: string; branchName: string; username: string; displayName: string; password: string }) {
  return transaction(async (client) => {
    const tenant = await client.query<{ id: string }>(
      `insert into tenants(code,name) values(upper($1),$2) returning id`, [input.tenantCode.trim(), input.tenantName.trim()],
    );
    const tenantId = tenant.rows[0].id;
    const branch = await client.query<{ id: string }>(
      `insert into branches(tenant_id,code,name,is_default) values($1,upper($2),$3,true) returning id`,
      [tenantId, input.branchCode.trim(), input.branchName.trim()],
    );
    await seedSystemRoles(client, tenantId);
    const user = await client.query<{ id: string }>(
      `insert into users(tenant_id,username,display_name,password_hash,force_password_change)
       values($1,lower($2),$3,$4,false) returning id`,
      [tenantId, input.username.trim(), input.displayName.trim(), hashPassword(input.password)],
    );
    await client.query(
      `insert into user_roles(tenant_id,user_id,role_id)
       select $1,$2,id from roles where tenant_id=$1 and code='LAB_ADMIN'`, [tenantId, user.rows[0].id],
    );
    await client.query(
      `insert into user_branches(tenant_id,user_id,branch_id,is_primary) values($1,$2,$3,true)`,
      [tenantId, user.rows[0].id, branch.rows[0].id],
    );
    return { tenantId, branchId: branch.rows[0].id, userId: user.rows[0].id };
  });
}

export async function createUser(input: { tenantId: string; username: string; displayName: string; password: string; roleCode: keyof typeof import("../lib/authorization").ROLE_GRANTS; branchId: string }) {
  return transaction(async (client) => {
    const branch = await client.query(`select 1 from branches where tenant_id=$1 and id=$2 and is_active`, [input.tenantId, input.branchId]);
    if (!branch.rowCount) throw new Error("Branch does not belong to tenant");
    const role = await client.query<{ id: string }>(`select id from roles where tenant_id=$1 and code=$2 and is_active`, [input.tenantId, input.roleCode]);
    if (!role.rowCount) throw new Error("Role not found");
    const user = await client.query<{ id: string }>(
      `insert into users(tenant_id,username,display_name,password_hash) values($1,lower($2),$3,$4) returning id`,
      [input.tenantId, input.username.trim(), input.displayName.trim(), hashPassword(input.password)],
    );
    await client.query(`insert into user_roles(tenant_id,user_id,role_id) values($1,$2,$3)`, [input.tenantId, user.rows[0].id, role.rows[0].id]);
    await client.query(`insert into user_branches(tenant_id,user_id,branch_id,is_primary) values($1,$2,$3,true)`, [input.tenantId, user.rows[0].id, input.branchId]);
    return user.rows[0];
  });
}

export async function authenticate(input: { tenantCode: string; branchCode: string; username: string; password: string }) {
  const result = await query<{ tenant_id: string; branch_id: string; user_id: string; password_hash: string; auth_epoch: number }>(
    `select t.id tenant_id,b.id branch_id,u.id user_id,u.password_hash,u.auth_epoch
     from tenants t join branches b on b.tenant_id=t.id join users u on u.tenant_id=t.id
     join user_branches ub on ub.tenant_id=t.id and ub.user_id=u.id and ub.branch_id=b.id and ub.is_active
     where t.code=upper($1) and b.code=upper($2) and u.username=lower($3)
       and t.is_active and b.is_active and u.is_active`,
    [input.tenantCode.trim(), input.branchCode.trim(), input.username.trim()],
  );
  const row = result.rows[0];
  if (!row || !verifyPassword(input.password, row.password_hash)) return null;
  const token = generateToken();
  await query(
    `insert into staff_sessions(token_hash,tenant_id,user_id,branch_id,user_auth_epoch,expires_at)
     values($1,$2,$3,$4,$5,now()+interval '12 hours')`,
    [digestToken(token), row.tenant_id, row.user_id, row.branch_id, row.auth_epoch],
  );
  return { token, tenantId: row.tenant_id, branchId: row.branch_id, userId: row.user_id };
}

export async function resolveSession(token: string): Promise<SessionPrincipal | null> {
  const result = await query<{ session_id: string; tenant_id: string; branch_id: string; user_id: string; username: string; display_name: string; force_password_change: boolean }>(
    `select s.id session_id,s.tenant_id,s.branch_id,s.user_id,u.username,u.display_name,u.force_password_change
     from staff_sessions s join users u on u.tenant_id=s.tenant_id and u.id=s.user_id
     join branches b on b.tenant_id=s.tenant_id and b.id=s.branch_id
     where s.token_hash=$1 and s.revoked_at is null and s.expires_at>now()
       and s.user_auth_epoch=u.auth_epoch and u.is_active and b.is_active`, [digestToken(token)],
  );
  const row = result.rows[0];
  if (!row) return null;
  await query(`update staff_sessions set last_seen_at=now() where id=$1`, [row.session_id]);
  return {
    sessionId: row.session_id, tenantId: row.tenant_id, branchId: row.branch_id, userId: row.user_id,
    username: row.username, displayName: row.display_name, forcePasswordChange: row.force_password_change,
    permissions: await loadPermissions(row.tenant_id, row.user_id),
  };
}

export async function revokeSession(token: string) {
  await query(`update staff_sessions set revoked_at=now() where token_hash=$1 and revoked_at is null`, [digestToken(token)]);
}

export async function changeOwnPassword(tenantId: string, userId: string, currentPassword: string, newPassword: string) {
  return transaction(async (client) => {
    const user = await client.query<{ password_hash: string }>(`select password_hash from users where tenant_id=$1 and id=$2 and is_active for update`, [tenantId, userId]);
    if (!user.rowCount || !verifyPassword(currentPassword, user.rows[0].password_hash)) throw new Error("Current password is incorrect");
    await client.query(`update users set password_hash=$3,force_password_change=false,auth_epoch=auth_epoch+1,updated_at=now() where tenant_id=$1 and id=$2`, [tenantId, userId, hashPassword(newPassword)]);
    await client.query(`update staff_sessions set revoked_at=now() where tenant_id=$1 and user_id=$2 and revoked_at is null`, [tenantId, userId]);
  });
}
