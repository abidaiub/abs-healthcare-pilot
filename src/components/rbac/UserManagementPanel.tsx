"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toggleTenantUserStatusAction } from "@/app/actions/tenant-users";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import type { TenantUserRow } from "@/lib/rbac/types";

function statusVariant(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "LOCKED") return "danger" as const;
  if (status === "INACTIVE" || status === "ARCHIVED") return "warning" as const;
  return "default" as const;
}

export function UserManagementPanel({ users }: { users: TenantUserRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      users.filter((user) => {
        const matchesSearch =
          user.username.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase()) ||
          (user.primaryRoleName ?? "").toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === "All" || user.userStatus === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [search, statusFilter, users],
  );

  function handleToggle(user: TenantUserRow, action: "activate" | "deactivate" | "unlock") {
    startTransition(async () => {
      const result = await toggleTenantUserStatusAction({ userId: user.id, action });
      setMessage(result.ok ? "User status updated." : result.error);
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
              label="Search users"
              placeholder="Username, email, or role..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="LOCKED">Locked</option>
            <option value="SUSPENDED">Suspended</option>
          </Select>
          <Link href="/settings/users/new">
            <Button>Create User</Button>
          </Link>
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Primary role</th>
                <th className="px-4 py-3">Primary branch</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-teal-50/30">
                  <td className="px-4 py-3 font-medium text-slate-900">{user.username}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">{user.primaryRoleName ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{user.primaryBranchName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(user.userStatus)}>{user.userStatus}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/settings/users/${user.id}`}>
                        <Button variant="secondary">Edit</Button>
                      </Link>
                      {user.userStatus === "LOCKED" ? (
                        <Button
                          variant="ghost"
                          disabled={pending}
                          onClick={() => handleToggle(user, "unlock")}
                        >
                          Unlock
                        </Button>
                      ) : user.isActive ? (
                        <Button
                          variant="ghost"
                          disabled={pending}
                          onClick={() => handleToggle(user, "deactivate")}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          disabled={pending}
                          onClick={() => handleToggle(user, "activate")}
                        >
                          Activate
                        </Button>
                      )}
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
