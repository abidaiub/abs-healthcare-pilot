"use client";

import { useState } from "react";
import { Badge, Button, Card, CardBody } from "@/components/ui";
import { SAMPLE_COLLECTION_QUEUE } from "@/lib/diagnostic-data";

export function LabelPrintPanel({ branchCode }: { branchCode: string }) {
  const [selectedId, setSelectedId] = useState(SAMPLE_COLLECTION_QUEUE[0].sampleId);
  const sample =
    SAMPLE_COLLECTION_QUEUE.find((s) => s.sampleId === selectedId) ??
    SAMPLE_COLLECTION_QUEUE[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Pending labels</h2>
        </div>
        <CardBody className="space-y-3">
          {SAMPLE_COLLECTION_QUEUE.map((item) => (
            <button
              key={item.sampleId}
              type="button"
              onClick={() => setSelectedId(item.sampleId)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${
                selectedId === item.sampleId
                  ? "border-teal-300 bg-teal-50/40"
                  : "border-slate-200 hover:border-teal-300 hover:bg-teal-50/40"
              }`}
            >
              <div>
                <p className="font-medium text-slate-900">{item.patientName}</p>
                <p className="text-sm text-slate-500">
                  {item.orderNo} · {item.tests.join(", ")}
                </p>
              </div>
              <div className="text-right">
                <Badge
                  variant={item.printStatus === "Printed" ? "success" : "warning"}
                >
                  {item.printStatus ?? "Not Printed"}
                </Badge>
                <p className="mt-1 text-sm font-medium text-teal-700">
                  {item.sampleId}
                </p>
              </div>
            </button>
          ))}
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Tube label preview
            </h2>
            <Badge
              variant={sample.printStatus === "Printed" ? "success" : "warning"}
            >
              {sample.printStatus ?? "Not Printed"}
            </Badge>
          </div>
        </div>
        <CardBody>
          <dl className="mb-4 grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-slate-500">Patient ID</dt>
              <dd className="font-mono font-medium text-slate-900">
                {sample.patientId}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Order no</dt>
              <dd className="font-mono font-medium text-slate-900">
                {sample.orderNo}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Sample no</dt>
              <dd className="font-mono font-medium text-slate-900">
                {sample.sampleNo}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Barcode no</dt>
              <dd className="font-mono font-medium text-slate-900">
                {sample.barcodeNo}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500">Department</dt>
              <dd className="font-medium text-slate-900">Laboratory</dd>
            </div>
          </dl>

          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-4 font-mono text-xs">
            <div className="mb-3 flex h-12 items-center justify-center bg-slate-900 text-[10px] tracking-[0.3em] text-white">
              ||| {sample.barcodeNo} |||
            </div>
            <p className="font-semibold text-slate-900">{sample.patientName}</p>
            <p className="mt-1">Patient ID: {sample.patientId}</p>
            <p className="mt-1">Test: {sample.tests.join(", ")}</p>
            <p className="mt-1">Tube: {sample.tubeColor}</p>
            <p className="mt-1">Collected: 18-Jun-2026 09:30</p>
            <p className="mt-1">Branch: {branchCode}</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center border border-slate-300 bg-slate-100 text-[8px] text-slate-500">
                QR
              </div>
              <p className="text-[10px] text-slate-500">
                QR code placeholder — scan for sample traceability
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="button" className="flex-1">
              Print label
            </Button>
            <Button type="button" variant="secondary" className="flex-1">
              Print all
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
