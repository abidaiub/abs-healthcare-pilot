import type { Prisma } from "@/generated/prisma/client";
import { formatMedicationCode } from "@/lib/medication/constants";

export async function allocateMedicationCode(
  tx: Prisma.TransactionClient,
  tenantId: string,
): Promise<string> {
  const counter = await tx.tenantMedicationCounter.upsert({
    where: { tenantId },
    create: { tenantId, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return formatMedicationCode(counter.lastNumber);
}
