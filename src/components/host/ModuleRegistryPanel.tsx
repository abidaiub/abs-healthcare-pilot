"use client";

import { Badge, Card } from "@/components/ui";
import { SetupEmptyState } from "@/components/diagnostic-setup/SetupDataStates";
import type { ModuleRegistryRow } from "@/lib/diagnostic/types";

type Props = {
  modules: ModuleRegistryRow[];
};

export function ModuleRegistryPanel({ modules }: Props) {
  if (modules.length === 0) {
    return (
      <SetupEmptyState
        title="Module registry empty"
        description="Run database seed to populate the global ModuleRegistry table."
      />
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Module code</th>
              <th className="px-4 py-3">Module name</th>
              <th className="px-4 py-3">Module group</th>
              <th className="px-4 py-3">Core module</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => (
              <tr key={mod.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-mono font-medium text-teal-700">{mod.moduleCode}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{mod.moduleName}</p>
                  <p className="text-xs text-slate-500">{mod.description}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{mod.moduleGroup}</td>
                <td className="px-4 py-3">
                  <Badge variant={mod.coreModule ? "info" : "default"}>
                    {mod.coreModule ? "Core" : "Optional"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={mod.status === "Active" ? "success" : "default"}>{mod.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
