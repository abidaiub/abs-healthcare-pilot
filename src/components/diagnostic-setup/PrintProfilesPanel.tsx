"use client";

import { useState } from "react";
import { VisualPlaceholderBanner } from "@/components/diagnostic-setup/VisualPlaceholderBanner";
import { Button, Card, CardBody, Input, Select } from "@/components/ui";
import { PRINT_PROFILES, type PrintProfile } from "@/lib/diagnostic-master-data";

export function PrintProfilesPanel() {
  const [selected, setSelected] = useState<PrintProfile>(PRINT_PROFILES[0]);

  return (
    <div className="space-y-6">
      <VisualPlaceholderBanner label="Print profiles use mock data until a schema model is added" />
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Profile</th>
                <th className="px-4 py-3">Paper</th>
                <th className="px-4 py-3">Margins</th>
                <th className="px-4 py-3">Header</th>
                <th className="px-4 py-3">Footer</th>
              </tr>
            </thead>
            <tbody>
              {PRINT_PROFILES.map((p) => (
                <tr
                  key={p.id}
                  className={`cursor-pointer border-b border-slate-100 hover:bg-teal-50/40 ${
                    selected.id === p.id ? "bg-teal-50" : ""
                  }`}
                  onClick={() => setSelected(p)}
                >
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600">{p.paperType}</td>
                  <td className="px-4 py-3 text-slate-600">
                    T:{p.marginTop} B:{p.marginBottom}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.headerHeight}</td>
                  <td className="px-4 py-3 text-slate-600">{p.footerHeight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Profile name" defaultValue={selected.name} />
          <Input label="Margin top" defaultValue={selected.marginTop} />
          <Input label="Margin bottom" defaultValue={selected.marginBottom} />
          <Input label="Margin left" defaultValue={selected.marginLeft} />
          <Input label="Margin right" defaultValue={selected.marginRight} />
          <Input label="Header height" defaultValue={selected.headerHeight} />
          <Input label="Footer height" defaultValue={selected.footerHeight} />
        </CardBody>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Button type="button">Save profile</Button>
        </div>
      </Card>
    </div>
  );
}
