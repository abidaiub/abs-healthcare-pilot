import type { PrismaClient } from "../../src/generated/prisma/client";

const ABMG_BRANCHES = [
  {
    code: "BR-HO-01",
    name: "Head Office",
    branchType: "HEAD_OFFICE" as const,
    addressLine1: "12/A Dhanmondi, Dhaka 1209",
    city: "Dhaka",
    district: "Dhaka",
    phone: "+880 17 0000 0000",
    email: "headoffice@albarakamedical.com",
    timezone: "Asia/Dhaka",
    countryCode: "BD",
    isDefault: true,
  },
  {
    code: "BR-MIR-02",
    name: "Mirpur Branch",
    branchType: "DIAGNOSTIC_CENTER" as const,
    addressLine1: "House 22, Mirpur DOHS, Dhaka",
    city: "Dhaka",
    district: "Dhaka",
    phone: "+880 17 0000 0001",
    email: "mirpur@albarakamedical.com",
    timezone: "Asia/Dhaka",
    countryCode: "BD",
    isDefault: false,
  },
] as const;

export async function seedBranchFoundation(prisma: PrismaClient, tenantId: string) {
  await prisma.branch.updateMany({
    where: { tenantId },
    data: { isDefault: false },
  });

  for (const seed of ABMG_BRANCHES) {
    await prisma.branch.upsert({
      where: {
        tenantId_code: { tenantId, code: seed.code },
      },
      update: {
        name: seed.name,
        branchType: seed.branchType,
        address: seed.addressLine1,
        addressLine1: seed.addressLine1,
        city: seed.city,
        district: seed.district,
        phone: seed.phone,
        email: seed.email,
        timezone: seed.timezone,
        countryCode: seed.countryCode,
        isDefault: seed.isDefault,
        isActive: true,
        status: "ACTIVE",
      },
      create: {
        tenantId,
        code: seed.code,
        name: seed.name,
        branchType: seed.branchType,
        address: seed.addressLine1,
        addressLine1: seed.addressLine1,
        city: seed.city,
        district: seed.district,
        phone: seed.phone,
        email: seed.email,
        timezone: seed.timezone,
        countryCode: seed.countryCode,
        isDefault: seed.isDefault,
        isActive: true,
        status: "ACTIVE",
      },
    });
  }

  const defaultBranch = await prisma.branch.findFirst({
    where: { tenantId, isDefault: true, isActive: true },
  });
  if (!defaultBranch) {
    const first = await prisma.branch.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: "asc" },
    });
    if (first) {
      await prisma.branch.update({
        where: { id: first.id },
        data: { isDefault: true },
      });
    }
  }

  const users = await prisma.user.findMany({
    where: { tenantId, isActive: true, userStatus: "ACTIVE", isHostAdmin: false },
    select: { id: true, username: true },
  });

  const branches = await prisma.branch.findMany({
    where: { tenantId, isActive: true },
    orderBy: { code: "asc" },
  });

  for (const user of users) {
    for (const [index, branch] of branches.entries()) {
      await prisma.userBranch.upsert({
        where: { userId_branchId: { userId: user.id, branchId: branch.id } },
        update: { isActive: true },
        create: {
          tenantId,
          userId: user.id,
          branchId: branch.id,
          isPrimary: branch.isDefault || index === 0,
          createdBy: "seed",
          updatedBy: "seed",
        },
      });
    }
  }
}
