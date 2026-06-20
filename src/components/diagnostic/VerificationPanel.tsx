"use client";

import { useState } from "react";
import { Badge, Button, Card, CardBody, Input, Select, Textarea } from "@/components/ui";
import { VERIFICATION_QUEUE } from "@/lib/diagnostic-data";

const VERIFICATION_STATUSES = [
  "On Hold",
  "Escalated",
  "Verified",
  "Rejected",
  "Verification Pending",
] as const;

const CHECKLIST_ITEMS = [
  "Patient Identity Confirmed",
  "Sample Integrity Verified",
  "Delta Check Reviewed",
  "QC Passed",
] as const;

function statusVariant(status: string) {
  if (status === "Verified") return "success" as const;
  if (status === "Rejected") return "danger" as const;
  if (status === "Escalated" || status === "Critical Value") return "danger" as const;
  if (status === "On Hold") return "warning" as const;
  return "info" as const;
}

export function VerificationPanel() {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    "Patient Identity Confirmed": false,
    "Sample Integrity Verified": false,
    "Delta Check Reviewed": false,
    "QC Passed": false,
  });

  function toggleChecklist(item: string) {
    setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {VERIFICATION_STATUSES.map((status) => (
          <Badge key={status} variant={statusVariant(status)}>
            {status}
          </Badge>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Result ID</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Test panel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Delta check</th>
                <th className="px-4 py-3">Critical</th>
                <th className="px-4 py-3">Entered by</th>
              </tr>
            </thead>
            <tbody>
              {VERIFICATION_QUEUE.map((item) => (
                <tr key={item.resultId} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-teal-700">
                    {item.resultId}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.orderNo}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {item.patientName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.testPanel}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.deltaCheckReady ? "info" : "default"}>
                      {item.deltaCheckReady ? "Ready" : "N/A"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.criticalValue ? "danger" : "success"}>
                      {item.criticalValue ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.enteredBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Verification review
          </h2>
        </div>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Verified by"
              defaultValue="Dr. Mahmuda Khatun (DR-1014)"
              readOnly
            />
            <Select label="Verification level" defaultValue="Level 2 — Pathologist">
              <option>Level 1 — Technologist</option>
              <option>Level 2 — Pathologist</option>
              <option>Level 3 — Consultant</option>
            </Select>
            <Select label="Critical notification status" defaultValue="Notified">
              <option>Pending</option>
              <option>Notified</option>
              <option>Acknowledged</option>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4 text-sm">
              <p className="font-medium text-slate-900">
                Rafiqul Islam — Complete Blood Count
              </p>
              <p className="mt-1 text-slate-600">
                Hemoglobin 14.1 g/dL · WBC 7.2 · Platelet 220
              </p>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm">
              <p className="font-medium text-rose-900">Critical value alert</p>
              <p className="mt-1 text-rose-700">
                Fatima Begum — FBS 18.2 mmol/L
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">
              Verification checklist
            </p>
            <div className="mt-3 space-y-2">
              {CHECKLIST_ITEMS.map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={checklist[item] ?? false}
                    onChange={() => toggleChecklist(item)}
                    className="rounded border-slate-300"
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <Textarea
            label="Verification comments"
            rows={3}
            placeholder="Verification notes..."
          />
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            E-signature readiness: verifier signature block reserved for production
            signing service.
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button">Approve</Button>
            <Button type="button" variant="secondary">
              Reject
            </Button>
            <Button type="button" variant="secondary">
              Escalate
            </Button>
            <Button type="button" variant="ghost">
              Place on hold
            </Button>
            <Button type="button" variant="ghost">
              Send for correction
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
