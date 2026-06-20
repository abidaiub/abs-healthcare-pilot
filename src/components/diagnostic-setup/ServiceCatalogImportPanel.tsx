"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { tenantImportHostServicesAction } from "@/app/actions/diagnostic-import";
import { SetupEmptyState } from "@/components/diagnostic-setup/SetupDataStates";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import type { ImportableHostServiceRow } from "@/lib/diagnostic/types";

type Props = {
  items: ImportableHostServiceRow[];
};

export function ServiceCatalogImportPanel({ items }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [category, setCategory] = useState("All");
  const [sampleType, setSampleType] = useState("All");
  const [selectedCode, setSelectedCode] = useState(items[0]?.serviceCode ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const notImported = items.filter((item) => !item.alreadyImported);

  const filtered = useMemo(
    () =>
      notImported.filter((item) => {
        const q = search.toLowerCase();
        const matchSearch =
          item.serviceName.toLowerCase().includes(q) ||
          item.serviceCode.toLowerCase().includes(q);
        const matchDept = dept === "All" || item.department === dept;
        const matchCat = category === "All" || item.category === category;
        const matchSample =
          sampleType === "All" || item.sampleType === sampleType;
        return matchSearch && matchDept && matchCat && matchSample;
      }),
    [notImported, search, dept, category, sampleType],
  );

  const selected =
    items.find((item) => item.serviceCode === selectedCode) ?? filtered[0];

  const departments = [...new Set(items.map((i) => i.department))];
  const categories = [...new Set(items.map((i) => i.category))];
  const sampleTypes = [...new Set(items.map((i) => i.sampleType))];

  function handleImport(hostServiceId: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const result = await tenantImportHostServicesAction({
          hostServiceIds: [hostServiceId],
          assignAllBranches: true,
        });
        const row = result.results[0];
        if (row?.status === "imported") {
          setMessage(`Imported ${row.serviceCode} successfully.`);
          router.refresh();
        } else if (row?.status === "skipped") {
          setMessage(row.message ?? `${row.serviceCode} already imported.`);
          router.refresh();
        } else {
          setError(row?.message ?? "Import failed.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Import failed.");
      }
    });
  }

  if (notImported.length === 0) {
    return (
      <SetupEmptyState
        title="All host services imported"
        description="Every active host catalog service has been imported for this tenant. View them under Imported Services."
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      {(message || error) && (
        <div className="xl:col-span-2">
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

      <div className="space-y-4">
        <Card>
          <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Search"
              placeholder="Service name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:col-span-2"
            />
            <Select label="Department" value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="All">All</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
            <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="All">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Select label="Sample type" value={sampleType} onChange={(e) => setSampleType(e.target.value)}>
              <option value="All">All</option>
              {sampleTypes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </CardBody>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Sample type</th>
                  <th className="px-4 py-3">Parameters</th>
                  <th className="px-4 py-3">Import ready</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      No matching services to import.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr
                      key={item.serviceCode}
                      className={`cursor-pointer border-b border-slate-100 hover:bg-teal-50/40 ${
                        selectedCode === item.serviceCode ? "bg-teal-50" : ""
                      }`}
                      onClick={() => setSelectedCode(item.serviceCode)}
                    >
                      <td className="px-4 py-3 font-mono text-teal-700">{item.serviceCode}</td>
                      <td className="px-4 py-3 font-medium">{item.serviceName}</td>
                      <td className="px-4 py-3 text-slate-600">{item.department}</td>
                      <td className="px-4 py-3 text-slate-600">{item.category}</td>
                      <td className="px-4 py-3 text-slate-600">{item.sampleType}</td>
                      <td className="px-4 py-3 text-center">{item.parameterCount}</td>
                      <td className="px-4 py-3">
                        <Badge variant={item.importReady ? "success" : "warning"}>
                          {item.importReady ? "Ready" : "Pending"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={item.status === "Active" ? "success" : "default"}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          variant="ghost"
                          className="px-2 py-1 text-xs"
                          disabled={isPending || item.alreadyImported}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImport(item.id);
                          }}
                        >
                          Import
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {selected && (
        <Card className="h-fit xl:sticky xl:top-6">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Import preview</p>
            <p className="text-xs text-slate-500">{selected.serviceCode} — {selected.serviceName}</p>
          </div>
          <CardBody className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-slate-700">Parameters ({selected.parameterCount})</p>
              {selected.parameters.length > 0 ? (
                <ul className="mt-1 space-y-1 text-slate-600">
                  {selected.parameters.map((p) => (
                    <li key={p.name}>{p.name} — {p.referenceRange}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-slate-500">No parameters (imaging/cardiology)</p>
              )}
            </div>
            <div>
              <p className="font-medium text-slate-700">Sample rules</p>
              <p className="mt-1 text-slate-600">{selected.collectionInstruction}</p>
            </div>
            <div>
              <p className="font-medium text-slate-700">Report group</p>
              <p className="mt-1 text-slate-600">{selected.reportGroup}</p>
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={isPending || selected.alreadyImported}
              onClick={() => handleImport(selected.id)}
            >
              {isPending ? "Importing..." : "Import to tenant"}
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
