"use client";

import { SetupEmptyState } from "@/components/diagnostic-setup/SetupDataStates";
import { Badge, Card } from "@/components/ui";
import type { ReportDoctorAssignmentRow } from "@/lib/diagnostic/types";

type Props = {
  items: ReportDoctorAssignmentRow[];
};

export function ReportDoctorAssignmentPanel({ items }: Props) {
  if (items.length === 0) {
    return (
      <SetupEmptyState
        title="No report doctor assignments"
        description="Assign reporting and verifying doctors per service after importing catalog and registering doctors."
      />
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Reporting doctor</th>
              <th className="px-4 py-3">Verifying doctor</th>
              <th className="px-4 py-3">Consultant</th>
              <th className="px-4 py-3">Default</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-medium">{row.serviceName}</p>
                  <p className="text-xs text-slate-500">{row.serviceCode}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{row.department}</td>
                <td className="px-4 py-3 text-slate-600">{row.reportingDoctor}</td>
                <td className="px-4 py-3 text-slate-600">{row.verifyingDoctor}</td>
                <td className="px-4 py-3 text-slate-600">{row.consultant}</td>
                <td className="px-4 py-3">
                  {row.isDefault ? <Badge variant="info">Default</Badge> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
