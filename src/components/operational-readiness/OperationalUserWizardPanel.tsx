"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createOperationalUserAction } from "@/app/actions/tenant-operational-readiness";
import { Badge, Button, Card, CardBody, CardHeader, Input } from "@/components/ui";

type RoleOption = { id: string; roleCode: string; roleName: string };
type BranchOption = { id: string; code: string; name: string };
type DeptOption = { id: string; name: string };
type UserRow = {
  id: string;
  username: string;
  email: string;
  userStatus: string;
  isActive: boolean;
  roleName: string;
  branchCode: string;
  departmentName: string;
};

export function OperationalUserWizardPanel({
  roles,
  branches,
  departments,
  users,
  canCreate,
}: {
  roles: RoleOption[];
  branches: BranchOption[];
  departments: DeptOption[];
  users: UserRow[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "DoctorsPoint@2026!",
    roleId: roles[0]?.id ?? "",
    branchId: branches[0]?.id ?? "",
    departmentId: "",
  });

  function create() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await createOperationalUserAction({
        ...form,
        departmentId: form.departmentId || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(`User created: ${form.username}`);
      setForm((f) => ({
        ...f,
        username: "",
        email: "",
        phone: "",
      }));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Operational User Wizard"
          description="Create users with role, branch, department, and activation. Password reset is forced on first login."
        />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <Input
            label="Username"
            value={form.username}
            disabled={!canCreate || pending}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          />
          <Input
            label="Email"
            value={form.email}
            disabled={!canCreate || pending}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label="Phone"
            value={form.phone}
            disabled={!canCreate || pending}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <Input
            label="Temporary password"
            value={form.password}
            disabled={!canCreate || pending}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Role</span>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.roleId}
              disabled={!canCreate || pending}
              onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roleName} ({r.roleCode})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Branch</span>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.branchId}
              disabled={!canCreate || pending}
              onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">Department</span>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.departmentId}
              disabled={!canCreate || pending}
              onChange={(e) =>
                setForm((f) => ({ ...f, departmentId: e.target.value }))
              }
            >
              <option value="">— Optional —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        </CardBody>
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <div className="text-sm">
            {error && <p className="text-rose-600">{error}</p>}
            {message && <p className="text-emerald-700">{message}</p>}
          </div>
          <Button type="button" disabled={!canCreate || pending} onClick={create}>
            Create operational user
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Current users" description="Existing operational accounts" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3">{u.roleName}</td>
                  <td className="px-4 py-3">{u.branchCode}</td>
                  <td className="px-4 py-3">{u.departmentName}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? "success" : "default"}>
                      {u.userStatus}
                    </Badge>
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
