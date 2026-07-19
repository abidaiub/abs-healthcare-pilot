"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createBranchAction,
  updateBranchAction,
} from "@/app/actions/host-tenant";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import type { TenantBranchRow, TenantDetailRecord } from "@/lib/saas/types";

export function BranchManagementPanel({ tenant }: { tenant: TenantDetailRecord }) {
  const router = useRouter();
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const editingBranch = tenant.branches.find((b) => b.id === editingBranchId);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = editingBranchId
        ? await updateBranchAction(tenant.id, editingBranchId, formData)
        : await createBranchAction(tenant.id, formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setEditingBranchId(null);
      setError(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {tenant.name} ({tenant.code}) — {tenant.branches.length} branches
        </p>
        <Link href={`/host/tenants/${tenant.id}`}>
          <Button type="button" variant="secondary">Back to tenant</Button>
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Branch code</th>
                <th className="px-4 py-3">Branch name</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenant.branches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No branches yet. Create the first branch below.
                  </td>
                </tr>
              ) : (
                tenant.branches.map((branch) => (
                  <BranchRow
                    key={branch.id}
                    branch={branch}
                    onEdit={() => setEditingBranchId(branch.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <p className="text-sm font-semibold text-slate-900">
            {editingBranch ? `Edit branch ${editingBranch.code}` : "Add branch"}
          </p>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                label="Branch code *"
                name="code"
                defaultValue={editingBranch?.code ?? ""}
                placeholder="BR-DHK-01"
                required
              />
              <Input
                label="Branch name *"
                name="name"
                defaultValue={editingBranch?.name ?? ""}
                required
              />
              <Input label="Address" name="address" defaultValue={editingBranch?.address ?? ""} />
              <Input label="City" name="city" defaultValue={editingBranch?.city ?? ""} />
              <Input label="District" name="district" defaultValue={editingBranch?.district ?? ""} />
              <Input label="Phone" name="phone" defaultValue={editingBranch?.phone ?? ""} />
              <Input label="Email" name="email" type="email" defaultValue={editingBranch?.email ?? ""} />
              <Select
                label="Status"
                name="status"
                defaultValue={
                  editingBranch?.status === "Inactive"
                    ? "INACTIVE"
                    : editingBranch?.status === "Archived"
                      ? "ARCHIVED"
                      : "ACTIVE"
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              {editingBranch && (
                <Button type="button" variant="secondary" onClick={() => setEditingBranchId(null)}>
                  Cancel edit
                </Button>
              )}
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : editingBranch ? "Update branch" : "Create branch"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

function BranchRow({
  branch,
  onEdit,
}: {
  branch: TenantBranchRow;
  onEdit: () => void;
}) {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-4 py-3 font-mono font-medium text-teal-700">{branch.code}</td>
      <td className="px-4 py-3 font-medium text-slate-900">{branch.name}</td>
      <td className="px-4 py-3 text-slate-600">{branch.city ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">{branch.phone ?? "—"}</td>
      <td className="px-4 py-3">
        <Badge variant={branch.status === "Active" ? "success" : "default"}>
          {branch.status}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Button type="button" variant="ghost" className="px-2 py-1 text-xs" onClick={onEdit}>
          Edit
        </Button>
      </td>
    </tr>
  );
}
