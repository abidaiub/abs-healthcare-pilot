import type { Prisma } from "@/generated/prisma/client";
import { formatPrescriptionNumber } from "@/lib/prescription/constants";

export async function allocatePrescriptionNumber(
  tx: Prisma.TransactionClient,
  tenantId: string,
): Promise<string> {
  const counter = await tx.tenantPrescriptionCounter.upsert({
    where: { tenantId },
    create: { tenantId, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return formatPrescriptionNumber(counter.lastNumber);
}

export function isValidPrescriptionNumber(value: string): boolean {
  return /^RX-\d{6}$/.test(value);
}
