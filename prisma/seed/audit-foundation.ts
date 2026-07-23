import type { PrismaClient } from "../../src/generated/prisma/client";

export async function seedTenantAuditSamples(
  prisma: PrismaClient,
  tenantId: string,
  branchId: string,
  adminUserId: string,
) {
  const existing = await prisma.auditLog.count({ where: { tenantId } });
  if (existing > 0) {
    console.log(`Tenant audit samples skipped — ${existing} row(s) already present`);
    return;
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminUserId },
    select: { username: true },
  });

  const actor = admin?.username ?? "laila.hasan";

  await prisma.auditLog.createMany({
    data: [
      {
        tenantId,
        branchId,
        userId: adminUserId,
        actionType: "LOGIN",
        entityType: "TenantSession",
        entityId: adminUserId,
        changeData: { newValue: "Success", loginKind: "tenant" },
        createdBy: actor,
      },
      {
        tenantId,
        branchId,
        userId: adminUserId,
        actionType: "INSERT",
        entityType: "User",
        entityId: adminUserId,
        changeData: {
          newValue: "arif.hossain",
          email: "arif.hossain@albarakamedical.com",
          roleCode: "RECEPTION",
        },
        createdBy: actor,
      },
      {
        tenantId,
        branchId,
        userId: adminUserId,
        actionType: "UPDATE",
        entityType: "PermissionMatrix",
        entityId: tenantId,
        changeData: {
          oldValue: { canView: false },
          newValue: { canView: true, resourceKey: "/settings/audit" },
        },
        createdBy: actor,
      },
      {
        tenantId,
        branchId,
        userId: adminUserId,
        actionType: "UPDATE",
        entityType: "Role",
        entityId: tenantId,
        changeData: {
          oldValue: { roleName: "Reception" },
          newValue: { roleName: "Reception", isActive: true },
        },
        createdBy: actor,
      },
      {
        tenantId,
        branchId,
        userId: adminUserId,
        actionType: "UPDATE",
        entityType: "Branch",
        entityId: branchId,
        changeData: {
          oldValue: { phone: "+880 17 0000 0001" },
          newValue: { phone: "+880 17 0000 0099" },
        },
        createdBy: actor,
      },
    ],
  });

  console.log("Tenant audit sample rows seeded");
}
