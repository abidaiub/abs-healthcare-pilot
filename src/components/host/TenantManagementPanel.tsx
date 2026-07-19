"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { changeTenantStatusAction } from "@/app/actions/host-tenant";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import { formatBdt } from "@/lib/saas/format";
import { getStatusBadgeVariant } from "@/lib/saas/status-badge";
import type { TenantListRow } from "@/lib/saas/types";

export function TenantManagementPanel({
  tenants,
  initialFilter,
}: {
  tenants: TenantListRow[];
  initialFilter?: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    initialFilter === "due" ? "Due" : "All",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      tenants.filter((tenant) => {
        const matchesSearch =
          tenant.name.toLowerCase().includes(search.toLowerCase()) ||
          tenant.code.toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === "All" ||
          (statusFilter === "Due"
            ? tenant.dueAmount > 0
            : tenant.tenantStatus === statusFilter);
        return matchesSearch && matchesStatus;
      }),
    [search, statusFilter, tenants],
  );

  function handleStatusToggle(tenant: TenantListRow) {
    const action = tenant.tenantStatus === "Suspended" ? "reactivate" : "suspend";
    const reason =
      action === "suspend"
        ? window.prompt("Enter suspension reason:")
        : undefined;
    if (action === "suspend" && !reason?.trim()) return;

    startTransition(async () => {
      const result = await changeTenantStatusAction({
        tenantId: tenant.id,
        action,
        reason: reason ?? undefined,
      });
      setMessage(result.ok ? "Tenant status updated." : result.error);
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
        <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <Input
              label="Search tenant"
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            label="Status filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Trial">Trial</option>
            <option value="Suspended">Suspended</option>
            <option value="Due">Due amount</option>
          </Select>
          <Link href="/host/tenants/new">
            <Button type="button">Create tenant</Button>
          </Link>
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Tenant code</th>
                <th className="px-4 py-3">Tenant name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Subscription</th>
                <th className="px-4 py-3">Branches</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Due amount</th>
                <th className="px-4 py-3">Deployment</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                    No tenants found. Create a tenant or adjust filters.
                  </td>
                </tr>
              ) : (
                filtered.map((tenant) => (
                  <tr key={tenant.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-mono font-medium text-teal-700">
                      {tenant.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {tenant.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{tenant.tenantType}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(tenant.tenantStatus)}>
                        {tenant.tenantStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {tenant.subscriptionPackage}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {tenant.branchCount}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {tenant.userCount}
                    </td>
                    <td className="px-4 py-3">
                      {tenant.dueAmount > 0 ? (
                        <span className="font-medium text-amber-700">
                          {formatBdt(tenant.dueAmount)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          tenant.deploymentStatus === "Live" ? "success" : "warning"
                        }
                      >
                        {tenant.deploymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {tenant.primaryAdminName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Link href={`/host/tenants/${tenant.id}`}>
                          <Button type="button" variant="ghost" className="px-2 py-1 text-xs">
                            View
                          </Button>
                        </Link>
                        <Link href={`/host/tenants/${tenant.id}/edit`}>
                          <Button type="button" variant="ghost" className="px-2 py-1 text-xs">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          className="px-2 py-1 text-xs"
                          disabled={pending}
                          onClick={() => handleStatusToggle(tenant)}
                        >
                          {tenant.tenantStatus === "Suspended" ? "Activate" : "Suspend"}
                        </Button>
                      </div>
                    </td>
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
