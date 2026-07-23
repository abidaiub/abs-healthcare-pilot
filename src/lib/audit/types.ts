import type { AuditActionType } from "@/generated/prisma/client";

export type AuditLogEntry = {
  id: string;
  time: string;
  createdAt: string;
  branchId: string | null;
  branchCode: string;
  branchName: string;
  userId: string | null;
  user: string;
  action: AuditActionType;
  entityType: string;
  entityId: string | null;
  moduleCode: string;
  oldValue: string;
  newValue: string;
  ipAddress: string;
  userAgent: string;
  changeData: Record<string, unknown> | null;
};

export type AuditLogFilters = {
  tenantId: string;
  branchId?: string;
  userId?: string;
  actionType?: AuditActionType;
  entityType?: string;
  moduleCode?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type AuditLogListResult = {
  rows: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AuditFilterOptions = {
  branches: Array<{ id: string; code: string; name: string }>;
  users: Array<{ id: string; username: string }>;
  entityTypes: string[];
  actionTypes: AuditActionType[];
  moduleCodes: string[];
};
