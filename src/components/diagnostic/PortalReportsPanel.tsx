"use client";

import { useState } from "react";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import { PORTAL_REPORTS } from "@/lib/diagnostic-data";

type LoginGate = "required" | "otp" | "authenticated";

export function PortalReportsPanel() {
  const [loginGate, setLoginGate] = useState<LoginGate>("required");
  const [reportTypeFilter, setReportTypeFilter] = useState("All");
  const [doctorFilter, setDoctorFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [reportFilter, setReportFilter] = useState("");

  if (loginGate !== "authenticated") {
    return (
      <div className="space-y-6">
        <Card>
          <CardBody className="py-16 text-center">
            <Badge variant="warning">
              {loginGate === "required"
                ? "Patient Login Required"
                : "OTP Verification Required"}
            </Badge>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              {loginGate === "required"
                ? "Sign in to view your reports"
                : "Verify your identity with OTP"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Patient portal access requires authentication. This is a UI mockup
              only — no backend verification is implemented.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="grid gap-4 lg:grid-cols-3">
            <Input
              label="Mobile number"
              placeholder="+880 17 1111 0001"
              defaultValue="+880 17 1111 0001"
            />
            {loginGate === "otp" ? (
              <Input label="OTP" placeholder="Enter 6-digit OTP" />
            ) : (
              <Input
                label="Password / PIN"
                type="password"
                placeholder="Enter password"
              />
            )}
            <div className="flex items-end gap-2">
              {loginGate === "required" ? (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setLoginGate("otp")}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setLoginGate("authenticated")}
                >
                  Verify &amp; login
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const filteredReports = PORTAL_REPORTS.filter((report) => {
    if (reportTypeFilter !== "All" && report.reportType !== reportTypeFilter)
      return false;
    if (doctorFilter !== "All" && report.doctor !== doctorFilter) return false;
    if (reportFilter && !report.tests.some((t) =>
      t.toLowerCase().includes(reportFilter.toLowerCase()),
    ))
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-900">Portal dashboard</p>
            <p className="text-sm text-slate-500">Mohammad Ali · PT-260001</p>
          </div>
          <Badge variant="success">Authenticated</Badge>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="grid gap-4 lg:grid-cols-4">
          <Select
            label="Report type"
            value={reportTypeFilter}
            onChange={(e) => setReportTypeFilter(e.target.value)}
          >
            <option>All</option>
            <option>Laboratory</option>
            <option>Radiology</option>
            <option>Pathology</option>
          </Select>
          <Select
            label="Doctor"
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
          >
            <option>All</option>
            <option>Dr. Shafiqul Islam (DR-1001)</option>
            <option>Dr. Kazi Tariq (DR-1003)</option>
            <option>Dr. Mahmuda Khatun (DR-1014)</option>
          </Select>
          <Input
            label="Date filter"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <Input
            label="Report filter"
            placeholder="Search test name..."
            value={reportFilter}
            onChange={(e) => setReportFilter(e.target.value)}
          />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">My reports</h2>
          <p className="text-sm text-slate-500">Mohammad Ali · PT-260001</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Report no</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Report type</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Tests</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Released</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.reportNo} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-teal-700">
                    {report.reportNo}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{report.orderNo}</td>
                  <td className="px-4 py-3 text-slate-600">{report.reportType}</td>
                  <td className="px-4 py-3 text-slate-600">{report.doctor}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {report.tests.join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="success">{report.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{report.releasedAt}</td>
                  <td className="px-4 py-3 text-slate-600">{report.branch}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button type="button" className="px-2 py-1 text-xs">
                        View PDF
                      </Button>
                      <Button type="button" variant="secondary" className="px-2 py-1 text-xs">
                        Share report
                      </Button>
                      <Button type="button" variant="ghost" className="px-2 py-1 text-xs">
                        WhatsApp
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
