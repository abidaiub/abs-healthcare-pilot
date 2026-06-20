"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { hostImportHostServicesAction } from "@/app/actions/diagnostic-import";
import { VisualPlaceholderBanner } from "@/components/diagnostic-setup/VisualPlaceholderBanner";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  StatCard,
} from "@/components/ui";
import type {
  HostCatalogKpis,
  HostCatalogServiceRow,
  TenantOptionRow,
} from "@/lib/diagnostic/types";

type Props = {
  services: HostCatalogServiceRow[];
  kpis: HostCatalogKpis;
  tenants: TenantOptionRow[];
};

export function HostTestCatalogPanel({ services, kpis, tenants }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<HostCatalogServiceRow | null>(services[0] ?? null);
  const [importOpen, setImportOpen] = useState(false);
  const [importTenant, setImportTenant] = useState<string>(tenants[0]?.id ?? "");
  const [importBranch, setImportBranch] = useState<string>(tenants[0]?.branches[0]?.id ?? "");
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedTenant = tenants.find((t) => t.id === importTenant);

  const filtered = useMemo(
    () =>
      services.filter((test) => {
        const matchesSearch =
          test.serviceName.toLowerCase().includes(search.toLowerCase()) ||
          test.serviceCode.toLowerCase().includes(search.toLowerCase());
        const matchesDept =
          departmentFilter === "All" || test.department === departmentFilter;
        const matchesStatus =
          statusFilter === "All" ||
          (statusFilter === "Active" ? test.isActive : !test.isActive);
        return matchesSearch && matchesDept && matchesStatus;
      }),
    [services, search, departmentFilter, statusFilter],
  );

  const departments = [...new Set(services.map((s) => s.department))];

  function handleTenantChange(tenantId: string) {
    setImportTenant(tenantId);
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant?.branches[0]) {
      setImportBranch(tenant.branches[0].id);
    }
  }

  function toggleImportId(id: string) {
    setSelectedImportIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleImport() {
    if (!importTenant || !importBranch || selectedImportIds.length === 0) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const result = await hostImportHostServicesAction({
          tenantId: importTenant,
          hostServiceIds: selectedImportIds,
          branchIds: [importBranch],
        });
        setMessage(
          `Imported ${result.importedCount}, skipped ${result.skippedCount}, failed ${result.failedCount}.`,
        );
        setImportOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Import failed.");
      }
    });
  }

  const active = selected ?? services[0];

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total services" value={kpis.totalServices} accent="teal" />
        <StatCard label="Laboratory tests" value={kpis.laboratoryTests} accent="blue" />
        <StatCard label="Radiology services" value={kpis.radiologyServices} accent="violet" />
        <StatCard label="Cardiology services" value={kpis.cardiologyServices} accent="amber" />
        <StatCard label="Packages" value={kpis.packages} accent="teal" />
        <StatCard label="Departments" value={kpis.departments} accent="blue" />
        <StatCard label="Parameters" value={kpis.parameters} accent="violet" />
        <StatCard label="Ready to import" value={kpis.readyToImport} accent="amber" />
      </div>

      <Card>
        <CardBody className="grid gap-4 lg:grid-cols-5">
          <Input
            label="Search service"
            placeholder="Search service name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="lg:col-span-2"
          />
          <Select label="Department" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="All">All</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
          <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
          <div className="flex items-end">
            <Button
              type="button"
              className="w-full"
              disabled={tenants.length === 0}
              onClick={() => setImportOpen(true)}
            >
              Import to tenant
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Host service grid"
          description="Global diagnostic library — host catalog from Prisma (tenantId NULL)."
        />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Service name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Sample type</th>
                <th className="px-4 py-3">Container</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Parameters</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((test) => (
                <tr
                  key={test.id}
                  className={`cursor-pointer border-b border-slate-100 hover:bg-teal-50/50 ${
                    active?.id === test.id ? "bg-teal-50" : ""
                  }`}
                  onClick={() => setSelected(test)}
                >
                  <td className="px-4 py-3 font-medium text-teal-700">{test.serviceCode}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{test.serviceName}</td>
                  <td className="px-4 py-3 text-slate-600">{test.department}</td>
                  <td className="px-4 py-3 text-slate-600">{test.category}</td>
                  <td className="px-4 py-3 text-slate-600">{test.sampleType}</td>
                  <td className="px-4 py-3 text-slate-600">{test.containerType}</td>
                  <td className="px-4 py-3 text-slate-600">{test.testMethod}</td>
                  <td className="px-4 py-3 text-center">{test.parameterCount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={test.isActive ? "success" : "default"}>
                      {test.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {active && (
        <Card>
          <CardHeader title="Host service detail" description={active.serviceCode} />
          <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Service code" value={active.serviceCode} readOnly className="bg-slate-50" />
            <Input label="Service name" value={active.serviceName} readOnly className="bg-slate-50" />
            <Input label="Department" value={active.department} readOnly className="bg-slate-50" />
            <Input label="Category" value={active.category} readOnly className="bg-slate-50" />
            <Input label="Base price" value={`BDT ${active.basePrice}`} readOnly className="bg-slate-50" />
            <Input label="Result mode" value={active.resultMode} readOnly className="bg-slate-50" />
            <Input label="Sample type" value={active.sampleType} readOnly className="bg-slate-50" />
            <Input label="Container" value={active.containerType} readOnly className="bg-slate-50" />
            <Input label="Collection instruction" value={active.collectionInstruction || "—"} readOnly className="bg-slate-50 sm:col-span-3" />
          </CardBody>
        </Card>
      )}

      <VisualPlaceholderBanner label="AI recommended catalog and seed design sections are UI-only planning aids" />

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">Import to tenant</h2>
              <p className="text-sm text-slate-500">
                Host catalog → tenant service setup. Requires explicit tenant and branch selection.
              </p>
            </div>
            <CardBody className="space-y-6">
              {tenants.length === 0 ? (
                <p className="text-sm text-slate-600">No active tenants in database.</p>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select label="Select tenant" value={importTenant} onChange={(e) => handleTenantChange(e.target.value)}>
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name} ({tenant.code})
                        </option>
                      ))}
                    </Select>
                    <Select label="Select branch" value={importBranch} onChange={(e) => setImportBranch(e.target.value)}>
                      {selectedTenant?.branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name} — {branch.code}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {services.map((test) => (
                        <label key={test.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={selectedImportIds.includes(test.id)}
                            onChange={() => toggleImportId(test.id)}
                            className="rounded border-slate-300 text-teal-600"
                          />
                          <span className="text-sm text-slate-700">
                            <span className="font-mono text-xs text-teal-700">{test.serviceCode}</span>{" "}
                            {test.serviceName}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={() => setImportOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      disabled={isPending || selectedImportIds.length === 0}
                      onClick={handleImport}
                    >
                      {isPending ? "Importing..." : "Confirm import"}
                    </Button>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
