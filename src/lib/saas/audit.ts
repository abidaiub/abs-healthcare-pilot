import type { AuditActionType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export type AuditWriteInput = {
  tenantId?: string | null;
  branchId?: string | null;
  userId?: string | null;
  actionType: AuditActionType;
  entityType: string;
  entityId?: string | null;
  changeData?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdBy?: string | null;
};

export async function writeAuditLog(input: AuditWriteInput) {
  return prisma.auditLog.create({
    data: {
      tenantId: input.tenantId ?? null,
      branchId: input.branchId ?? null,
      userId: input.userId ?? null,
      actionType: input.actionType,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      changeData: input.changeData ?? undefined,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      createdBy: input.createdBy ?? null,
    },
  });
}

export async function writeStatusHistory(input: {
  tenantId: string;
  branchId?: string | null;
  entityType: string;
  entityId: string;
  oldStatus: string;
  newStatus: string;
  remarks?: string | null;
  changedBy: string;
}) {
  return prisma.statusHistory.create({
    data: {
      tenantId: input.tenantId,
      branchId: input.branchId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      oldStatus: input.oldStatus,
      newStatus: input.newStatus,
      remarks: input.remarks ?? null,
      changedBy: input.changedBy,
      changedAt: new Date(),
    },
  });
}
