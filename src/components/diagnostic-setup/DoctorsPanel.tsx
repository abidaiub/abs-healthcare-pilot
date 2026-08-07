"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createTenantDoctorAction } from "@/app/actions/diagnostic-setup";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import type { BranchOption, DepartmentOption, DoctorRow } from "@/lib/diagnostic/types";

const DOCTOR_TABS = ["Basic", "Branches", "Departments", "Permissions", "Signature"] as const;

type Props = {
  doctors: DoctorRow[];
  branches: BranchOption[];
  departments: DepartmentOption[];
  canCreate?: boolean;
};

const EMPTY_FORM = {
  doctorCode: "",
  doctorName: "",
  degree: "",
  specialty: "",
  phone: "",
  departmentId: "",
  isReferring: false,
  commissionApplicable: false,
  isReporting: false,
  isVerifying: false,
  isPathologist: false,
};

export function DoctorsPanel({
  doctors,
  branches,
  departments,
  canCreate = false,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<(typeof DOCTOR_TABS)[number]>("Basic");
  const [selected, setSelected] = useState<DoctorRow | null>(doctors[0] ?? null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const active = selected ?? doctors[0] ?? null;

  function updateForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createTenantDoctorAction({
        doctorCode: form.doctorCode,
        doctorName: form.doctorName,
        degree: form.degree || undefined,
        specialty: form.specialty || undefined,
        phone: form.phone || undefined,
        departmentId: form.departmentId || undefined,
        isReferring: form.isReferring,
        commissionApplicable: form.commissionApplicable,
        isReporting: form.isReporting,
        isVerifying: form.isVerifying,
        isPathologist: form.isPathologist,
      });

      if (result.ok) {
        setForm(EMPTY_FORM);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

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
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No doctors registered yet. Use the form below to add the first doctor.
                  </td>
                </tr>
              ) : (
                doctors.map((d) => (
                  <tr
                    key={d.id}
                    className={`cursor-pointer border-b border-slate-100 hover:bg-teal-50/40 ${
                      active?.id === d.id ? "bg-teal-50" : ""
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {active && (
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
                    {active.doctorTypes.length === 0 ? (
                      <span className="text-sm text-slate-500">No types assigned</span>
                    ) : (
                      active.doctorTypes.map((t) => (
                        <Badge key={t} variant="info">{t}</Badge>
                      ))
                    )}
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
        </Card>
      )}

      {canCreate && (
      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Register new doctor</h3>
          <p className="mt-1 text-sm text-slate-500">
            Add a reporting, verifying, or consultant doctor for this tenant.
          </p>
        </div>
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Doctor code"
            placeholder="DR-LAB-001"
            value={form.doctorCode}
            onChange={(e) => updateForm("doctorCode", e.target.value)}
          />
          <Input
            label="Doctor name"
            placeholder="Dr. Amina Rahman"
            value={form.doctorName}
            onChange={(e) => updateForm("doctorName", e.target.value)}
          />
          <Input
            label="Degree"
            placeholder="MBBS, FCPS"
            value={form.degree}
            onChange={(e) => updateForm("degree", e.target.value)}
          />
          <Input
            label="Specialty"
            placeholder="Pathology"
            value={form.specialty}
            onChange={(e) => updateForm("specialty", e.target.value)}
          />
          <Input
            label="Phone"
            placeholder="+880 1XXX-XXXXXX"
            value={form.phone}
            onChange={(e) => updateForm("phone", e.target.value)}
          />
          <Select
            label="Department"
            value={form.departmentId}
            onChange={(e) => updateForm("departmentId", e.target.value)}
          >
            <option value="">Select department (optional)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="mb-2 text-sm font-medium text-slate-700">Doctor types</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isReferring}
                  onChange={(e) => updateForm("isReferring", e.target.checked)}
                  className="rounded text-teal-600"
                />
                Referring
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.commissionApplicable}
                  onChange={(e) => updateForm("commissionApplicable", e.target.checked)}
                  className="rounded text-teal-600"
                />
                Commission eligible (calculation deferred)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isReporting}
                  onChange={(e) => updateForm("isReporting", e.target.checked)}
                  className="rounded text-teal-600"
                />
                Reporting
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isVerifying}
                  onChange={(e) => updateForm("isVerifying", e.target.checked)}
                  className="rounded text-teal-600"
                />
                Verifying
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPathologist}
                  onChange={(e) => updateForm("isPathologist", e.target.checked)}
                  className="rounded text-teal-600"
                />
                Pathologist
              </label>
            </div>
          </div>
          {error && <p className="text-sm text-rose-600 sm:col-span-full">{error}</p>}
        </CardBody>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setForm(EMPTY_FORM);
              setError(null);
            }}
            disabled={isPending}
          >
            Clear
          </Button>
          <Button type="button" onClick={handleCreate} disabled={isPending}>
            {isPending ? "Saving..." : "Save doctor"}
          </Button>
        </div>
      </Card>
      )}
    </div>
  );
}
