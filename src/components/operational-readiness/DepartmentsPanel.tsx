"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createDepartmentAction,
  ensureSuggestedDepartmentsAction,
  setDepartmentActiveAction,
} from "@/app/actions/tenant-operational-readiness";
import { Badge, Button, Card, CardBody, CardHeader, Input } from "@/components/ui";

type Dept = {
  id: string;
  deptCode: string;
  name: string;
  deptType: string;
  isActive: boolean;
  tenantId: string | null;
};

export function DepartmentsPanel({
  departments,
  canCreate,
  canEdit,
}: {
  departments: Dept[];
  canCreate: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    deptCode: "",
    name: "",
    deptType: "Clinical",
  });

  function create() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await createDepartmentAction(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setForm({ deptCode: "", name: "", deptType: "Clinical" });
      setMessage("Department created.");
      router.refresh();
    });
  }

  function ensureSuggested() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await ensureSuggestedDepartmentsAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(`Ensured suggested departments (created ${result.data?.created ?? 0}).`);
      router.refresh();
    });
  }

  function toggle(id: string, isActive: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setDepartmentActiveAction(id, isActive);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Department Management"
          description="Create and enable operating departments. Host-shared departments are visible but only tenant-owned rows can be toggled."
          action={
            <Button
              type="button"
              variant="secondary"
              disabled={!canCreate || pending}
              onClick={ensureSuggested}
            >
              Add missing suggested departments
            </Button>
          }
        />
        <CardBody className="grid gap-4 md:grid-cols-3">
          <Input
            label="Code"
            value={form.deptCode}
            disabled={!canCreate || pending}
            onChange={(e) => setForm((f) => ({ ...f, deptCode: e.target.value }))}
          />
          <Input
            label="Name"
            value={form.name}
            disabled={!canCreate || pending}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Type"
            value={form.deptType}
            disabled={!canCreate || pending}
            onChange={(e) => setForm((f) => ({ ...f, deptType: e.target.value }))}
          />
        </CardBody>
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <div className="text-sm">
            {error && <p className="text-rose-600">{error}</p>}
            {message && <p className="text-emerald-700">{message}</p>}
          </div>
          <Button type="button" disabled={!canCreate || pending} onClick={create}>
            Create department
          </Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">{d.deptCode}</td>
                  <td className="px-4 py-3">{d.name}</td>
                  <td className="px-4 py-3 text-slate-600">{d.deptType}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {d.tenantId ? "Tenant" : "Host/shared"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={d.isActive ? "success" : "default"}>
                      {d.isActive ? "Enabled" : "Disabled"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {d.tenantId ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={!canEdit || pending}
                        onClick={() => toggle(d.id, !d.isActive)}
                      >
                        {d.isActive ? "Disable" : "Enable"}
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400">Read-only</span>
                    )}
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
