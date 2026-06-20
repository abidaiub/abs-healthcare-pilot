"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import {
  SAAS_TENANTS,
  formatBdt,
  getStatusBadgeVariant,
} from "@/lib/saas-foundation-data";

export function TenantManagementPanel({
  initialFilter,
}: {
  initialFilter?: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    initialFilter === "due" ? "Due" : "All",
  );

  const filtered = useMemo(
    () =>
      SAAS_TENANTS.filter((tenant) => {
        const matchesSearch =
          tenant.name.toLowerCase().includes(search.toLowerCase()) ||
          tenant.code.toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === "All" ||
          (statusFilter === "Due"
            ? tenant.subscription.dueAmount > 0
            : tenant.tenantStatus === statusFilter);
        return matchesSearch && matchesStatus;
      }),
    [search, statusFilter],
  );

  return (
    <div className="space-y-6">
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
              {filtered.map((tenant) => (
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
                    {tenant.subscription.packageName}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">
                    {tenant.branches.length}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">
                    {tenant.userCount}
                  </td>
                  <td className="px-4 py-3">
                    {tenant.subscription.dueAmount > 0 ? (
                      <span className="font-medium text-amber-700">
                        {formatBdt(tenant.subscription.dueAmount)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={tenant.deployment.status === "Live" ? "success" : "warning"}>
                      {tenant.deployment.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {tenant.primaryAdmin.name}
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
                      <Button type="button" variant="ghost" className="px-2 py-1 text-xs">
                        {tenant.tenantStatus === "Suspended" ? "Activate" : "Suspend"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
