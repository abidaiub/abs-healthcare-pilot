"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { cookies } from "next/headers";
import type { EntityStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { CURRENT_BRANCH_COOKIE } from "@/lib/branch/constants";
import { BRANCH_ERROR_CODES } from "@/lib/branch/errors";
import {
  assertTenantOwnsBranchRecord,
  getTenantBranchDetail,
} from "@/lib/branch/queries";
import { parseBranchFormData } from "@/lib/branch/validation";
import { requireTenantSession } from "@/lib/auth";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { writeAuditLog } from "@/lib/saas/audit";
import { SESSION_COOKIE, type SessionContext } from "@/lib/session";

export type BranchActionResult =
  | { ok: true; branchId?: string; userId?: string }
  | { ok: false; errorCode: string };

async function writeSessionCookie(session: SessionContext): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

function revalidateBranchPaths(branchId?: string) {
  revalidatePath("/settings/branches");
  if (branchId) {
    revalidatePath(`/settings/branches/${branchId}`);
  }
  revalidatePath("/", "layout");
}

async function auditBranchEvent(input: {
  tenantId: string;
  branchId: string;
  userId: string;
  actorName: string;
  actionType: "INSERT" | "UPDATE" | "DELETE";
  event: string;
  entityId: string;
  changeData: Record<string, unknown>;
}) {
  await writeAuditLog({
    tenantId: input.tenantId,
    branchId: input.branchId,
    userId: input.userId,
    actionType: input.actionType,
    entityType: "Branch",
    entityId: input.entityId,
    changeData: { event: input.event, ...input.changeData },
    createdBy: input.actorName,
  });
}

async function clearOtherDefaults(tx: Prisma.TransactionClient, tenantId: string, exceptId?: string) {
  await tx.branch.updateMany({
    where: {
      tenantId,
      isDefault: true,
      ...(exceptId ? { NOT: { id: exceptId } } : {}),
    },
    data: { isDefault: false },
  });
}

export async function createTenantBranchAction(
  formData: FormData,
): Promise<BranchActionResult> {
  const session = await requireTenantPermission("/settings/branches", "canCreate");
  const parsed = parseBranchFormData(formData);
  if ("error" in parsed) {
    return { ok: false, errorCode: BRANCH_ERROR_CODES.BRANCH_VALIDATION };
  }

  const duplicate = await prisma.branch.findFirst({
    where: { tenantId: session.tenantId, code: parsed.code },
  });
  if (duplicate) {
    return { ok: false, errorCode: BRANCH_ERROR_CODES.BRANCH_CODE_DUPLICATE };
  }

  const branchCount = await prisma.branch.count({ where: { tenantId: session.tenantId } });
  const shouldDefault = parsed.isDefault || branchCount === 0;

  const branch = await prisma.$transaction(async (tx) => {
    if (shouldDefault) {
      await clearOtherDefaults(tx, session.tenantId);
    }

    return tx.branch.create({
      data: {
        tenantId: session.tenantId,
        code: parsed.code,
        name: parsed.name,
        branchType: parsed.branchType,
        address: parsed.addressLine1,
        addressLine1: parsed.addressLine1,
        addressLine2: parsed.addressLine2,
        city: parsed.city,
        district: parsed.district,
        postalCode: parsed.postalCode,
        countryCode: parsed.countryCode,
        phone: parsed.phone,
        email: parsed.email,
        timezone: parsed.timezone,
        openingTime: parsed.openingTime,
        closingTime: parsed.closingTime,
        notes: parsed.notes,
        isDefault: shouldDefault,
        status: "ACTIVE",
        isActive: true,
        createdBy: session.user.name,
        updatedBy: session.user.name,
      },
    });
  });

  await auditBranchEvent({
    tenantId: session.tenantId,
    branchId: branch.id,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "INSERT",
    event: "BRANCH_CREATED",
    entityId: branch.id,
    changeData: { newValue: `${branch.code} — ${branch.name}`, isDefault: branch.isDefault },
  });

  revalidateBranchPaths(branch.id);
  return { ok: true, branchId: branch.id };
}

export async function updateTenantBranchAction(
  branchId: string,
  formData: FormData,
): Promise<BranchActionResult> {
  const session = await requireTenantPermission("/settings/branches", "canEdit");
  const existing = await assertTenantOwnsBranchRecord(session.tenantId, branchId);
  const parsed = parseBranchFormData(formData);
  if ("error" in parsed) {
    return { ok: false, errorCode: BRANCH_ERROR_CODES.BRANCH_VALIDATION };
  }

  const duplicate = await prisma.branch.findFirst({
    where: {
      tenantId: session.tenantId,
      code: parsed.code,
      NOT: { id: branchId },
    },
  });
  if (duplicate) {
    return { ok: false, errorCode: BRANCH_ERROR_CODES.BRANCH_CODE_DUPLICATE };
  }

  const branch = await prisma.$transaction(async (tx) => {
    if (parsed.isDefault) {
      await clearOtherDefaults(tx, session.tenantId, branchId);
    }

    return tx.branch.update({
      where: { id: branchId },
      data: {
        code: parsed.code,
        name: parsed.name,
        branchType: parsed.branchType,
        address: parsed.addressLine1,
        addressLine1: parsed.addressLine1,
        addressLine2: parsed.addressLine2,
        city: parsed.city,
        district: parsed.district,
        postalCode: parsed.postalCode,
        countryCode: parsed.countryCode,
        phone: parsed.phone,
        email: parsed.email,
        timezone: parsed.timezone,
        openingTime: parsed.openingTime,
        closingTime: parsed.closingTime,
        notes: parsed.notes,
        isDefault: parsed.isDefault ? true : existing.isDefault,
        updatedBy: session.user.name,
      },
    });
  });

  await auditBranchEvent({
    tenantId: session.tenantId,
    branchId: branch.id,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "BRANCH_UPDATED",
    entityId: branch.id,
    changeData: {
      oldValue: `${existing.code} — ${existing.name}`,
      newValue: `${branch.code} — ${branch.name}`,
    },
  });

  revalidateBranchPaths(branch.id);
  return { ok: true, branchId: branch.id };
}

export async function activateTenantBranchAction(branchId: string): Promise<BranchActionResult> {
  const session = await requireTenantPermission("/settings/branches", "canEdit");
  const existing = await assertTenantOwnsBranchRecord(session.tenantId, branchId);

  if (existing.isActive) {
    return { ok: true, branchId };
  }

  const branch = await prisma.branch.update({
    where: { id: branchId },
    data: { isActive: true, status: "ACTIVE" as EntityStatus, updatedBy: session.user.name },
  });

  await auditBranchEvent({
    tenantId: session.tenantId,
    branchId: branch.id,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "BRANCH_ACTIVATED",
    entityId: branch.id,
    changeData: { oldValue: "inactive", newValue: "active" },
  });

  revalidateBranchPaths(branch.id);
  return { ok: true, branchId: branch.id };
}

export async function deactivateTenantBranchAction(branchId: string): Promise<BranchActionResult> {
  const session = await requireTenantPermission("/settings/branches", "canEdit");
  const existing = await assertTenantOwnsBranchRecord(session.tenantId, branchId);

  if (existing.isDefault) {
    return { ok: false, errorCode: BRANCH_ERROR_CODES.BRANCH_DEFAULT_CANNOT_DEACTIVATE };
  }

  if (!existing.isActive) {
    return { ok: true, branchId };
  }

  const activeCount = await prisma.branch.count({
    where: { tenantId: session.tenantId, isActive: true },
  });
  if (activeCount <= 1) {
    return { ok: false, errorCode: BRANCH_ERROR_CODES.BRANCH_DEFAULT_REQUIRED };
  }

  const branch = await prisma.branch.update({
    where: { id: branchId },
    data: { isActive: false, status: "INACTIVE" as EntityStatus, updatedBy: session.user.name },
  });

  await auditBranchEvent({
    tenantId: session.tenantId,
    branchId: branch.id,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "BRANCH_DEACTIVATED",
    entityId: branch.id,
    changeData: { oldValue: "active", newValue: "inactive" },
  });

  revalidateBranchPaths(branch.id);
  return { ok: true, branchId: branch.id };
}

export async function setDefaultTenantBranchAction(branchId: string): Promise<BranchActionResult> {
  const session = await requireTenantPermission("/settings/branches", "canApprove");
  const existing = await assertTenantOwnsBranchRecord(session.tenantId, branchId);

  if (!existing.isActive) {
    return { ok: false, errorCode: BRANCH_ERROR_CODES.BRANCH_INACTIVE };
  }

  await prisma.$transaction(async (tx) => {
    await clearOtherDefaults(tx, session.tenantId, branchId);
    await tx.branch.update({
      where: { id: branchId },
      data: { isDefault: true, updatedBy: session.user.name },
    });
  });

  await auditBranchEvent({
    tenantId: session.tenantId,
    branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "BRANCH_DEFAULT_CHANGED",
    entityId: branchId,
    changeData: { newValue: existing.code },
  });

  revalidateBranchPaths(branchId);
  return { ok: true, branchId };
}

export async function assignUserToBranchAction(
  branchId: string,
  userId: string,
): Promise<BranchActionResult> {
  const session = await requireTenantPermission("/settings/branches", "canEdit");
  const branch = await assertTenantOwnsBranchRecord(session.tenantId, branchId);

  if (!branch.isActive) {
    return { ok: false, errorCode: BRANCH_ERROR_CODES.BRANCH_INACTIVE };
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId: session.tenantId },
  });
  if (!user || !user.isActive || user.userStatus !== "ACTIVE") {
    return { ok: false, errorCode: BRANCH_ERROR_CODES.BRANCH_USER_INACTIVE };
  }

  await prisma.userBranch.upsert({
    where: { userId_branchId: { userId, branchId } },
    update: { isActive: true, updatedBy: session.user.name },
    create: {
      tenantId: session.tenantId,
      userId,
      branchId,
      isPrimary: false,
      createdBy: session.user.name,
      updatedBy: session.user.name,
    },
  });

  await auditBranchEvent({
    tenantId: session.tenantId,
    branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "BRANCH_USER_ASSIGNED",
    entityId: userId,
    changeData: { branchCode: branch.code, targetUserId: userId },
  });

  revalidateBranchPaths(branchId);
  return { ok: true, branchId, userId };
}

