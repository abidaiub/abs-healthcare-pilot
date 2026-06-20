"use client";

import { useMemo, useState } from "react";
import { SetupEmptyState } from "@/components/diagnostic-setup/SetupDataStates";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import type { TenantServiceOption, TestParameterRow } from "@/lib/diagnostic/types";

type Props = {
  parameters: TestParameterRow[];
  services: TenantServiceOption[];
  initialServiceId?: string;
};

export function TestParametersPanel({ parameters, services, initialServiceId }: Props) {
  const [serviceFilter, setServiceFilter] = useState(initialServiceId ?? "all");
  const [selected, setSelected] = useState<TestParameterRow | null>(
    parameters[0] ?? null,
  );

  const filtered = useMemo(() => {
    if (serviceFilter === "all") return parameters;
    return parameters.filter((p) => p.tenantServiceId === serviceFilter);
  }, [parameters, serviceFilter]);

  if (parameters.length === 0) {
    return (
      <SetupEmptyState
        title="No test parameters"
        description="Import host catalog services first. Parameters are created automatically during import."
      />
    );
  }

  const active = selected && filtered.some((p) => p.id === selected.id)
    ? selected
    : filtered[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Tenant service"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
          >
            <option value="all">All imported services</option>
            {services.map((svc) => (
              <option key={svc.id} value={svc.id}>
                {svc.serviceCode} — {svc.serviceName}
              </option>
            ))}
          </Select>
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Parameter</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Result type</th>
                <th className="px-4 py-3">Reference range</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className={`cursor-pointer border-b border-slate-100 hover:bg-teal-50/40 ${
                    active?.id === p.id ? "bg-teal-50" : ""
                  }`}
                  onClick={() => setSelected(p)}
                >
                  <td className="px-4 py-3 text-slate-600">{p.tenantServiceName}</td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600">{p.unit}</td>
                  <td className="px-4 py-3 text-slate-600">{p.resultType}</td>
                  <td className="px-4 py-3 text-slate-600">{p.referenceRange}</td>
                  <td className="px-4 py-3">
                    <Badge variant="success">{p.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {active && (
        <Card>
          <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Name" value={active.name} readOnly className="bg-slate-50" />
            <Input label="Unit" value={active.unit} readOnly className="bg-slate-50" />
            <Input label="Display order" value={String(active.displayOrder)} readOnly className="bg-slate-50" />
            <Input label="Result type" value={active.resultType} readOnly className="bg-slate-50" />
            <Input label="Gender rules" value={active.genderRule} readOnly className="bg-slate-50" />
            <Input label="Age rules" value={active.ageRule} readOnly className="bg-slate-50" />
            <Input label="Reference range" value={active.referenceRange} readOnly className="bg-slate-50 sm:col-span-2" />
          </CardBody>
          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <Button type="button" variant="secondary" disabled>
              Save parameter
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
