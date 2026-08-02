import type { Prisma } from "@/generated/prisma/client";
import { formatInvoiceNumber, formatReceiptNumber } from "@/lib/billing/constants";

export async function allocateInvoiceNumber(
  tx: Prisma.TransactionClient,
  tenantId: string,
): Promise<string> {
  const counter = await tx.tenantInvoiceCounter.upsert({
    where: { tenantId },
    create: { tenantId, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return formatInvoiceNumber(counter.lastNumber);
}

export async function allocateReceiptNumber(
  tx: Prisma.TransactionClient,
  tenantId: string,
): Promise<string> {
  const counter = await tx.tenantReceiptCounter.upsert({
    where: { tenantId },
    create: { tenantId, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return formatReceiptNumber(counter.lastNumber);
}