export async function removeUserFromBranchAction(
  branchId: string,
  userId: string,
): Promise<BranchActionResult> {
  const session = await requireTenantPermission("/settings/branches", "canEdit");
  const branch = await assertTenantOwnsBranchRecord(session.tenantId, branchId);

  const assignment = await prisma.userBranch.findFirst({
    where: { tenantId: session.tenantId, userId, branchId, isActive: true },
  });
  if (!assignment) {
    return { ok: false, errorCode: BRANCH_ERROR_CODES.BRANCH_ASSIGNMENT_INVALID };
  }

  const remaining = await prisma.userBranch.count({
    where: {
      tenantId: session.tenantId,
      userId,
      isActive: true,
      NOT: { branchId },
      branch: { isActive: true },
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.userBranch.update({
      where: { id: assignment.id },
      data: { isActive: false, isPrimary: false, updatedBy: session.user.name },
    });

    if (assignment.isPrimary && remaining > 0) {
      const next = await tx.userBranch.findFirst({
        where: {
          tenantId: session.tenantId,
          userId,
          isActive: true,
          branch: { isActive: true },
        },
        orderBy: { createdAt: "asc" },
      });
      if (next) {
        await tx.userBranch.update({
          where: { id: next.id },
          data: { isPrimary: true, updatedBy: session.user.name },
        });
      }
    }
  });

  await auditBranchEvent({
    tenantId: session.tenantId,
    branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "BRANCH_USER_REMOVED",
    entityId: userId,
    changeData: { branchCode: branch.code, targetUserId: userId },
  });

  revalidateBranchPaths(branchId);
  return { ok: true, branchId, userId };
}

export async function setUserDefaultBranchAction(
  branchId: string,
  userId: string,
): Promise<BranchActionResult> {
  const session = await requireTenantPermission("/settings/branches", "canEdit");
  const branch = await assertTenantOwnsBranchRecord(session.tenantId, branchId);

  if (!branch.isActive) {
    return { ok: false, errorCode: BRANCH_ERROR_CODES.BRANCH_INACTIVE };
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId: session.tenantId, isActive: true, userStatus: "ACTIVE" },
  });
  if (!user) {
    return { ok: false, errorCode: BRANCH_ERROR_CODES.BRANCH_USER_INACTIVE };
  }

  const assignment = await prisma.userBranch.findFirst({
    where: { tenantId: session.tenantId, userId, branchId, isActive: true },
  });
  if (!assignment) {
    return { ok: false, errorCode: BRANCH_ERROR_CODES.BRANCH_ASSIGNMENT_INVALID };
  }

  await prisma.$transaction(async (tx) => {
    await tx.userBranch.updateMany({
      where: { tenantId: session.tenantId, userId, isPrimary: true },
      data: { isPrimary: false, updatedBy: session.user.name },
    });
    await tx.userBranch.update({
      where: { id: assignment.id },
      data: { isPrimary: true, updatedBy: session.user.name },
    });
  });

  await auditBranchEvent({
    tenantId: session.tenantId,
    branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "BRANCH_USER_DEFAULT_CHANGED",
    entityId: userId,
    changeData: { branchCode: branch.code, targetUserId: userId },
  });

  revalidateBranchPaths(branchId);
  return { ok: true, branchId, userId };
}

