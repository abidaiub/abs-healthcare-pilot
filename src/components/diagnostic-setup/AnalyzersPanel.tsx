"use client";

import { useState } from "react";
import { SetupEmptyState } from "@/components/diagnostic-setup/SetupDataStates";
import { Badge, Button, Card, CardBody, Input } from "@/components/ui";
import type { AnalyzerRow } from "@/lib/diagnostic/types";

type Props = {
  items: AnalyzerRow[];
};

export function AnalyzersPanel({ items }: Props) {
  const [selected, setSelected] = useState<AnalyzerRow | null>(items[0] ?? null);

  if (items.length === 0) {
    return (
      <SetupEmptyState
        title="No analyzers for this branch"
        description="Analyzers are branch-scoped. Seed data or add machines for the current branch."
      />
    );
  }

  const active = selected ?? items[0];

  return (
    <div className="space-y-6">
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Analyzer</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Manufacturer</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Interface</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr
                  key={a.id}
                  className={`cursor-pointer border-b border-slate-100 hover:bg-teal-50/40 ${
                    active.id === a.id ? "bg-teal-50" : ""
                  }`}
                  onClick={() => setSelected(a)}
                >
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3 text-slate-600">{a.model}</td>
                  <td className="px-4 py-3 text-slate-600">{a.manufacturer}</td>
                  <td className="px-4 py-3 text-slate-600">{a.department}</td>
                  <td className="px-4 py-3 text-slate-600">{a.branchCode}</td>
                  <td className="px-4 py-3 text-slate-600">{a.interfaceType}</td>
                  <td className="px-4 py-3">
                    <Badge variant="success">{a.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Machine code" value={active.machineCode} readOnly className="bg-slate-50" />
          <Input label="LIS mapping" value={active.lisMapping} readOnly className="bg-slate-50 sm:col-span-2" />
          <Input label="Communication type" value={active.communicationType} readOnly className="bg-slate-50" />
          <Input label="Analyzer name" value={active.name} readOnly className="bg-slate-50" />
          <Input label="Model" value={active.model} readOnly className="bg-slate-50" />
          <Input label="Manufacturer" value={active.manufacturer} readOnly className="bg-slate-50" />
        </CardBody>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Button type="button" variant="secondary" disabled>Cancel</Button>
          <Button type="button" disabled>Save analyzer</Button>
        </div>
      </Card>
    </div>
  );
}
