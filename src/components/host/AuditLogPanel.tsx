"use client";

import { useMemo, useState } from "react";
import { Badge, Card, CardBody, Input, Select } from "@/components/ui";
import type { AuditLogRow } from "@/lib/saas/types";

export function AuditLogPanel({
  logs,
  tenantCodes,
}: {
  logs: AuditLogRow[];
  tenantCodes: string[];
}) {
  const [search, setSearch] = useState("");
  const [tenantFilter, setTenantFilter] = useState("All");

  const filtered = useMemo(
    () =>
      logs.filter((entry) => {
        const matchesTenant =
          tenantFilter === "All" || entry.tenantCode === tenantFilter;
        const matchesSearch =
          entry.user.toLowerCase().includes(search.toLowerCase()) ||
          entry.entity.toLowerCase().includes(search.toLowerCase()) ||
          entry.action.toLowerCase().includes(search.toLowerCase());
        return matchesTenant && matchesSearch;
      }),
    [search, tenantFilter, logs],
  );

  const tenants = ["All", ...tenantCodes, "—"];

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Search audit log"
            placeholder="User, action, entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            label="Tenant filter"
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
          >
            {tenants.map((t) => (
              <option key={t} value={t}>
                {t === "All" ? "All tenants" : t === "—" ? "Host platform" : t}
              </option>
            ))}
          </Select>
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Old value</th>
                <th className="px-4 py-3">New value</th>
                <th className="px-4 py-3">IP address</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{entry.time}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{entry.tenantCode}</p>
                      <p className="text-xs text-slate-500">{entry.tenantName}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{entry.branchCode}</td>
                    <td className="px-4 py-3 text-slate-600">{entry.user}</td>
                    <td className="px-4 py-3">
                      <Badge variant={entry.action === "LOGIN" ? "info" : entry.action === "INSERT" ? "success" : "warning"}>
                        {entry.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{entry.entity}</td>
                    <td className="px-4 py-3 max-w-[140px] truncate text-slate-500" title={entry.oldValue}>{entry.oldValue}</td>
                    <td className="px-4 py-3 max-w-[140px] truncate text-slate-700" title={entry.newValue}>{entry.newValue}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{entry.ipAddress}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
