"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  exportTenantAuditLogsAction,
  logAuditDetailViewAction,
} from "@/app/actions/tenant-audit";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import {
  flattenChangeRows,
  MODULE_LABELS,
} from "@/lib/audit/format";
import type {
  AuditFilterOptions,
  AuditLogEntry,
  AuditLogListResult,
} from "@/lib/audit/types";

type Props = {
  result: AuditLogListResult;
  filterOptions: AuditFilterOptions;
  initialFilters: Record<string, string>;
};

function actionVariant(action: string) {
  if (action === "LOGIN" || action === "VIEW") return "info" as const;
  if (action === "INSERT") return "success" as const;
  if (action === "DELETE") return "danger" as const;
  return "warning" as const;
}

export function TenantAuditCenterPanel({
  result,
  filterOptions,
  initialFilters,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const detailRows = useMemo(
    () => flattenChangeRows(selected?.changeData ?? null),
    [selected],
  );

  function updateFilters(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value || value === "All") params.delete(key);
      else params.set(key, value);
    });
    params.delete("page");
    router.push(`/settings/audit?${params.toString()}`);
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/settings/audit?${params.toString()}`);
  }

  function openDetail(entry: AuditLogEntry) {
    setSelected(entry);
    startTransition(async () => {
      await logAuditDetailViewAction(entry.id);
    });
  }

  function handleExport() {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(initialFilters).forEach(([key, value]) => {
        if (value) formData.set(key, value);
      });

      const exportResult = await exportTenantAuditLogsAction(formData);
      if (!exportResult.ok) {
        setMessage(exportResult.error);
        return;
      }
      if (!exportResult.csv) {
        setMessage("Export failed.");
        return;
      }

      const blob = new Blob([exportResult.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = exportResult.filename ?? "audit-export.csv";
      link.click();
      URL.revokeObjectURL(url);
      setMessage(`Exported ${result.total} matching record(s).`);
    });
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      <Card>
        <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Input
            label="Search"
            placeholder="User, entity, action..."
            defaultValue={initialFilters.search ?? ""}
            onBlur={(event) => updateFilters({ search: event.target.value })}
          />
          <Input
            label="Date from"
            type="date"
            defaultValue={initialFilters.dateFrom ?? ""}
            onChange={(event) => updateFilters({ dateFrom: event.target.value })}
          />
          <Input
            label="Date to"
            type="date"
            defaultValue={initialFilters.dateTo ?? ""}
            onChange={(event) => updateFilters({ dateTo: event.target.value })}
          />
          <Select
            label="Branch"
            defaultValue={initialFilters.branchId ?? "All"}
            onChange={(event) => updateFilters({ branchId: event.target.value })}
          >
            <option value="All">All branches</option>
            {filterOptions.branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name} ({branch.code})
              </option>
            ))}
          </Select>
          <Select
            label="User"
            defaultValue={initialFilters.userId ?? "All"}
            onChange={(event) => updateFilters({ userId: event.target.value })}
          >
            <option value="All">All users</option>
            {filterOptions.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </Select>
          <Select
            label="Action"
            defaultValue={initialFilters.actionType ?? "All"}
            onChange={(event) => updateFilters({ actionType: event.target.value })}
          >
            <option value="All">All actions</option>
            {filterOptions.actionTypes.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </Select>
          <Select
            label="Entity"
            defaultValue={initialFilters.entityType ?? "All"}
            onChange={(event) => updateFilters({ entityType: event.target.value })}
          >
            <option value="All">All entities</option>
            {filterOptions.entityTypes.map((entityType) => (
              <option key={entityType} value={entityType}>
                {entityType}
              </option>
            ))}
          </Select>
          <Select
            label="Module"
            defaultValue={initialFilters.moduleCode ?? "All"}
            onChange={(event) => updateFilters({ moduleCode: event.target.value })}
          >
            <option value="All">All modules</option>
            {filterOptions.moduleCodes.map((moduleCode) => (
              <option key={moduleCode} value={moduleCode}>
                {MODULE_LABELS[moduleCode] ?? moduleCode}
              </option>
            ))}
          </Select>
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Showing {result.rows.length} of {result.total} record(s)
        </p>
        <Button variant="secondary" disabled={pending} onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Summary</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    No audit records match the current filters.
                  </td>
                </tr>
              ) : (
                result.rows.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100 hover:bg-teal-50/30">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{entry.time}</td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-slate-700">{entry.branchCode}</p>
                      <p className="text-xs text-slate-500">{entry.branchName}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{entry.user}</td>
                    <td className="px-4 py-3">
                      <Badge variant={actionVariant(entry.action)}>{entry.action}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {MODULE_LABELS[entry.moduleCode] ?? entry.moduleCode}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{entry.entityType}</p>
                      <p className="text-xs text-slate-500">{entry.entityId ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[180px] truncate text-slate-600" title={entry.newValue}>
                      {entry.newValue}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{entry.ipAddress}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" type="button" onClick={() => openDetail(entry)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {result.totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            disabled={result.page <= 1 || pending}
            onClick={() => goToPage(result.page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-600">
            Page {result.page} of {result.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={result.page >= result.totalPages || pending}
            onClick={() => goToPage(result.page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {selected && (
        <Card>
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Audit detail</p>
                <p className="text-sm text-slate-500">
                  {selected.entityType} · {selected.entityId ?? "—"} · {selected.time}
                </p>
              </div>
              <Button variant="ghost" type="button" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs uppercase text-slate-500">User</p>
                <p className="text-sm text-slate-900">{selected.user}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Action</p>
                <p className="text-sm text-slate-900">{selected.action}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Branch</p>
                <p className="text-sm text-slate-900">{selected.branchName}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">IP / Agent</p>
                <p className="text-sm text-slate-900">{selected.ipAddress}</p>
                <p className="text-xs text-slate-500">{selected.userAgent}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Field</th>
                    <th className="px-4 py-3">Old value</th>
                    <th className="px-4 py-3">New value</th>
                  </tr>
                </thead>
                <tbody>
                  {detailRows.map((row) => (
                    <tr key={row.field} className="border-b border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-900">{row.field}</td>
                      <td className="px-4 py-3 text-slate-600">{row.oldValue}</td>
                      <td className="px-4 py-3 text-slate-700">{row.newValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
