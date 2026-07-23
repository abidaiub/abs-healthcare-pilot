import type { Prisma } from "@/generated/prisma/client";
import { PATIENT_NUMBER_PREFIX } from "@/lib/patient/errors";
import { formatPatientNumber } from "@/lib/patient/normalize";

export async function allocatePatientNumber(
  tx: Prisma.TransactionClient,
  tenantId: string,
): Promise<string> {
  const counter = await tx.tenantPatientCounter.upsert({
    where: { tenantId },
    create: { tenantId, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });

  if (counter.lastNumber < 1) {
    throw new Error("PATIENT_NUMBER_DUPLICATE");
  }

  return formatPatientNumber(counter.lastNumber);
}

export function isValidPatientNumber(value: string): boolean {
  return new RegExp(`^${PATIENT_NUMBER_PREFIX}-\\d{6}$`).test(value);
}
