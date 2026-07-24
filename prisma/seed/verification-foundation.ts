import type { PrismaClient } from "../../src/generated/prisma/client";
import { UserStatus } from "../../src/generated/prisma/client";
import { hashPassword } from "../../src/lib/password";

const PATHOLOGIST_USER = {
  username: "mahmuda.khatun",
  email: "mahmuda.khatun@albarakamedical.com",
  phone: "+880 17 1111 0090",
  password: "Tenant@2026!",
  doctorCode: "DR-MK-001",
};

export async function seedVerificationFoundation(
  prisma: PrismaClient,
  tenantId: string,
  branchId: string,
) {
  const actor = "seed.verification";
  const pathologistRole = await prisma.role.findFirst({
    where: { tenantId, roleCode: "PATHOLOGIST", isActive: true },
    select: { id: true },
  });
  if (!pathologistRole) return;

  const doctor = await prisma.doctor.findFirst({
    where: { tenantId, doctorCode: PATHOLOGIST_USER.doctorCode, isActive: true },
    select: { id: true, userId: true },
  });

  const passwordHash = hashPassword(PATHOLOGIST_USER.password);
  const user = await prisma.user.upsert({
    where: { username: PATHOLOGIST_USER.username },
    update: {
      email: PATHOLOGIST_USER.email,
      phone: PATHOLOGIST_USER.phone,
      passwordHash,
      tenantId,
      isHostAdmin: false,
      userStatus: UserStatus.ACTIVE,
      isActive: true,
    },
    create: {
      username: PATHOLOGIST_USER.username,
      email: PATHOLOGIST_USER.email,
      phone: PATHOLOGIST_USER.phone,
      passwordHash,
      tenantId,
      isHostAdmin: false,
      userStatus: UserStatus.ACTIVE,
      createdBy: actor,
      updatedBy: actor,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: pathologistRole.id,
      },
    },
    update: {
      tenantId,
      isPrimary: true,
      isActive: true,
    },
    create: {
      tenantId,
      userId: user.id,
      roleId: pathologistRole.id,
      isPrimary: true,
      createdBy: actor,
      updatedBy: actor,
    },
  });

  await prisma.userBranch.upsert({
    where: {
      userId_branchId: {
        userId: user.id,
        branchId,
      },
    },
    update: {
      tenantId,
      isPrimary: true,
      isActive: true,
    },
    create: {
      tenantId,
      userId: user.id,
      branchId,
      isPrimary: true,
      createdBy: actor,
      updatedBy: actor,
    },
  });

  if (doctor && !doctor.userId) {
    await prisma.doctor.update({
      where: { id: doctor.id },
      data: { userId: user.id, updatedBy: actor },
    });
  }
}
