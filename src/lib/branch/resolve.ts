import { cookies } from "next/headers";
import type { Branch } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { CURRENT_BRANCH_COOKIE } from "@/lib/branch/constants";
import { isTenantSession, type SessionContext } from "@/lib/session";

export type ResolvedBranch = Pick<Branch, "id" | "code" | "name" | "isActive" | "isDefault">;

export type BranchResolutionSource =
  | "session_cookie"
  | "user_default"
  | "tenant_default"
  | "first_permitted"
  | "none";

export async function getCurrentBranchCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(CURRENT_BRANCH_COOKIE)?.value?.trim();
  return value || null;
}

async function userHasBranchAccess(
  tenantId: string,
  userId: string,
  branchId: string,
): Promise<boolean> {
  const assignment = await prisma.userBranch.findFirst({
    where: {
      tenantId,
      userId,
      branchId,
      isActive: true,
      branch: { tenantId, isActive: true },
    },
    select: { id: true },
  });
  return Boolean(assignment);
}

async function loadPermittedBranch(
  tenantId: string,
  userId: string,
  branchId: string,
): Promise<ResolvedBranch | null> {
  const allowed = await userHasBranchAccess(tenantId, userId, branchId);
  if (!allowed) return null;

  return prisma.branch.findFirst({
    where: { id: branchId, tenantId, isActive: true },
    select: { id: true, code: true, name: true, isActive: true, isDefault: true },
  });
}

export async function resolveCurrentBranch(params: {
  tenantId: string;
  userId: string;
  sessionBranchId: string;
  cookieBranchId?: string | null;
}): Promise<{ branch: ResolvedBranch | null; source: BranchResolutionSource }> {
  const { tenantId, userId, sessionBranchId, cookieBranchId } = params;

  if (cookieBranchId) {
    const fromCookie = await loadPermittedBranch(tenantId, userId, cookieBranchId);
    if (fromCookie) {
      return { branch: fromCookie, source: "session_cookie" };
    }
  }

  if (sessionBranchId) {
    const fromSession = await loadPermittedBranch(tenantId, userId, sessionBranchId);
    if (fromSession) {
      return { branch: fromSession, source: "session_cookie" };
    }
  }

  const userDefault = await prisma.userBranch.findFirst({
    where: {
      tenantId,
      userId,
      isActive: true,
      isPrimary: true,
      branch: { tenantId, isActive: true },
    },
    include: {
      branch: {
        select: { id: true, code: true, name: true, isActive: true, isDefault: true },
      },
    },
  });
  if (userDefault?.branch) {
    return { branch: userDefault.branch, source: "user_default" };
  }

  const tenantDefault = await prisma.branch.findFirst({
    where: { tenantId, isActive: true, isDefault: true },
    select: { id: true, code: true, name: true, isActive: true, isDefault: true },
  });
  if (tenantDefault) {
    const allowed = await userHasBranchAccess(tenantId, userId, tenantDefault.id);
    if (allowed) {
      return { branch: tenantDefault, source: "tenant_default" };
    }
  }

  const firstPermitted = await prisma.userBranch.findFirst({
    where: {
      tenantId,
      userId,
      isActive: true,
      branch: { tenantId, isActive: true },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    include: {
      branch: {
        select: { id: true, code: true, name: true, isActive: true, isDefault: true },
      },
    },
  });
  if (firstPermitted?.branch) {
    return { branch: firstPermitted.branch, source: "first_permitted" };
  }

  return { branch: null, source: "none" };
}

export async function enrichSessionBranchContext(
  session: SessionContext,
): Promise<SessionContext> {
  if (!isTenantSession(session)) {
    return session;
  }

  const cookieBranchId = await getCurrentBranchCookie();
  const resolved = await resolveCurrentBranch({
    tenantId: session.tenantId,
    userId: session.userId,
    sessionBranchId: session.branchId,
    cookieBranchId,
  });

  if (!resolved.branch) {
    return session;
  }

  return {
    ...session,
    branchId: resolved.branch.id,
    branchCode: resolved.branch.code,
    branchName: resolved.branch.name,
  };
}

export async function listSwitchableBranches(tenantId: string, userId: string) {
  const rows = await prisma.userBranch.findMany({
    where: {
      tenantId,
      userId,
      isActive: true,
      branch: { tenantId, isActive: true },
    },
    orderBy: [{ isPrimary: "desc" }, { branch: { name: "asc" } }],
    include: {
      branch: {
        select: {
          id: true,
          code: true,
          name: true,
          isDefault: true,
          branchType: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.branch.id,
    code: row.branch.code,
    name: row.branch.name,
    isDefault: row.branch.isDefault,
    isPrimary: row.isPrimary,
    branchType: row.branch.branchType,
  }));
}
