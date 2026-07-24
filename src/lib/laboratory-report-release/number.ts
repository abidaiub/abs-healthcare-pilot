import type { Prisma } from "@/generated/prisma/client";
import { formatReportNumber } from "@/lib/laboratory-report-release/constants";

export async function allocateReportNumber(
  tx: Prisma.TransactionClient,
  tenantId: string,
): Promise<string> {
  const counter = await tx.tenantLabReportCounter.upsert({
    where: { tenantId },
    create: { tenantId, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return formatReportNumber(counter.lastNumber);
}
