import type { Prisma } from "@/generated/prisma/client";
import { formatAccessionNumber, formatLabOrderNumber } from "@/lib/laboratory/constants";

export async function allocateLabOrderNumber(
  tx: Prisma.TransactionClient,
  tenantId: string,
): Promise<string> {
  const counter = await tx.tenantLabOrderCounter.upsert({
    where: { tenantId },
    create: { tenantId, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return formatLabOrderNumber(counter.lastNumber);
}

export async function allocateAccessionNumber(
  tx: Prisma.TransactionClient,
  tenantId: string,
): Promise<string> {
  const counter = await tx.tenantLabAccessionCounter.upsert({
    where: { tenantId },
    create: { tenantId, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return formatAccessionNumber(counter.lastNumber);
}
