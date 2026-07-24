"use client";

import { Card, CardBody } from "@/components/ui";
import { useI18n } from "@/lib/i18n/client";

type ReferenceRow = { id: string; code: string; displayName: string; shortName?: string | null };

function ReferenceTable({ title, rows }: { title: string; rows: ReferenceRow[] }) {
  return (
    <Card>
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-mono text-sm">{row.code}</td>
                <td className="px-4 py-3 text-sm">{row.shortName ? `${row.displayName} (${row.shortName})` : row.displayName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <CardBody>
          <p className="text-sm text-slate-500">—</p>
        </CardBody>
      )}
    </Card>
  );
}

export function ReferenceDataPanel({
  referenceData,
}: {
  referenceData: {
    dosageForms: ReferenceRow[];
    routes: ReferenceRow[];
    categories: ReferenceRow[];
    units: ReferenceRow[];
  };
}) {
  const { t } = useI18n();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ReferenceTable title={t("pharmacy.reference.dosageForms")} rows={referenceData.dosageForms} />
      <ReferenceTable title={t("pharmacy.reference.routes")} rows={referenceData.routes} />
      <ReferenceTable title={t("pharmacy.reference.categories")} rows={referenceData.categories} />
      <ReferenceTable title={t("pharmacy.reference.units")} rows={referenceData.units} />
    </div>
  );
}
