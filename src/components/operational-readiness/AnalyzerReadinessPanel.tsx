"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAnalyzerForReadinessAction } from "@/app/actions/tenant-operational-readiness";
import { Badge, Button, Card, CardBody, CardHeader, Input } from "@/components/ui";

type Dept = { id: string; name: string };
type Analyzer = {
  id: string;
  analyzerCode: string;
  machineName: string;
  isActive: boolean;
  departmentName: string;
  mappingCount: number;
  lisConnectionStatus: string;
  interfaceType: string;
};

export function AnalyzerReadinessPanel({
  analyzers,
  departments,
  canCreate,
}: {
  analyzers: Analyzer[];
  departments: Dept[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    analyzerCode: "",
    machineName: "",
    departmentId: departments[0]?.id ?? "",
    interfaceType: "SIMULATED",
    model: "",
    manufacturer: "",
    lisEndpoint: "sim://local-lis",
  });

  function create() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await createAnalyzerForReadinessAction(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Analyzer created.");
      setForm((f) => ({ ...f, analyzerCode: "", machineName: "" }));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Analyzer Readiness"
          description="Browser CRUD for analyzers, department assignment, status, and supported LIS endpoint."
        />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <Input
            label="Analyzer code"
            value={form.analyzerCode}
            disabled={!canCreate || pending}
            onChange={(e) => setForm((f) => ({ ...f, analyzerCode: e.target.value }))}
          />
          <Input
            label="Machine name"
            value={form.machineName}
            disabled={!canCreate || pending}
            onChange={(e) => setForm((f) => ({ ...f, machineName: e.target.value }))}
          />
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Department</span>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.departmentId}
              disabled={!canCreate || pending}
              onChange={(e) =>
                setForm((f) => ({ ...f, departmentId: e.target.value }))
              }
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Interface type"
            value={form.interfaceType}
            disabled={!canCreate || pending}
            onChange={(e) =>
              setForm((f) => ({ ...f, interfaceType: e.target.value }))
            }
          />
          <Input
            label="Model"
            value={form.model}
            disabled={!canCreate || pending}
            onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
          />
          <Input
            label="Manufacturer"
            value={form.manufacturer}
            disabled={!canCreate || pending}
            onChange={(e) =>
              setForm((f) => ({ ...f, manufacturer: e.target.value }))
            }
          />
          <Input
            label="LIS endpoint"
            value={form.lisEndpoint}
            disabled={!canCreate || pending}
            className="md:col-span-2"
            onChange={(e) => setForm((f) => ({ ...f, lisEndpoint: e.target.value }))}
          />
        </CardBody>
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <div className="text-sm">
            {error && <p className="text-rose-600">{error}</p>}
            {message && <p className="text-emerald-700">{message}</p>}
          </div>
          <Button type="button" disabled={!canCreate || pending} onClick={create}>
            Create analyzer
          </Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Analyzer</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Interface</th>
                <th className="px-4 py-3">Mappings</th>
                <th className="px-4 py-3">LIS status</th>
                <th className="px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {analyzers.map((a) => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">
                    {a.machineName}{" "}
                    <span className="text-slate-400">({a.analyzerCode})</span>
                  </td>
                  <td className="px-4 py-3">{a.departmentName}</td>
                  <td className="px-4 py-3">{a.interfaceType}</td>
                  <td className="px-4 py-3">{a.mappingCount}</td>
                  <td className="px-4 py-3">{a.lisConnectionStatus}</td>
                  <td className="px-4 py-3">
                    <Badge variant={a.isActive ? "success" : "default"}>
                      {a.isActive ? "Active" : "Inactive"}
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
