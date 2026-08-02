"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  copyRolePermissionsAction,
  createTenantRoleAction,
  saveRolePermissionMatrixAction,
} from "@/app/actions/tenant-roles";
import { Button, Card, CardBody, Input } from "@/components/ui";
import {
  getResourceGroups,
  PERMISSION_ACTIONS,
} from "@/lib/rbac/permission-catalog";
import type { PermissionMatrixRow, TenantRoleRow } from "@/lib/rbac/types";

type RoleFormProps = {
  mode: "create";
};

export function RoleFormPanel(_props: RoleFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createTenantRoleAction(formData);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      router.push(`/settings/roles/${result.roleId}/permissions`);
      router.refresh();
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
          <Input label="Role code" name="roleCode" placeholder="LAB_SUPERVISOR" required />
          <Input label="Role name" name="roleName" placeholder="Lab Supervisor" required />
          <Input
            label="Description"
            name="description"
            className="sm:col-span-2"
            placeholder="Describe responsibilities"
          />
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create Role"}
            </Button>
            <Link href="/settings/roles">
              <Button variant="secondary" type="button">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

type MatrixProps = {
  roleId: string;
  roleName: string;
  matrix: PermissionMatrixRow[];
  roles: TenantRoleRow[];
};

export function PermissionMatrixPanel({
  roleId,
  roleName,
  matrix,
  roles,
}: MatrixProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const groups = getResourceGroups();

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredMatrix = useMemo(() => {
    if (!normalizedQuery) return matrix;

    return matrix.filter((row) =>
      [row.label, row.resourceKey, row.group, row.permissionCode, row.moduleCode].some((field) =>
        field.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [matrix, normalizedQuery]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await saveRolePermissionMatrixAction(roleId, formData);
      setMessage(result.ok ? "Permission matrix saved." : result.error);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  function handleCopy(sourceRoleId: string) {
    startTransition(async () => {
      const result = await copyRolePermissionsAction({ roleId, sourceRoleId });
      if (result.ok) {
        setMessage("Permissions copied.");
        router.refresh();
      } else {
        setMessage(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">{roleName}</p>
            <p className="text-sm text-slate-500">
              Map view/create/edit/delete/approve/print permissions for tenant routes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {roles
              .filter((role) => role.id !== roleId)
              .slice(0, 3)
              .map((role) => (
                <Button
                  key={role.id}
                  variant="ghost"
                  type="button"
                  disabled={pending}
                  onClick={() => handleCopy(role.id)}
                >
                  Copy from {role.roleCode}
                </Button>
              ))}
            <Link href="/settings/roles">
              <Button variant="secondary" type="button">
                Back to roles
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      {message && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      <Card>
        <CardBody className="space-y-3">
          <Input
            label="Search modules"
            placeholder="Search by page name, route, or group (e.g. patient, /patients/new, Operations)"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {normalizedQuery && (
            <p className="text-sm text-slate-500">
              Showing {filteredMatrix.length} of {matrix.length} resources matching &quot;{searchQuery.trim()}&quot;
            </p>
          )}
        </CardBody>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {filteredMatrix.length === 0 ? (
          <Card>
            <CardBody className="py-10 text-center text-sm text-slate-500">
              No resources match your search. Try a route such as <span className="font-mono">/patients/new</span> or a label such as <span className="font-medium">Patient Registration</span>.
            </CardBody>
          </Card>
        ) : (
          groups.map((group) => {
            const rows = filteredMatrix.filter((row) => row.group === group);
            if (rows.length === 0) return null;

            const hiddenRows = matrix.filter((row) => row.group === group && !rows.includes(row));

            return (
              <Card key={group}>
                <CardBody className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{group}</p>
                    {normalizedQuery && hiddenRows.length > 0 && (
                      <p className="text-xs text-slate-500">
                        {hiddenRows.length} more hidden by search
                      </p>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th className="px-3 py-2">Resource</th>
                          {PERMISSION_ACTIONS.map((action) => (
                            <th key={action.key} className="px-3 py-2 text-center">
                              {action.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => {
                          const prefix = row.resourceKey.replace(/\//g, "_");
                          return (
                            <tr key={row.resourceKey} className="border-b border-slate-100">
                              <td className="px-3 py-2">
                                <div>
                                  <p className="font-medium text-slate-900">{row.label}</p>
                                  <p className="text-xs text-slate-500">{row.resourceKey}</p>
                                </div>
                              </td>
                              {PERMISSION_ACTIONS.map((action) => (
                                <td key={action.key} className="px-3 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    name={`${prefix}:${action.key}`}
                                    defaultChecked={row[action.key]}
                                  />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}

        {normalizedQuery
          ? matrix
              .filter((row) => !filteredMatrix.some((candidate) => candidate.resourceKey === row.resourceKey))
              .map((row) => {
                const prefix = row.resourceKey.replace(/\//g, "_");
                return (
                  <div key={`hidden-${row.resourceKey}`} className="hidden" aria-hidden="true">
                    {PERMISSION_ACTIONS.map((action) => (
                      <input
                        key={`${row.resourceKey}-${action.key}`}
                        type="checkbox"
                        name={`${prefix}:${action.key}`}
                        defaultChecked={row[action.key]}
                      />
                    ))}
                  </div>
                );
              })
          : null}

        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Permissions"}
          </Button>
        </div>
      </form>
    </div>
  );
}
