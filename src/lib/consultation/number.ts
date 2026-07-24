import type { Prisma } from "@/generated/prisma/client";
import { formatEncounterNumber } from "@/lib/consultation/constants";

export async function allocateEncounterNumber(
  tx: Prisma.TransactionClient,
  tenantId: string,
): Promise<string> {
  const counter = await tx.tenantEncounterCounter.upsert({
    where: { tenantId },
    create: { tenantId, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });

  if (counter.lastNumber < 1) {
    throw new Error("ENCOUNTER_NUMBER_DUPLICATE");
  }

  return formatEncounterNumber(counter.lastNumber);
}

export function isValidEncounterNumber(value: string): boolean {
  return /^EN-\d{6}$/.test(value);
}
