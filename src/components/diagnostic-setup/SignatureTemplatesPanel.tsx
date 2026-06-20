"use client";

import { useState } from "react";
import { SetupEmptyState } from "@/components/diagnostic-setup/SetupDataStates";
import { Button, Card, CardBody, Input, Select } from "@/components/ui";
import type { SignatureTemplateRow } from "@/lib/diagnostic/types";

type Props = {
  items: SignatureTemplateRow[];
};

export function SignatureTemplatesPanel({ items }: Props) {
  const [selected, setSelected] = useState<SignatureTemplateRow | null>(items[0] ?? null);

  if (items.length === 0) {
    return (
      <SetupEmptyState
        title="No signature templates"
        description="Create report signature templates linked to tenant doctors, branches, and departments."
      />
    );
  }

  const active = selected ?? items[0];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardBody className="space-y-4">
          <Select
            label="Template"
            value={active.id}
            onChange={(e) => {
              const t = items.find((s) => s.id === e.target.value);
              if (t) setSelected(t);
            }}
          >
            {items.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
          <Input label="Doctor" value={active.doctorName} readOnly className="bg-slate-50" />
          <Input label="Department" value={active.department} readOnly className="bg-slate-50" />
          <Input label="Branch" value={active.branchCode ?? "All branches"} readOnly className="bg-slate-50" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Show degree" value={active.showDegree ? "Yes" : "No"} readOnly className="bg-slate-50" />
            <Input label="Show BMDC" value={active.showBmdc ? "Yes" : "No"} readOnly className="bg-slate-50" />
            <Input label="Show seal" value={active.showSeal ? "Yes" : "No"} readOnly className="bg-slate-50" />
            <Input label="Show QR" value={active.showQr ? "Yes" : "No"} readOnly className="bg-slate-50" />
          </div>
          <Input label="Position" value={active.position} readOnly className="bg-slate-50" />
          <Input label="Footer text" value={active.footerText} readOnly className="bg-slate-50" />
          <Button type="button" disabled>Save template</Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="mb-4 text-sm font-semibold text-slate-900">Preview</p>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-inner">
            <div className={`flex ${active.position === "Center" ? "justify-center" : active.position === "Right" ? "justify-end" : "justify-start"}`}>
              <div className="text-center">
                <div className="mx-auto h-12 w-32 rounded border border-dashed border-slate-300 bg-slate-50 text-xs leading-[3rem] text-slate-400">
                  Signature
                </div>
                {active.showDegree && <p className="mt-2 text-xs text-slate-600">{active.doctorName}</p>}
                {active.showBmdc && <p className="text-xs text-slate-500">BMDC Reg.</p>}
                <p className="mt-1 text-sm font-medium">{active.doctorName}</p>
                {active.showSeal && (
                  <div className="mx-auto mt-2 h-10 w-10 rounded-full border border-dashed border-slate-300 bg-slate-50 text-[8px] leading-10 text-slate-400">
                    Seal
                  </div>
                )}
              </div>
            </div>
            {active.footerText && (
              <p className="mt-4 text-center text-xs text-slate-500">{active.footerText}</p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
