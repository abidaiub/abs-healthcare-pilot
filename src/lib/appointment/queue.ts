import type { Prisma } from "@/generated/prisma/client";
import { startOfDay } from "@/lib/appointment/constants";

export async function allocateQueueToken(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    branchId: string;
    doctorId: string;
    queueDate: Date;
  },
): Promise<number> {
  const queueDate = startOfDay(input.queueDate);

  const existing = await tx.branchDoctorQueueCounter.findUnique({
    where: {
      tenantId_branchId_doctorId_queueDate: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        doctorId: input.doctorId,
        queueDate,
      },
    },
  });

  if (existing) {
    const updated = await tx.branchDoctorQueueCounter.update({
      where: { id: existing.id },
      data: { lastToken: { increment: 1 } },
    });
    return updated.lastToken;
  }

  const created = await tx.branchDoctorQueueCounter.create({
    data: {
      tenantId: input.tenantId,
      branchId: input.branchId,
      doctorId: input.doctorId,
      queueDate,
      lastToken: 1,
    },
  });

  return created.lastToken;
}

export async function requeueToEnd(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    branchId: string;
    doctorId: string;
    queueDate: Date;
  },
): Promise<number> {
  return allocateQueueToken(tx, input);
}
