"use client";

import Link from "next/link";
import { Badge, Button, Card, CardBody, Select } from "@/components/ui";
import { LIS_QUEUE } from "@/lib/diagnostic-data";

function statusVariant(status: string) {
  if (status === "Result Received") return "success" as const;
  if (status === "Error") return "danger" as const;
  if (status === "Sent to Analyzer") return "info" as const;
  if (status === "Manual Fallback") return "warning" as const;
  return "default" as const;
}

function tatVariant(status: string) {
  if (status === "On Time") return "success" as const;
  if (status === "At Risk") return "warning" as const;
  return "danger" as const;
}

const DEPARTMENT_QUEUES = [
  { department: "Hematology", pending: 4, atRisk: 1 },
  { department: "Biochemistry", pending: 6, atRisk: 2 },
  { department: "Immunology", pending: 2, atRisk: 0 },
  { department: "Clinical Pathology", pending: 1, atRisk: 0 },
];

export function LisWorklistPanel() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary">
          Batch import
        </Button>
        <Link href="/lab/result-entry">
          <Button type="button">Result entry shortcut</Button>
        </Link>
      </div>

      <Card>
        <CardBody className="grid gap-4 lg:grid-cols-4">
          <Select label="Import channel" defaultValue="All">
            <option>All</option>
            <option>HL7</option>
            <option>ASTM</option>
            <option>Middleware</option>
            <option>Manual</option>
            <option>CSV</option>
            <option>API</option>
          </Select>
          <Select label="LIS status" defaultValue="All">
            <option>All</option>
            <option>Pending Send</option>
            <option>Sent to Analyzer</option>
            <option>Result Received</option>
            <option>Error</option>
            <option>Manual Fallback</option>
          </Select>
          <Select label="Interface audit" defaultValue="All">
            <option>All</option>
            <option>Pending</option>
            <option>Acknowledged</option>
            <option>Failed</option>
          </Select>
          <div className="flex items-end">
            <Button type="button" variant="secondary" className="w-full">
              Refresh queue
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Sample ID</th>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Patient name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Test</th>
                  <th className="px-4 py-3">Received time</th>
                  <th className="px-4 py-3">TAT status</th>
                  <th className="px-4 py-3">Analyzer code</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">LIS status</th>
                  <th className="px-4 py-3">Audit</th>
                  <th className="px-4 py-3">Raw preview</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {LIS_QUEUE.map((item, index) => (
                  <tr
                    key={`${item.sampleId}-${item.testCode}-${index}`}
                    className="border-b border-slate-100"
                  >
                    <td className="px-4 py-3 font-medium text-teal-700">
                      {item.sampleId}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.orderId}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {item.patientName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.department}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{item.testCode}</p>
                      <p className="text-xs text-slate-500">{item.testName}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.receivedTime}</td>
                    <td className="px-4 py-3">
                      <Badge variant={tatVariant(item.tatStatus)}>
                        {item.tatStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.analyzerMappingCode}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.importChannel}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(item.lisStatus)}>
                        {item.lisStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          item.interfaceAuditStatus === "Failed"
                            ? "danger"
                            : item.interfaceAuditStatus === "Acknowledged"
                              ? "success"
                              : "warning"
                        }
                      >
                        {item.interfaceAuditStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {item.rawResultPreview ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {(item.lisStatus === "Error" ||
                          item.lisStatus === "Manual Fallback") && (
                          <>
                            <Button type="button" className="px-2 py-1 text-xs">
                              Retry
                            </Button>
                            <Link href="/lab/result-entry">
                              <Button
                                type="button"
                                variant="secondary"
                                className="px-2 py-1 text-xs"
                              >
                                Manual entry
                              </Button>
                            </Link>
                          </>
                        )}
                        {item.lisStatus === "Pending Send" && (
                          <Button type="button" className="px-2 py-1 text-xs">
                            Send
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
            <h2 className="text-base font-semibold text-slate-900">
              Department queue
            </h2>
          </div>
          <CardBody className="space-y-3">
            {DEPARTMENT_QUEUES.map((queue) => (
              <div
                key={queue.department}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <p className="font-medium text-slate-900">{queue.department}</p>
                <div className="mt-1 flex gap-3 text-xs text-slate-600">
                  <span>Pending: {queue.pending}</span>
                  <span className="text-amber-700">At risk: {queue.atRisk}</span>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
