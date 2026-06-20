"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createTenantSampleTypeAction } from "@/app/actions/diagnostic-setup";
import { SetupEmptyState } from "@/components/diagnostic-setup/SetupDataStates";
import { Badge, Button, Card, CardBody, Input } from "@/components/ui";
import type {
  ContainerRow,
  ReportingMethodRow,
  SampleTypeRow,
  TestMethodRow,
} from "@/lib/diagnostic/types";

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "Active" ? "success" : "default"}>{status}</Badge>
  );
}

function ScopeBadge({ scope }: { scope: "Host" | "Tenant" }) {
  return <Badge variant={scope === "Host" ? "info" : "default"}>{scope}</Badge>;
}

type SampleTypesPanelProps = { items: SampleTypeRow[] };

export function SampleTypesPanel({ items }: SampleTypesPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [typeCode, setTypeCode] = useState("");
  const [sampleType, setSampleType] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await createTenantSampleTypeAction({ typeCode, sampleType });
      if (result.ok) {
        setTypeCode("");
        setSampleType("");
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
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No sample types available.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-mono text-teal-700">{row.code}</td>
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3"><ScopeBadge scope={row.scope} /></td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Code" placeholder="SMP-BLD" value={typeCode} onChange={(e) => setTypeCode(e.target.value)} />
          <Input label="Name" placeholder="Blood" value={sampleType} onChange={(e) => setSampleType(e.target.value)} />
          {error && <p className="text-sm text-rose-600 sm:col-span-full">{error}</p>}
        </CardBody>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save tenant sample type"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

type ContainersPanelProps = { items: ContainerRow[] };

export function ContainersPanel({ items }: ContainersPanelProps) {
  return (
    <div className="space-y-6">
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Tube</th>
                <th className="px-4 py-3">Color</th>
                <th className="px-4 py-3">Container</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Barcode</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No containers available.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium">{row.tube}</td>
                    <td className="px-4 py-3">{row.color}</td>
                    <td className="px-4 py-3 text-slate-600">{row.container}</td>
                    <td className="px-4 py-3 text-slate-600">{row.department}</td>
                    <td className="px-4 py-3"><ScopeBadge scope={row.scope} /></td>
                    <td className="px-4 py-3">{row.barcode ? "Yes" : "No"}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

type TestMethodsPanelProps = { items: TestMethodRow[] };

export function TestMethodsPanel({ items }: TestMethodsPanelProps) {
  if (items.length === 0) {
    return (
      <SetupEmptyState
        title="No test methods"
        description="Reference test methods are seeded per tenant. Import services to auto-create methods."
      />
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium">{row.method}</td>
                <td className="px-4 py-3 text-slate-600">{row.department}</td>
                <td className="px-4 py-3 text-slate-600">{row.branchCode ?? "All branches"}</td>
                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

type ReportingMethodsPanelProps = { items: ReportingMethodRow[] };

export function ReportingMethodsPanel({ items }: ReportingMethodsPanelProps) {
  if (items.length === 0) {
    return (
      <SetupEmptyState
        title="No reporting methods"
        description="Host reporting methods are available after catalog seed."
      />
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium">{row.method}</td>
                <td className="px-4 py-3 text-slate-600">{row.description}</td>
                <td className="px-4 py-3"><ScopeBadge scope={row.scope} /></td>
                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
