"use server";

import { revalidatePath } from "next/cache";
import type { UserStatus } from "@/generated/prisma/client";
import { requireTenantSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { requireTenantPermission } from "@/lib/rbac/auth";
import {
  assertTenantOwnsUser,
  getTenantUserDetail,
} from "@/lib/rbac/queries";
import { writeAuditLog } from "@/lib/saas/audit";

export type TenantUserActionResult =
  | { ok: true; userId?: string }
  | { ok: false; error: string };

function parseUserStatus(value: string): UserStatus | null {
  const normalized = value.trim().toUpperCase();
  if (
    normalized === "ACTIVE" ||
    normalized === "INACTIVE" ||
    normalized === "LOCKED" ||
    normalized === "SUSPENDED" ||
    normalized === "ARCHIVED"
  ) {
    return normalized;
  }
  return null;
}

async function getActor() {
  const session = await requireTenantPermission("/settings/users", "canEdit");
  return {
    session,
    username: session.user.name,
    userId: session.userId,
    tenantId: session.tenantId,
  };
}

function revalidateUserPaths(tenantId: string, userId?: string) {
  revalidatePath("/settings/users");
  if (userId) {
    revalidatePath(`/settings/users/${userId}`);
  }
  revalidatePath("/host/audit");
}

export async function createTenantUserAction(
  formData: FormData,
): Promise<TenantUserActionResult> {
  const actor = await getActor();

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "").trim() || "Tenant@2026!";
  const primaryRoleId = String(formData.get("primaryRoleId") ?? "").trim();
  const primaryBranchId = String(formData.get("primaryBranchId") ?? "").trim();
  const forcePasswordChange = String(formData.get("forcePasswordChange") ?? "") === "true";

  if (!username || !email || !primaryRoleId || !primaryBranchId) {
    return { ok: false, error: "Username, email, primary role, and primary branch are required." };
  }

  const [existingUsername, existingEmail, role, branch] = await Promise.all([
    prisma.user.findUnique({ where: { username }, select: { id: true } }),
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.role.findFirst({
      where: { id: primaryRoleId, tenantId: actor.tenantId, isActive: true },
    }),
    prisma.branch.findFirst({
      where: { id: primaryBranchId, tenantId: actor.tenantId, isActive: true },
    }),
  ]);

  if (existingUsername) return { ok: false, error: "Username already exists." };
  if (existingEmail) return { ok: false, error: "Email already exists." };
  if (!role) return { ok: false, error: "Selected role is invalid." };
  if (!branch) return { ok: false, error: "Selected branch is invalid." };

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        tenantId: actor.tenantId,
        username,
        email,
        phone,
        passwordHash: hashPassword(password),
        forcePasswordChange,
        isHostAdmin: false,
        createdBy: actor.username,
        updatedBy: actor.username,
      },
    });

    await tx.userRole.create({
      data: {
        tenantId: actor.tenantId,
        userId: created.id,
        roleId: role.id,
        isPrimary: true,
        createdBy: actor.username,
        updatedBy: actor.username,
      },
    });

    await tx.userBranch.create({
      data: {
        tenantId: actor.tenantId,
        userId: created.id,
        branchId: branch.id,
        isPrimary: true,
        createdBy: actor.username,
        updatedBy: actor.username,
      },
    });

    return created;
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    branchId: primaryBranchId,
    userId: actor.userId,
    actionType: "INSERT",
    entityType: "User",
    entityId: user.id,
    changeData: {
      newValue: username,
      email,
      roleCode: role.roleCode,
      branchId: primaryBranchId,
    },
    createdBy: actor.username,
  });

  revalidateUserPaths(actor.tenantId, user.id);
  return { ok: true, userId: user.id };
}

