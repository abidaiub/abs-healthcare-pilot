"use server";

import type { AuditActionType } from "@/generated/prisma/client";
import {
  auditLogsToCsv,
  getTenantAuditLogById,
  listTenantAuditLogs,
} from "@/lib/audit/queries";
import type { AuditLogFilters } from "@/lib/audit/types";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { writeAuditLog } from "@/lib/saas/audit";

export type TenantAuditActionResult =
  | { ok: true; csv?: string; filename?: string }
  | { ok: false; error: string };

function parseFilters(
  tenantId: string,
  formData: FormData,
): AuditLogFilters {
  const actionType = String(formData.get("actionType") ?? "").trim();

  return {
    tenantId,
    branchId: String(formData.get("branchId") ?? "").trim() || undefined,
    userId: String(formData.get("userId") ?? "").trim() || undefined,
    actionType: actionType ? (actionType as AuditActionType) : undefined,
    entityType: String(formData.get("entityType") ?? "").trim() || undefined,
    moduleCode: String(formData.get("moduleCode") ?? "").trim() || undefined,
    dateFrom: String(formData.get("dateFrom") ?? "").trim() || undefined,
    dateTo: String(formData.get("dateTo") ?? "").trim() || undefined,
    search: String(formData.get("search") ?? "").trim() || undefined,
    page: Number(formData.get("page") ?? "1") || 1,
    pageSize: Number(formData.get("pageSize") ?? "25") || 25,
  };
}

export async function exportTenantAuditLogsAction(
  formData: FormData,
): Promise<TenantAuditActionResult> {
  const session = await requireTenantPermission("/settings/audit", "canPrint");
  const filters = parseFilters(session.tenantId, formData);
  filters.page = 1;
  filters.pageSize = 100;

  const allRows = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await listTenantAuditLogs({ ...filters, page });
    allRows.push(...result.rows);
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages && page <= 20);

  const csv = auditLogsToCsv(allRows);
  const filename = `audit-export-${session.tenantCode}-${new Date().toISOString().slice(0, 10)}.csv`;

  await writeAuditLog({
    tenantId: session.tenantId,
    branchId: session.branchId,
    userId: session.userId,
    actionType: "PRINT",
    entityType: "AuditLog",
    entityId: null,
    changeData: {
      newValue: `Exported ${allRows.length} audit rows`,
      filters: {
        branchId: filters.branchId,
        userId: filters.userId,
        actionType: filters.actionType,
        entityType: filters.entityType,
        moduleCode: filters.moduleCode,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        search: filters.search,
      },
    },
    createdBy: session.user.name,
  });

  return { ok: true, csv, filename };
}

export async function logAuditDetailViewAction(
  auditLogId: string,
): Promise<TenantAuditActionResult> {
  const session = await requireTenantPermission("/settings/audit", "canView");
  const entry = await getTenantAuditLogById(session.tenantId, auditLogId);

  if (!entry) {
    return { ok: false, error: "Audit record not found." };
  }

  await writeAuditLog({
    tenantId: session.tenantId,
    branchId: session.branchId,
    userId: session.userId,
    actionType: "VIEW",
    entityType: "AuditLog",
    entityId: auditLogId,
    changeData: {
      newValue: `Viewed audit detail for ${entry.entityType}/${entry.entityId ?? "—"}`,
    },
    createdBy: session.user.name,
  });

  return { ok: true };
}
