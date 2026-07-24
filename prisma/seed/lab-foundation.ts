import type { PrismaClient } from "../../src/generated/prisma/client";
import { DEFAULT_REJECTION_REASONS } from "../../src/lib/laboratory/constants";

export async function seedLabFoundation(prisma: PrismaClient, tenantCode = "ABMG") {
  const tenant = await prisma.tenant.findUnique({ where: { tenantCode } });
  if (!tenant) return;

  await prisma.tenantLabOrderCounter.upsert({
    where: { tenantId: tenant.id },
    create: { tenantId: tenant.id, lastNumber: 0 },
    update: {},
  });

  await prisma.tenantLabAccessionCounter.upsert({
    where: { tenantId: tenant.id },
    create: { tenantId: tenant.id, lastNumber: 0 },
    update: {},
  });

  for (const reason of DEFAULT_REJECTION_REASONS) {
    await prisma.sampleRejectionReason.upsert({
      where: {
        tenantId_reasonCode: {
          tenantId: tenant.id,
          reasonCode: reason.reasonCode,
        },
      },
      create: {
        tenantId: tenant.id,
        reasonCode: reason.reasonCode,
        displayName: reason.displayName,
        isActive: true,
      },
      update: {
        displayName: reason.displayName,
        isActive: true,
      },
    });
  }

  console.log("Lab foundation seed complete for", tenantCode);
}
