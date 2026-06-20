"use client";

import { useState } from "react";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import { TENANT_TEST_SETUP } from "@/lib/diagnostic-data";

export function TenantTestSetupPanel({
  branchCode,
}: {
  branchCode: string;
}) {
  const [search, setSearch] = useState("");

  const filtered = TENANT_TEST_SETUP.filter(
    (test) =>
      test.serviceName.toLowerCase().includes(search.toLowerCase()) ||
      test.serviceCode.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <Input
              label="Search tenant test"
              placeholder="Search imported host test..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="button">Import from host master</Button>
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Host price</th>
                <th className="px-4 py-3">Tenant price</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">TAT</th>
                <th className="px-4 py-3">Collection</th>
                <th className="px-4 py-3">Report template</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((test) => (
                <tr key={test.serviceCode} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-teal-700">
                    {test.serviceCode}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {test.serviceName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    BDT {test.basePrice}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    BDT {test.tenantPrice}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={test.discountEligible ? "info" : "default"}>
                      {test.discountEligible ? "Eligible" : "No"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{test.tatHours}h</td>
                  <td className="px-4 py-3 text-slate-600">
                    {test.sampleCollectionRequired ? "Required" : "No"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {test.reportTemplate}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {test.branchAvailability.includes(branchCode)
                      ? branchCode
                      : "Not assigned"}
                  </td>
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

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Tenant test configuration
          </h2>
        </div>
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select label="Host test" defaultValue="CBC">
            {TENANT_TEST_SETUP.map((t) => (
              <option key={t.serviceCode} value={t.serviceCode}>
                {t.serviceCode} — {t.serviceName}
              </option>
            ))}
          </Select>
          <Input label="Tenant price (BDT)" defaultValue="400" />
          <Select label="Discount eligibility" defaultValue="Yes">
            <option>Yes</option>
            <option>No</option>
          </Select>
          <Input label="Delivery time / TAT (hours)" defaultValue="4" />
          <Select label="Sample collection required" defaultValue="Yes">
            <option>Yes</option>
            <option>No</option>
          </Select>
          <Input label="Report template selection" defaultValue="Hematology Panel Standard" />
          <Select label="Branch availability" defaultValue={branchCode}>
            <option value="BR-DHK-01">BR-DHK-01</option>
            <option value="BR-CTG-02">BR-CTG-02</option>
            <option value="BR-BAR-03">BR-BAR-03</option>
          </Select>
          <Select label="Status" defaultValue="Active">
            <option>Active</option>
            <option>Inactive</option>
          </Select>
        </CardBody>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Button type="button" variant="secondary">Cancel</Button>
          <Button type="button">Save tenant setup</Button>
        </div>
      </Card>
    </div>
  );
}
