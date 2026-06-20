"use client";

import { useState } from "react";
import { VisualPlaceholderBanner } from "@/components/diagnostic-setup/VisualPlaceholderBanner";
import { Button, Card, CardBody, Input, Select } from "@/components/ui";
import { BILLING_LAYOUTS, type BillingLayout } from "@/lib/diagnostic-master-data";

export function BillingLayoutsPanel() {
  const [selected, setSelected] = useState<BillingLayout>(BILLING_LAYOUTS[0]);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="xl:col-span-2">
        <VisualPlaceholderBanner label="Billing layout templates use mock data until a schema model is added" />
      </div>
      <Card>
        <CardBody className="space-y-4">
          <Select
            label="Layout"
            value={selected.id}
            onChange={(e) => {
              const l = BILLING_LAYOUTS.find((b) => b.id === e.target.value);
              if (l) setSelected(l);
            }}
          >
            {BILLING_LAYOUTS.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </Select>
          <Select label="Type" defaultValue={selected.type}>
            <option>Cash Memo</option>
            <option>Money Receipt</option>
            <option>Invoice</option>
          </Select>
          <Select label="Paper" defaultValue={selected.paper}>
            <option>A4</option>
            <option>A5</option>
            <option>Thermal</option>
          </Select>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["Logo", selected.showLogo],
              ["QR", selected.showQr],
              ["Patient mobile", selected.showPatientMobile],
              ["Ref doctor", selected.showRefDoctor],
              ["Due amount", selected.showDueAmount],
              ["VAT", selected.showVat],
            ].map(([label, checked]) => (
              <label key={String(label)} className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked={Boolean(checked)} className="rounded text-teal-600" />
                {String(label)}
              </label>
            ))}
          </div>
          <Button type="button">Save billing layout</Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="mb-3 text-sm font-semibold text-slate-900">Live preview — {selected.type}</p>
          <div className={`rounded-lg border-2 border-slate-300 bg-white p-4 shadow-md ${selected.paper === "Thermal" ? "max-w-xs text-xs" : ""}`}>
            {selected.showLogo && <div className="mb-2 h-6 w-20 rounded bg-teal-100 text-center text-[10px] leading-6 text-teal-700">Logo</div>}
            <p className="font-semibold">Al Baraka Medical Group</p>
            <p className="text-slate-600">BR-DHK-01 · Cash Memo</p>
            <hr className="my-2 border-slate-200" />
            <p>Patient: Mohammad Ali</p>
            {selected.showPatientMobile && <p>Mobile: +880 17 1111 0001</p>}
            {selected.showRefDoctor && <p>Ref: Dr. Shafiqul Islam</p>}
            <p className="mt-2">CBC — BDT 400</p>
            <p className="font-semibold">Total: BDT 400</p>
            {selected.showDueAmount && <p className="text-amber-700">Due: BDT 0</p>}
            {selected.showVat && <p>VAT: BDT 0</p>}
            {selected.showQr && <div className="mt-2 h-10 w-10 border border-slate-300 bg-slate-100 text-[8px] leading-10 text-center">QR</div>}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