export async function switchCurrentBranchAction(branchId: string): Promise<BranchActionResult> {
  const session = await requireTenantSession();

  const assignment = await prisma.userBranch.findFirst({
    where: {
      tenantId: session.tenantId,
      userId: session.userId,
      branchId,
      isActive: true,
      branch: { tenantId: session.tenantId, isActive: true },
    },
    include: { branch: { select: { id: true, code: true, name: true } } },
  });

  if (!assignment?.branch) {
    return { ok: false, errorCode: BRANCH_ERROR_CODES.BRANCH_ACCESS_DENIED };
  }

  const cookieStore = await cookies();
  cookieStore.set(CURRENT_BRANCH_COOKIE, branchId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  const updatedSession: SessionContext = {
    ...session,
    branchId: assignment.branch.id,
    branchCode: assignment.branch.code,
    branchName: assignment.branch.name,
  };
  await writeSessionCookie(updatedSession);

  await auditBranchEvent({
    tenantId: session.tenantId,
    branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "BRANCH_CONTEXT_SWITCHED",
    entityId: session.userId,
    changeData: {
      oldBranchId: session.branchId,
      newBranchId: branchId,
      newBranchCode: assignment.branch.code,
    },
  });

  revalidatePath("/", "layout");
  return { ok: true, branchId };
}

export async function getTenantBranchDetailAction(branchId: string) {
  await requireTenantPermission("/settings/branches");
  const session = await requireTenantSession();
  return getTenantBranchDetail(session.tenantId, branchId);
}
