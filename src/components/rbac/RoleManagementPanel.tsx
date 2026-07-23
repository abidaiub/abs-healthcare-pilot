"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Button, Card, CardBody, Input } from "@/components/ui";
import type { TenantRoleRow } from "@/lib/rbac/types";

export function RoleManagementPanel({ roles }: { roles: TenantRoleRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      roles.filter(
        (role) =>
          role.roleName.toLowerCase().includes(search.toLowerCase()) ||
          role.roleCode.toLowerCase().includes(search.toLowerCase()),
      ),
    [roles, search],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <Input
              label="Search roles"
              placeholder="Role name or code..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Link href="/settings/roles/new">
            <Button>Create Role</Button>
          </Link>
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Role code</th>
                <th className="px-4 py-3">Role name</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Permissions</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((role) => (
                <tr key={role.id} className="border-b border-slate-100 hover:bg-teal-50/30">
                  <td className="px-4 py-3 font-mono text-teal-700">{role.roleCode}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{role.roleName}</p>
                      {role.description && (
                        <p className="text-xs text-slate-500">{role.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{role.userCount}</td>
                  <td className="px-4 py-3 text-slate-600">{role.permissionCount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={role.isActive ? "success" : "warning"}>
                      {role.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/settings/roles/${role.id}/permissions`}>
                        <Button variant="secondary">Permission matrix</Button>
                      </Link>
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
