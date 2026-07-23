import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  entityTypesForModule,
  formatChangeSummary,
  resolveModuleCode,
} from "@/lib/audit/format";
import type {
  AuditFilterOptions,
  AuditLogEntry,
  AuditLogFilters,
  AuditLogListResult,
} from "@/lib/audit/types";
import { formatDateTime } from "@/lib/saas/format";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function buildTenantAuditWhere(filters: AuditLogFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {
    tenantId: filters.tenantId,
  };

  if (filters.branchId) {
    where.branchId = filters.branchId;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.actionType) {
    where.actionType = filters.actionType;
  }

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.moduleCode) {
    where.entityType = { in: entityTypesForModule(filters.moduleCode) };
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      where.createdAt.gte = new Date(`${filters.dateFrom}T00:00:00.000Z`);
    }
    if (filters.dateTo) {
      where.createdAt.lte = new Date(`${filters.dateTo}T23:59:59.999Z`);
    }
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { entityType: { contains: q, mode: "insensitive" } },
      { entityId: { contains: q, mode: "insensitive" } },
      { createdBy: { contains: q, mode: "insensitive" } },
      { user: { username: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}

function mapAuditLogEntry(log: {
  id: string;
  tenantId: string | null;
  branchId: string | null;
  userId: string | null;
  actionType: AuditLogEntry["action"];
  entityType: string;
  entityId: string | null;
  changeData: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  createdBy: string | null;
  branch: { code: string; name: string } | null;
  user: { username: string } | null;
}): AuditLogEntry {
  const change =
    log.changeData && typeof log.changeData === "object"
      ? (log.changeData as Record<string, unknown>)
      : null;
  const summary = formatChangeSummary(change);

  return {
    id: log.id,
    time: formatDateTime(log.createdAt),
    createdAt: log.createdAt.toISOString(),
    branchId: log.branchId,
    branchCode: log.branch?.code ?? "—",
    branchName: log.branch?.name ?? "Tenant-wide",
    userId: log.userId,
    user: log.user?.username ?? log.createdBy ?? "System",
    action: log.actionType,
    entityType: log.entityType,
    entityId: log.entityId,
    moduleCode: resolveModuleCode(log.entityType),
    oldValue: summary.oldValue,
    newValue: summary.newValue,
    ipAddress: log.ipAddress ?? "—",
    userAgent: log.userAgent ?? "—",
    changeData: change,
  };
}

export async function listTenantAuditLogs(
  filters: AuditLogFilters,
): Promise<AuditLogListResult> {
  const pageSize = Math.min(
    Math.max(filters.pageSize ?? DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE,
  );
  const page = Math.max(filters.page ?? 1, 1);
  const where = buildTenantAuditWhere(filters);

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        branch: { select: { code: true, name: true } },
        user: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    rows: logs.map(mapAuditLogEntry),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function getTenantAuditLogById(
  tenantId: string,
  auditLogId: string,
): Promise<AuditLogEntry | null> {
  const log = await prisma.auditLog.findFirst({
    where: { id: auditLogId, tenantId },
    include: {
      branch: { select: { code: true, name: true } },
      user: { select: { username: true } },
    },
  });

  return log ? mapAuditLogEntry(log) : null;
}

export async function getTenantAuditFilterOptions(
  tenantId: string,
): Promise<AuditFilterOptions> {
  const [branches, users, entityTypes, actionTypes] = await Promise.all([
    prisma.branch.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { tenantId, isHostAdmin: false, isActive: true },
      select: { id: true, username: true },
      orderBy: { username: "asc" },
    }),
    prisma.auditLog.findMany({
      where: { tenantId },
      distinct: ["entityType"],
      select: { entityType: true },
      orderBy: { entityType: "asc" },
    }),
    prisma.auditLog.findMany({
      where: { tenantId },
      distinct: ["actionType"],
      select: { actionType: true },
      orderBy: { actionType: "asc" },
    }),
  ]);

  const moduleCodes = [
    ...new Set(entityTypes.map((row) => resolveModuleCode(row.entityType))),
  ].sort();

  return {
    branches,
    users,
    entityTypes: entityTypes.map((row) => row.entityType),
    actionTypes: actionTypes.map((row) => row.actionType),
    moduleCodes,
  };
}

export function auditLogsToCsv(rows: AuditLogEntry[]): string {
  const header = [
    "Time",
    "Branch",
    "User",
    "Action",
    "Module",
    "Entity Type",
    "Entity ID",
    "Old Value",
    "New Value",
    "IP Address",
  ];

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const lines = rows.map((row) =>
    [
      row.time,
      row.branchCode,
      row.user,
      row.action,
      row.moduleCode,
      row.entityType,
      row.entityId ?? "",
      row.oldValue,
      row.newValue,
      row.ipAddress,
    ]
      .map(escape)
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}
