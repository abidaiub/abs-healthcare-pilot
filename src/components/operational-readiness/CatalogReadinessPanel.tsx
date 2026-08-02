"use client";

import Link from "next/link";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui";

type Row = {
  id: string;
  name: string;
  department: string;
  price: number;
  sampleType: string;
  tube: string;
  analyzerMapping: boolean;
  referenceRange: boolean;
  isActive: boolean;
  missing: string[];
};

export function CatalogReadinessPanel({ rows }: { rows: Row[] }) {
  const missingCount = rows.filter((r) => r.missing.length > 0).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Catalog Readiness"
          description="Department, price, sample type, tube, analyzer mapping, and reference range coverage."
          action={
            <Link
              href="/settings/services"
              className="text-sm font-medium text-teal-700 hover:underline"
            >
              Open imported services
            </Link>
          }
        />
        <CardBody>
          <p className="text-sm text-slate-600">
            {rows.length} services · {missingCount} with missing readiness items
          </p>
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Sample</th>
                <th className="px-4 py-3">Tube</th>
                <th className="px-4 py-3">Mapping</th>
                <th className="px-4 py-3">Range</th>
                <th className="px-4 py-3">Missing</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">{r.department}</td>
                  <td className="px-4 py-3">{r.price}</td>
                  <td className="px-4 py-3">{r.sampleType}</td>
                  <td className="px-4 py-3">{r.tube}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.analyzerMapping ? "success" : "danger"}>
                      {r.analyzerMapping ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={r.referenceRange ? "success" : "danger"}>
                      {r.referenceRange ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.missing.length === 0 ? "—" : r.missing.join(", ")}
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
