"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  assertLoginAllowed,
  clearLoginAttempts,
  recordFailedLogin,
} from "@/lib/login-rate-limit";
import { verifyPassword } from "@/lib/password";
import { writeAuditLog } from "@/lib/saas/audit";
import {
  PLATFORM_SESSION_CONTEXT,
  SESSION_COOKIE,
  getPostLoginPath,
  type SessionContext,
} from "@/lib/session";

const GENERIC_ERROR = "Invalid username or password.";

async function writeSessionCookie(session: SessionContext): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function hostLoginAction(
  formData: FormData,
): Promise<{ error: string } | void> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: GENERIC_ERROR };
  }

  try {
    await assertLoginAllowed(`host:${username.toLowerCase()}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : GENERIC_ERROR,
    };
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      userRoles: {
        where: { isActive: true, isPrimary: true },
        include: { role: true },
        take: 1,
      },
    },
  });

  if (
    !user ||
    !user.isActive ||
    user.userStatus !== "ACTIVE" ||
    !user.isHostAdmin ||
    user.tenantId !== null ||
    !verifyPassword(password, user.passwordHash)
  ) {
    if (user && user.userStatus === "LOCKED") {
      return { error: "Account is locked. Contact an administrator." };
    }
    await recordFailedLogin(`host:${username.toLowerCase()}`, user?.id);
    return { error: GENERIC_ERROR };
  }

  await clearLoginAttempts(`host:${username.toLowerCase()}`);

  const roleName = user.userRoles[0]?.role.roleName ?? "Host Admin";
  const roleCode = user.userRoles[0]?.role.roleCode ?? "HOST_ADMIN";

  const session: SessionContext = {
    loginKind: "host",
    userId: user.id,
    ...PLATFORM_SESSION_CONTEXT,
    user: {
      name: user.username,
      role: roleName,
      roleCode,
      employeeCode: "HOST-001",
    },
  };

  await writeSessionCookie(session);

  await writeAuditLog({
    userId: user.id,
    actionType: "LOGIN",
    entityType: "HostSession",
    entityId: user.id,
    changeData: { newValue: "Success", loginKind: "host" },
    createdBy: user.username,
  });

  redirect("/host/dashboard");
}

export async function tenantLoginAction(
  formData: FormData,
): Promise<{ error: string } | void> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const tenantId = String(formData.get("tenantId") ?? "").trim();
  const branchId = String(formData.get("branchId") ?? "").trim();

  if (!username || !password || !tenantId || !branchId) {
    return { error: GENERIC_ERROR };
  }

  try {
    await assertLoginAllowed(`tenant:${username.toLowerCase()}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : GENERIC_ERROR,
    };
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      userRoles: {
        where: { isActive: true, isPrimary: true },
        include: { role: true },
        take: 1,
      },
    },
  });

  if (
    !user ||
    !user.isActive ||
    user.isHostAdmin ||
    user.tenantId !== tenantId ||
    !verifyPassword(password, user.passwordHash)
  ) {
    if (user?.userStatus === "LOCKED") {
      return { error: "Account is locked. Contact an administrator." };
    }
    if (user && user.userStatus !== "ACTIVE") {
      await recordFailedLogin(`tenant:${username.toLowerCase()}`, user.id);
      return { error: GENERIC_ERROR };
    }
    await recordFailedLogin(`tenant:${username.toLowerCase()}`, user?.id);
    return { error: GENERIC_ERROR };
  }

  if (user.userStatus !== "ACTIVE") {
    await recordFailedLogin(`tenant:${username.toLowerCase()}`, user.id);
    return { error: GENERIC_ERROR };
  }

  const [tenant, branch] = await Promise.all([
    prisma.tenant.findFirst({
      where: { id: tenantId, isActive: true },
    }),
    prisma.branch.findFirst({
      where: { id: branchId, tenantId, isActive: true },
    }),
  ]);

  if (!tenant || !branch) {
    await recordFailedLogin(`tenant:${username.toLowerCase()}`, user.id);
    return { error: GENERIC_ERROR };
  }

  await clearLoginAttempts(`tenant:${username.toLowerCase()}`);

  const roleName = user.userRoles[0]?.role.roleName ?? "Tenant User";
  const roleCode = user.userRoles[0]?.role.roleCode ?? "TENANT_USER";

  const session: SessionContext = {
    loginKind: "tenant",
    userId: user.id,
    tenantId: tenant.id,
    tenantName: tenant.tenantName,
    tenantCode: tenant.tenantCode,
    branchId: branch.id,
    branchName: branch.name,
    branchCode: branch.code,
    user: {
      name: user.username,
      role: roleName,
      roleCode,
      employeeCode: user.id.slice(-8).toUpperCase(),
    },
  };

  await writeSessionCookie(session);

  await writeAuditLog({
    tenantId: tenant.id,
    branchId: branch.id,
    userId: user.id,
    actionType: "LOGIN",
    entityType: "TenantSession",
    entityId: user.id,
    changeData: { newValue: "Success", loginKind: "tenant" },
    createdBy: user.username,
  });

  redirect(getPostLoginPath(session));
}
