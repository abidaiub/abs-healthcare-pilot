"use client";

import { useState } from "react";
import { SetupEmptyState } from "@/components/diagnostic-setup/SetupDataStates";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import type { BranchOption, DoctorRow } from "@/lib/diagnostic/types";

const DOCTOR_TABS = ["Basic", "Branches", "Departments", "Permissions", "Signature"] as const;

type Props = {
  doctors: DoctorRow[];
  branches: BranchOption[];
};

export function DoctorsPanel({ doctors, branches }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof DOCTOR_TABS)[number]>("Basic");
  const [selected, setSelected] = useState<DoctorRow | null>(doctors[0] ?? null);

  if (doctors.length === 0) {
    return (
      <SetupEmptyState
        title="No doctors registered"
        description="Add reporting and verifying doctors for this tenant to configure report workflows."
      />
    );
  }

  const active = selected ?? doctors[0];

  return (
    <div className="space-y-6">
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Doctor code</th>
                <th className="px-4 py-3">Doctor name</th>
                <th className="px-4 py-3">Degree</th>
                <th className="px-4 py-3">Specialty</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <tr
                  key={d.id}
                  className={`cursor-pointer border-b border-slate-100 hover:bg-teal-50/40 ${
                    active.id === d.id ? "bg-teal-50" : ""
                  }`}
                  onClick={() => setSelected(d)}
                >
                  <td className="px-4 py-3 font-mono text-teal-700">{d.code}</td>
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-slate-600">{d.degree}</td>
                  <td className="px-4 py-3 text-slate-600">{d.specialty}</td>
                  <td className="px-4 py-3 text-slate-600">{d.phone}</td>
                  <td className="px-4 py-3 text-slate-600">{d.department}</td>
                  <td className="px-4 py-3"><Badge variant="success">{d.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-4">
          <div className="flex flex-wrap gap-1">
            {DOCTOR_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-4 py-3 text-sm font-medium ${
                  activeTab === tab ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeTab === "Basic" && (
            <>
              <Input label="Doctor code" value={active.code} readOnly className="bg-slate-50" />
              <Input label="Doctor name" value={active.name} readOnly className="bg-slate-50" />
              <Input label="Degree" value={active.degree} readOnly className="bg-slate-50" />
              <Input label="Specialty" value={active.specialty} readOnly className="bg-slate-50" />
              <Input label="Phone" value={active.phone} readOnly className="bg-slate-50" />
              <Input label="Department" value={active.department} readOnly className="bg-slate-50" />
              <div className="sm:col-span-2">
                <p className="mb-2 text-sm font-medium text-slate-700">Doctor types</p>
                <div className="flex flex-wrap gap-2">
                  {active.doctorTypes.map((t) => (
                    <Badge key={t} variant="info">{t}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}
          {activeTab === "Branches" &&
            branches.map((b) => (
              <label key={b.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  readOnly
                  checked={active.branches.includes(b.code)}
                  className="rounded text-teal-600"
                />
                {b.code} — {b.name}
              </label>
            ))}
          {activeTab === "Departments" && (
            <Input label="Primary department" value={active.department} readOnly className="bg-slate-50" />
          )}
          {activeTab === "Permissions" && (
            <p className="col-span-full text-sm text-slate-600">
              Department mappings loaded from database. Edit workflow coming in a later phase.
            </p>
          )}
          {activeTab === "Signature" && (
            <p className="col-span-full text-sm text-slate-600">
              Configure signature templates per doctor in Signature Templates screen.
            </p>
          )}
        </CardBody>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Button type="button" disabled>Save doctor</Button>
        </div>
      </Card>
    </div>
  );
}
