"use client";

import { useState } from "react";
import { Badge, Button, Card, CardBody, Input, Textarea } from "@/components/ui";
import { CBC_PARAMETERS } from "@/lib/diagnostic-data";
import { PATIENTS } from "@/lib/sample-data";

const RESULT_LIFECYCLE = [
  "Draft",
  "Entered",
  "Validated",
  "Verification Pending",
] as const;

export function ManualResultEntryPanel() {
  const [sampleQuery, setSampleQuery] = useState("SMP-260618-003");
  const [resultStatus, setResultStatus] = useState<(typeof RESULT_LIFECYCLE)[number]>(
    "Entered",
  );
  const patient = PATIENTS.find((p) => p.id === "PT-260003");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {RESULT_LIFECYCLE.map((status) => (
          <Badge
            key={status}
            variant={
              status === resultStatus
                ? "info"
                : status === "Validated"
                  ? "success"
                  : "default"
            }
          >
            {status}
          </Badge>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Sample search</h2>
          </div>
          <CardBody className="space-y-4">
            <Input
              label="Sample ID / order no"
              value={sampleQuery}
              onChange={(e) => setSampleQuery(e.target.value)}
            />
            {patient && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <p className="font-semibold text-slate-900">{patient.name}</p>
                <p className="mt-1 text-slate-600">
                  {patient.id} · {patient.gender} · {patient.age} yrs
                </p>
                <p className="mt-1 text-slate-600">Order: ORD-20260618-003</p>
                <p className="mt-1 text-slate-600">Panel: Complete Blood Count</p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">
              Parameter result entry
            </h2>
          </div>
          <CardBody>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2">Parameter</th>
                  <th className="py-2">Result</th>
                  <th className="py-2">Previous result</th>
                  <th className="py-2">Delta check</th>
                  <th className="py-2">Unit</th>
                  <th className="py-2">Reference range</th>
                  <th className="py-2">Flag</th>
                </tr>
              </thead>
              <tbody>
                {CBC_PARAMETERS.map((param) => (
                  <tr key={param.name} className="border-b border-slate-100">
                    <td className="py-3 font-medium text-slate-900">{param.name}</td>
                    <td className="py-3">
                      <Input defaultValue={param.value} className="max-w-[120px]" />
                    </td>
                    <td className="py-3 text-slate-600">
                      {param.previousResult ?? "—"}
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          param.deltaCheck === "Critical"
                            ? "danger"
                            : param.deltaCheck === "Significant"
                              ? "warning"
                              : "success"
                        }
                      >
                        {param.deltaCheck ?? "Normal"}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-600">{param.unit}</td>
                    <td className="py-3 text-slate-600">{param.referenceRange}</td>
                    <td className="py-3">
                      <Badge
                        variant={
                          param.flag === "Critical"
                            ? "danger"
                            : param.flag === "High" || param.flag === "Low"
                              ? "warning"
                              : "success"
                        }
                      >
                        {param.flag ?? "Normal"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Card className="mt-4 border-rose-200 bg-rose-50/50">
              <CardBody className="text-sm">
                <p className="font-semibold text-rose-900">
                  Critical notification panel
                </p>
                <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div>
                    <dt className="text-rose-700">Notified to</dt>
                    <dd className="font-medium text-slate-900">
                      Dr. Shafiqul Islam (DR-1001)
                    </dd>
                  </div>
                  <div>
                    <dt className="text-rose-700">Notified by</dt>
                    <dd className="font-medium text-slate-900">
                      Nipa Akter (EMP-302)
                    </dd>
                  </div>
                  <div>
                    <dt className="text-rose-700">Notification time</dt>
                    <dd className="font-medium text-slate-900">
                      18-Jun-2026 11:45 AM
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-rose-700">
                  UI placeholder — no notification rules implemented.
                </p>
              </CardBody>
            </Card>

            <div className="mt-4">
              <Textarea label="Comment" rows={3} placeholder="Technologist comment..." />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setResultStatus("Draft")}
              >
                Save draft
              </Button>
              <Button
                type="button"
                onClick={() => setResultStatus("Validated")}
              >
                Validate &amp; submit
              </Button>
              <Button type="button">Submit for verification</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
