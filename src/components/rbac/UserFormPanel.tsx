"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createTenantUserAction,
  resetTenantUserPasswordAction,
  updateTenantUserAction,
} from "@/app/actions/tenant-users";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import type { BranchOption } from "@/lib/diagnostic/types";
import type { TenantRoleRow, TenantUserDetail } from "@/lib/rbac/types";

type Props = {
  mode: "create" | "edit";
  roles: TenantRoleRow[];
  branches: BranchOption[];
  user?: TenantUserDetail;
};

export function UserFormPanel({ mode, roles, branches, user }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createTenantUserAction(formData)
          : user
            ? await updateTenantUserAction(user.id, formData)
            : { ok: false as const, error: "User not found." };

      if (!result.ok) {
        setMessage(result.error);
        return;
      }

      router.push(`/settings/users/${result.userId}`);
      router.refresh();
    });
  }

  function handleResetPassword() {
    if (!user) return;
    const temporaryPassword = window.prompt("Enter temporary password:", "Tenant@2026!");
    if (!temporaryPassword) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("temporaryPassword", temporaryPassword);
      formData.set("forcePasswordChange", "true");
      const result = await resetTenantUserPasswordAction(user.id, formData);
      setMessage(result.ok ? "Password reset successfully." : result.error);
    });
  }

  return (
    <Card>
      <CardBody>
        {message && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {message}
          </div>
        )}

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <Input
            label="Username"
            name="username"
            defaultValue={user?.username}
            readOnly={mode === "edit"}
            required={mode === "create"}
            className={mode === "edit" ? "bg-slate-50 sm:col-span-2" : "sm:col-span-2"}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            defaultValue={user?.email}
            required
          />
          <Input label="Phone" name="phone" defaultValue={user?.phone ?? ""} />
          {mode === "create" && (
            <Input
              label="Initial password"
              name="password"
              type="password"
              defaultValue="Tenant@2026!"
              required
            />
          )}
          <Select
            label="Primary role"
            name="primaryRoleId"
            defaultValue={user?.primaryRoleId ?? roles[0]?.id ?? ""}
            required
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.roleName}
              </option>
            ))}
          </Select>
          <Select
            label="Primary branch"
            name="primaryBranchId"
            defaultValue={user?.primaryBranchId ?? branches[0]?.id ?? ""}
            required
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
          {mode === "edit" && (
            <Select
              label="Status"
              name="userStatus"
              defaultValue={user?.userStatus ?? "ACTIVE"}
              required
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LOCKED">Locked</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
            <input
              type="checkbox"
              name="forcePasswordChange"
              value="true"
              defaultChecked={user?.forcePasswordChange ?? true}
            />
            Force password change on next login
          </label>

          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : mode === "create" ? "Create User" : "Save Changes"}
            </Button>
            <Link href="/settings/users">
              <Button variant="secondary" type="button">
                Back to list
              </Button>
            </Link>
            {mode === "edit" && user && (
              <Button variant="ghost" type="button" disabled={pending} onClick={handleResetPassword}>
                Reset password
              </Button>
            )}
          </div>
        </form>

        {mode === "edit" && user && (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <Badge variant="info">{user.roleCount} role assignment(s)</Badge>
            {user.forcePasswordChange && <Badge variant="warning">Force password change</Badge>}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
