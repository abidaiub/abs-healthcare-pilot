"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, CardBody, Select, Textarea } from "@/components/ui";
import {
  SAMPLE_COLLECTION_QUEUE,
  type SampleLifecycleStatus,
} from "@/lib/diagnostic-data";

const LIFECYCLE_STATUSES: SampleLifecycleStatus[] = [
  "Ordered",
  "Pending Collection",
  "Collected",
  "Received",
  "Processing",
  "Completed",
  "Rejected",
  "Recollection Required",
];

function statusVariant(status: SampleLifecycleStatus) {
  if (status === "Collected" || status === "Received" || status === "Completed")
    return "success" as const;
  if (status === "Rejected") return "danger" as const;
  if (status === "Recollection Required" || status === "Processing")
    return "warning" as const;
  if (status === "Ordered") return "default" as const;
  return "info" as const;
}

export function SampleCollectionPanel() {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {LIFECYCLE_STATUSES.map((status) => (
          <Badge key={status} variant={statusVariant(status)}>
            {status}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Pending collection</p>
            <p className="mt-1 text-3xl font-semibold text-amber-700">2</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Collected today</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-700">2</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Rejected</p>
            <p className="mt-1 text-3xl font-semibold text-rose-700">0</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Recollection required</p>
            <p className="mt-1 text-3xl font-semibold text-orange-700">0</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Order no</th>
                <th className="px-4 py-3">Sample no</th>
                <th className="px-4 py-3">Barcode no</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Tests</th>
                <th className="px-4 py-3">Sample type</th>
                <th className="px-4 py-3">Tube / container</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Collected by</th>
                <th className="px-4 py-3">Collection time</th>
                <th className="px-4 py-3">Received by</th>
                <th className="px-4 py-3">Received at</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_COLLECTION_QUEUE.map((item) => (
                <tr key={item.sampleId} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-teal-700">{item.orderNo}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {item.sampleNo}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {item.barcodeNo}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{item.patientName}</p>
                    <p className="text-xs text-slate-500">{item.patientId}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.tests.join(", ")}</td>
                  <td className="px-4 py-3 text-slate-600">{item.sampleType}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.containerType}
                    <br />
                    <span className="text-xs">{item.tubeColor}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.collectedBy ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{item.collectedAt ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{item.receivedBy ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{item.receivedAt ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href="/lab/label-print">
                        <Button type="button" variant="ghost" className="px-2 py-1 text-xs">
                          Print label
                        </Button>
                      </Link>
                      {item.status === "Pending Collection" && (
                        <>
                          <Button type="button" className="px-2 py-1 text-xs">
                            Collect
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="px-2 py-1 text-xs"
                            onClick={() => {
                              setRejectTarget(item.sampleId);
                              setRejectModalOpen(true);
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {item.status === "Collected" && (
                        <Button type="button" variant="ghost" className="px-2 py-1 text-xs">
                          Recollect
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Lab receiving</h2>
          <p className="text-sm text-slate-500">
            Receive collected samples into laboratory — UI placeholder only.
          </p>
        </div>
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <Select label="Scan barcode" defaultValue="">
            <option value="" disabled>
              Select sample to receive
            </option>
            {SAMPLE_COLLECTION_QUEUE.filter((s) => s.status === "Collected").map(
              (item) => (
                <option key={item.sampleId} value={item.barcodeNo}>
                  {item.barcodeNo} — {item.patientName}
                </option>
              ),
            )}
          </Select>
          <div className="text-sm">
            <p className="text-slate-500">Received by</p>
            <p className="font-medium text-slate-900">Sajedur Rahman (EMP-301)</p>
          </div>
          <div className="flex items-end">
            <Button type="button" className="w-full">
              Mark received
            </Button>
          </div>
        </CardBody>
      </Card>

      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <Card className="w-full max-w-md">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                Reject sample
              </h2>
              <p className="text-sm text-slate-500">
                Sample: {rejectTarget} — modal mockup only
              </p>
            </div>
            <CardBody className="space-y-4">
              <Select label="Reject reason" defaultValue="">
                <option value="" disabled>
                  Select reason
                </option>
                <option>Insufficient volume</option>
                <option>Hemolysis</option>
                <option>Wrong tube / container</option>
                <option>Label mismatch</option>
                <option>Clotted sample</option>
              </Select>
              <Textarea
                label="Additional notes"
                rows={3}
                placeholder="Describe rejection details..."
              />
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setRejectModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="button" variant="danger">
                  Confirm reject
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
