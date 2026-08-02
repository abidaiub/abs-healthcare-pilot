"use client";

import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui";

type Row = {
  id: string;
  service: string;
  parameter: string;
  parameterCode: string;
  gender: string;
  ageFromDays: number | null;
  ageToDays: number | null;
  unit: string;
  normalLow: number | null;
  normalHigh: number | null;
  criticalLow: number | null;
  criticalHigh: number | null;
};

export function ReferenceRangeReadinessPanel({ rows }: { rows: Row[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Reference Range Readiness"
          description="Verify male, female, paediatric, unit, normal and critical coverage."
          action={
            <Link
              href="/settings/test-parameters"
              className="text-sm font-medium text-teal-700 hover:underline"
            >
              Open test parameters
            </Link>
          }
        />
        <CardBody>
          <p className="text-sm text-slate-600">{rows.length} active reference-range rows</p>
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Parameter</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Age days</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Normal</th>
                <th className="px-4 py-3">Critical</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">{r.service}</td>
                  <td className="px-4 py-3">
                    {r.parameter}{" "}
                    <span className="text-slate-400">({r.parameterCode})</span>
                  </td>
                  <td className="px-4 py-3">{r.gender}</td>
                  <td className="px-4 py-3">
                    {r.ageFromDays ?? "—"}–{r.ageToDays ?? "—"}
                  </td>
                  <td className="px-4 py-3">{r.unit}</td>
                  <td className="px-4 py-3">
                    {r.normalLow ?? "—"} – {r.normalHigh ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.criticalLow ?? "—"} – {r.criticalHigh ?? "—"}
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
