"use client";

import { useState } from "react";
import { VisualPlaceholderBanner } from "@/components/diagnostic-setup/VisualPlaceholderBanner";
import { Button, Card, CardBody, Input, Select } from "@/components/ui";
import { REPORT_LAYOUTS, type ReportLayout } from "@/lib/diagnostic-master-data";

export function ReportLayoutsPanel() {
  const [selected, setSelected] = useState<ReportLayout>(REPORT_LAYOUTS[0]);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="xl:col-span-2">
        <VisualPlaceholderBanner label="Report layout templates use mock data until a schema model is added" />
      </div>
      <Card>
        <CardBody className="space-y-4">
          <Select
            label="Layout"
            value={selected.id}
            onChange={(e) => {
              const l = REPORT_LAYOUTS.find((r) => r.id === e.target.value);
              if (l) setSelected(l);
            }}
          >
            {REPORT_LAYOUTS.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </Select>
          <Select label="Type" defaultValue={selected.type}>
            <option>Lab Report</option>
            <option>Radiology Report</option>
            <option>Cardiology Report</option>
          </Select>
          <p className="text-sm font-medium text-slate-700">Sections</p>
          <div className="flex gap-4 text-sm text-slate-600">
            <span>Header</span><span>Body</span><span>Footer</span>
          </div>
          <Select label="Paper size" defaultValue={selected.paperSize}>
            <option>A4</option><option>A5</option><option>Legal</option><option>Letter</option>
          </Select>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["Logo", selected.showLogo],
              ["Slogan", selected.showSlogan],
              ["Address", selected.showAddress],
              ["Disclaimer", selected.showDisclaimer],
              ["QR", selected.showQr],
              ["Preprinted paper", selected.preprintedPaper],
              ["Header off", selected.headerOff],
              ["Footer off", selected.footerOff],
            ].map(([label, checked]) => (
              <label key={String(label)} className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked={Boolean(checked)} className="rounded text-teal-600" />
                {String(label)}
              </label>
            ))}
          </div>
          <Button type="button">Save layout</Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="mb-3 text-sm font-semibold text-slate-900">Live preview</p>
          <div className="relative flex aspect-[210/297] max-h-[480px] flex-col overflow-hidden rounded-lg border-2 border-slate-300 bg-white shadow-lg">
            {!selected.headerOff && (
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-center">
                {selected.showLogo && <div className="mx-auto mb-1 h-8 w-24 rounded bg-teal-100 text-xs leading-8 text-teal-700">ABMG Logo</div>}
                {selected.showSlogan && <p className="text-xs text-slate-600">Quality Healthcare for All</p>}
                {selected.showAddress && <p className="text-[10px] text-slate-500">12/A Dhanmondi, Dhaka 1209</p>}
              </div>
            )}
            <div className="flex-1 px-4 py-6 text-xs text-slate-700">
              <p className="font-semibold">{selected.type}</p>
              <p className="mt-2">Patient: Mohammad Ali · MRN: PT-260001</p>
              <p className="mt-4 border-t border-slate-100 pt-4">Result body area...</p>
            </div>
            {!selected.footerOff && (
              <div className="border-t border-slate-200 px-4 py-2 text-center text-[10px] text-slate-500">
                {selected.showDisclaimer && <p>Results verified by authorized pathologist.</p>}
                {selected.showQr && <span className="inline-block h-8 w-8 border border-slate-300 bg-slate-100">QR</span>}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
