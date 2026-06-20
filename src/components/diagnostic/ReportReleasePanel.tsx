"use client";

import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import { REPORT_RELEASE_QUEUE } from "@/lib/diagnostic-data";

const GOVERNANCE_BADGES = [
  "Billing Hold",
  "Quality Hold",
  "Release Ready",
  "Released",
  "Portal Published",
] as const;

function governanceVariant(status: string) {
  if (status === "Release Ready" || status === "Released") return "success" as const;
  if (status === "Portal Published") return "info" as const;
  if (status === "Billing Hold" || status === "Quality Hold") return "warning" as const;
  return "default" as const;
}

export function ReportReleasePanel({ branchCode }: { branchCode: string }) {
  const preview = REPORT_RELEASE_QUEUE[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {GOVERNANCE_BADGES.map((badge) => (
          <Badge key={badge} variant={governanceVariant(badge)}>
            {badge}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Pending release</p>
            <p className="mt-1 text-3xl font-semibold text-amber-700">1</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Released today</p>
            <p className="mt-1 text-3xl font-semibold text-emerald-700">1</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Blocked reports</p>
            <p className="mt-1 text-3xl font-semibold text-rose-700">1</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Report no</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Tests</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Governance</th>
                  <th className="px-4 py-3">Verified by</th>
                  <th className="px-4 py-3">Portal</th>
                </tr>
              </thead>
              <tbody>
                {REPORT_RELEASE_QUEUE.map((item) => (
                  <tr key={item.reportNo} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-teal-700">
                      {item.reportNo}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.orderNo}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {item.patientName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.tests.join(", ")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={item.status === "Released" ? "success" : "warning"}
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={governanceVariant(item.governanceStatus)}>
                        {item.governanceStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.verifiedBy}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.portalReleased ? "success" : "default"}>
                        {item.portalReleased ? "Released" : "Pending"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                Release options
              </h2>
            </div>
            <CardBody className="space-y-4">
              <Select label="Delivery method" defaultValue="Print + Portal">
                <option>Print + Portal</option>
                <option>Print only</option>
                <option>Portal only</option>
                <option>WhatsApp</option>
              </Select>
              <Select label="Identity verification" defaultValue="MRN + Mobile OTP">
                <option>MRN + Mobile OTP</option>
                <option>NID verification</option>
                <option>In-person ID check</option>
              </Select>
              <Input
                label="Reprint reason"
                placeholder="Required for reprint audit..."
              />
            </CardBody>
          </Card>

          <Card>
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                Report preview
              </h2>
            </div>
            <CardBody>
              <div className="relative rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                  <span className="rotate-[-25deg] text-5xl font-bold uppercase tracking-widest text-slate-100">
                    DRAFT
                  </span>
                </div>
                <div className="relative border-b border-slate-200 pb-3 text-center">
                  <p className="font-semibold text-slate-900">
                    Al Baraka Medical Group
                  </p>
                  <p className="text-xs text-slate-500">
                    Dhaka Central Hospital · {branchCode}
                  </p>
                </div>
                <div className="relative mt-4 space-y-1">
                  <p>
                    <span className="font-medium">Patient:</span> {preview.patientName}
                  </p>
                  <p>
                    <span className="font-medium">Report:</span>{" "}
                    {preview.tests.join(", ")}
                  </p>
                  <p>
                    <span className="font-medium">Verified by:</span>{" "}
                    {preview.verifiedBy}
                  </p>
                </div>
                <div className="relative mt-6 border-t border-slate-200 pt-4">
                  <p className="text-xs text-slate-500">Doctor / signature block</p>
                  <div className="mt-2 h-10 border-b border-slate-300" />
                </div>
                <div className="relative mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>QR: {preview.qrCode}</span>
                  <span>Footer template</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase tracking-wider">
                <div className="rounded border border-slate-200 bg-slate-50 py-2 text-slate-400">
                  DRAFT
                </div>
                <div className="rounded border border-amber-200 bg-amber-50 py-2 text-amber-700">
                  REPRINT
                </div>
                <div className="rounded border border-violet-200 bg-violet-50 py-2 text-violet-700">
                  AMENDED
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button type="button">Print</Button>
                <Button type="button" variant="secondary">
                  PDF
                </Button>
                <Button type="button" variant="secondary">
                  Release to portal
                </Button>
                <Button type="button" variant="ghost">
                  Reprint audit
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
