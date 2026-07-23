import type { Prisma } from "@/generated/prisma/client";
import { formatAppointmentNumber } from "@/lib/appointment/constants";

export async function allocateAppointmentNumber(
  tx: Prisma.TransactionClient,
  tenantId: string,
): Promise<string> {
  const counter = await tx.tenantAppointmentCounter.upsert({
    where: { tenantId },
    create: { tenantId, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });

  if (counter.lastNumber < 1) {
    throw new Error("APPOINTMENT_NUMBER_DUPLICATE");
  }

  return formatAppointmentNumber(counter.lastNumber);
}

export function isValidAppointmentNumber(value: string): boolean {
  return /^AP-\d{6}$/.test(value);
}
