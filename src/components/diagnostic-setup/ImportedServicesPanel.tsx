"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { updateTenantServiceAction } from "@/app/actions/diagnostic-setup";
import { SetupEmptyState } from "@/components/diagnostic-setup/SetupDataStates";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import type { BranchOption, TenantImportedServiceRow } from "@/lib/diagnostic/types";

const TABS = ["Basic", "Pricing", "Sample Rules", "Parameters", "Reporting", "Branch Availability"] as const;

type Props = {
  services: TenantImportedServiceRow[];
  branches: BranchOption[];
};

export function ImportedServicesPanel({ services, branches }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Basic");
  const [selected, setSelected] = useState<TenantImportedServiceRow | null>(services[0] ?? null);
  const [price, setPrice] = useState(String(services[0]?.price ?? ""));
  const [tatHours, setTatHours] = useState(String(services[0]?.tatHours ?? ""));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      services.filter(
        (s) =>
          s.serviceName.toLowerCase().includes(search.toLowerCase()) ||
          s.serviceCode.toLowerCase().includes(search.toLowerCase()),
      ),
    [services, search],
  );

  function selectService(svc: TenantImportedServiceRow) {
    setSelected(svc);
    setPrice(String(svc.price));
    setTatHours(svc.tatHours != null ? String(svc.tatHours) : "");
  }

  function handleSave() {
    if (!selected) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateTenantServiceAction({
        tenantServiceId: selected.id,
        price: Number(price),
        tatHours: tatHours ? Number(tatHours) : null,
      });
      if (result.ok) {
        setMessage("Service updated.");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (services.length === 0) {
    return (
      <SetupEmptyState
        title="No imported services"
        description="Import host catalog services from Service Catalog Import to configure tenant pricing and reporting."
      />
    );
  }

  if (!selected) return null;

  return (
    <div className="space-y-6">
      {(message || error) && (
        <div>
          {message && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}
        </div>
      )}

      <Card>
        <CardBody>
          <Input
            label="Search imported service"
            placeholder="Code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Service name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Analyzer</th>
                <th className="px-4 py-3">Report doctor</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((svc) => (
                <tr
                  key={svc.id}
                  className={`cursor-pointer border-b border-slate-100 hover:bg-teal-50/40 ${
                    selected.id === svc.id ? "bg-teal-50" : ""
                  }`}
                  onClick={() => selectService(svc)}
                >
                  <td className="px-4 py-3 font-mono text-teal-700">{svc.serviceCode}</td>
                  <td className="px-4 py-3 font-medium">{svc.serviceName}</td>
                  <td className="px-4 py-3 text-slate-600">{svc.department}</td>
                  <td className="px-4 py-3">BDT {svc.price}</td>
                  <td className="px-4 py-3 text-slate-600">{svc.method}</td>
                  <td className="px-4 py-3 text-slate-600">{svc.analyzer}</td>
                  <td className="px-4 py-3 text-slate-600">{svc.reportDoctor}</td>
                  <td className="px-4 py-3">
                    <Badge variant={svc.status === "Active" ? "success" : "default"}>{svc.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-4">
          <div className="flex flex-wrap gap-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
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
              <Input label="Service code" value={selected.serviceCode} readOnly className="bg-slate-50" />
              <Input label="Service name" value={selected.serviceName} readOnly className="bg-slate-50" />
              <Input label="Department" value={selected.department} readOnly className="bg-slate-50" />
              <Input label="Category" value={selected.category} readOnly className="bg-slate-50" />
              <Select label="Status" defaultValue={selected.status} disabled>
                <option>Active</option>
                <option>Inactive</option>
              </Select>
            </>
          )}
          {activeTab === "Pricing" && (
            <>
              <Input
                label="Tenant price (BDT)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <Input
                label="TAT (hours)"
                value={tatHours}
                onChange={(e) => setTatHours(e.target.value)}
              />
            </>
          )}
          {activeTab === "Sample Rules" && (
            <>
              <Input label="Sample type" value={selected.sampleType} readOnly className="bg-slate-50" />
              <Input label="Container / tube" value={selected.container} readOnly className="bg-slate-50" />
            </>
          )}
          {activeTab === "Parameters" && (
            <p className="col-span-full text-sm text-slate-600">
              Linked parameters from host import — configure in Test Parameters screen.
            </p>
          )}
          {activeTab === "Reporting" && (
            <>
              <Input label="Test method" value={selected.method} readOnly className="bg-slate-50" />
              <Input label="Analyzer" value={selected.analyzer} readOnly className="bg-slate-50" />
              <Input label="Report doctor" value={selected.reportDoctor} readOnly className="bg-slate-50" />
            </>
          )}
          {activeTab === "Branch Availability" &&
            branches.map((b) => (
              <label key={b.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  readOnly
                  checked={selected.branches.includes(b.code)}
                  className="rounded border-slate-300 text-teal-600"
                />
                {b.code} — {b.name}
              </label>
            ))}
        </CardBody>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Button type="button" variant="secondary">Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save service"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