export async function updateTenantUserAction(
  userId: string,
  formData: FormData,
): Promise<TenantUserActionResult> {
  const actor = await getActor();
  await assertTenantOwnsUser(actor.tenantId, userId);

  const existing = await getTenantUserDetail(actor.tenantId, userId);
  if (!existing) return { ok: false, error: "User not found." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const userStatus = parseUserStatus(String(formData.get("userStatus") ?? existing.userStatus));
  const primaryRoleId = String(formData.get("primaryRoleId") ?? "").trim();
  const primaryBranchId = String(formData.get("primaryBranchId") ?? "").trim();
  const forcePasswordChange = String(formData.get("forcePasswordChange") ?? "") === "true";

  if (!email || !userStatus || !primaryRoleId || !primaryBranchId) {
    return { ok: false, error: "Email, status, primary role, and primary branch are required." };
  }

  const emailOwner = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (emailOwner && emailOwner.id !== userId) {
    return { ok: false, error: "Email already belongs to another user." };
  }

  const [role, branch] = await Promise.all([
    prisma.role.findFirst({
      where: { id: primaryRoleId, tenantId: actor.tenantId, isActive: true },
    }),
    prisma.branch.findFirst({
      where: { id: primaryBranchId, tenantId: actor.tenantId, isActive: true },
    }),
  ]);

  if (!role) return { ok: false, error: "Selected role is invalid." };
  if (!branch) return { ok: false, error: "Selected branch is invalid." };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        email,
        phone,
        userStatus,
        forcePasswordChange,
        isActive: userStatus !== "ARCHIVED",
        updatedBy: actor.username,
      },
    });

    await tx.userRole.updateMany({
      where: { userId, tenantId: actor.tenantId },
      data: { isPrimary: false, updatedBy: actor.username },
    });

    await tx.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
      update: {
        tenantId: actor.tenantId,
        isPrimary: true,
        isActive: true,
        updatedBy: actor.username,
      },
      create: {
        tenantId: actor.tenantId,
        userId,
        roleId: role.id,
        isPrimary: true,
        createdBy: actor.username,
        updatedBy: actor.username,
      },
    });

    await tx.userBranch.updateMany({
      where: { userId, tenantId: actor.tenantId },
      data: { isPrimary: false, updatedBy: actor.username },
    });

    await tx.userBranch.upsert({
      where: {
        userId_branchId: {
          userId,
          branchId: branch.id,
        },
      },
      update: {
        tenantId: actor.tenantId,
        isPrimary: true,
        isActive: true,
        updatedBy: actor.username,
      },
      create: {
        tenantId: actor.tenantId,
        userId,
        branchId: branch.id,
        isPrimary: true,
        createdBy: actor.username,
        updatedBy: actor.username,
      },
    });
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    branchId: primaryBranchId,
    userId: actor.userId,
    actionType: "UPDATE",
    entityType: "User",
    entityId: userId,
    changeData: {
      oldValue: { email: existing.email, userStatus: existing.userStatus },
      newValue: { email, userStatus, roleCode: role.roleCode },
    },
    createdBy: actor.username,
  });

  revalidateUserPaths(actor.tenantId, userId);
  return { ok: true, userId };
}

export async function resetTenantUserPasswordAction(
  userId: string,
  formData: FormData,
): Promise<TenantUserActionResult> {
  const actor = await requireTenantPermission("/settings/users", "canEdit");
  await assertTenantOwnsUser(actor.tenantId, userId);

  const temporaryPassword =
    String(formData.get("temporaryPassword") ?? "").trim() || "Tenant@2026!";
  const forcePasswordChange = String(formData.get("forcePasswordChange") ?? "true") === "true";

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: hashPassword(temporaryPassword),
      forcePasswordChange,
      userStatus: "ACTIVE",
      updatedBy: actor.user.name,
    },
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    userId: actor.userId,
    actionType: "UPDATE",
    entityType: "User",
    entityId: userId,
    changeData: {
      newValue: "Password reset by administrator",
      forcePasswordChange,
    },
    createdBy: actor.user.name,
  });

  revalidateUserPaths(actor.tenantId, userId);
  return { ok: true, userId };
}

export async function toggleTenantUserStatusAction(input: {
  userId: string;
  action: "activate" | "deactivate" | "unlock";
}): Promise<TenantUserActionResult> {
  const actor = await requireTenantPermission("/settings/users", "canEdit");
  await assertTenantOwnsUser(actor.tenantId, input.userId);

  const nextStatus =
    input.action === "activate"
      ? "ACTIVE"
      : input.action === "unlock"
        ? "ACTIVE"
        : "INACTIVE";

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      userStatus: nextStatus,
      isActive: nextStatus === "ACTIVE",
      updatedBy: actor.user.name,
    },
  });

  await writeAuditLog({
    tenantId: actor.tenantId,
    userId: actor.userId,
    actionType: "UPDATE",
    entityType: "User",
    entityId: input.userId,
    changeData: { newValue: nextStatus, action: input.action },
    createdBy: actor.user.name,
  });

  revalidateUserPaths(actor.tenantId, input.userId);
  return { ok: true, userId: input.userId };
}
