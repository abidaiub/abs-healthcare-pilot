"use client";

import { useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Input, Select } from "@/components/ui";
import {
  SUBSCRIPTION_PACKAGES,
  formatBdt,
  type SubscriptionPackage,
} from "@/lib/saas-foundation-data";

export function SubscriptionPackagePanel() {
  const [selected, setSelected] = useState<SubscriptionPackage>(SUBSCRIPTION_PACKAGES[1]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Package code</th>
                <th className="px-4 py-3">Package name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Monthly fee</th>
                <th className="px-4 py-3">Yearly fee</th>
                <th className="px-4 py-3">Branches</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Storage GB</th>
                <th className="px-4 py-3">Support</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {SUBSCRIPTION_PACKAGES.map((pkg) => (
                <tr
                  key={pkg.code}
                  className={`cursor-pointer border-b border-slate-100 hover:bg-teal-50/50 ${
                    selected.code === pkg.code ? "bg-teal-50" : ""
                  }`}
                  onClick={() => setSelected(pkg)}
                >
                  <td className="px-4 py-3 font-mono font-medium text-teal-700">{pkg.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{pkg.name}</td>
                  <td className="px-4 py-3 text-slate-600">{pkg.type}</td>
                  <td className="px-4 py-3 text-slate-600">{formatBdt(pkg.monthlyFee)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatBdt(pkg.yearlyFee)}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{pkg.includedBranches}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{pkg.includedUsers}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{pkg.includedOrders.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{pkg.storageGb}</td>
                  <td className="px-4 py-3 text-slate-600">{pkg.supportLevel}</td>
                  <td className="px-4 py-3">
                    <Badge variant={pkg.status === "Active" ? "success" : "default"}>{pkg.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Package form" description={`Editing ${selected.name} — mockup only`} />
        <CardBody className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Package code" defaultValue={selected.code} readOnly className="bg-slate-50" />
            <Input label="Package name" defaultValue={selected.name} />
            <Select label="Type" defaultValue={selected.type}>
              <option>Starter</option>
              <option>Professional</option>
              <option>Enterprise</option>
              <option>Custom</option>
            </Select>
            <Input label="Monthly fee (BDT)" defaultValue={String(selected.monthlyFee)} />
            <Input label="Yearly fee (BDT)" defaultValue={String(selected.yearlyFee)} />
            <Select label="Status" defaultValue={selected.status}>
              <option>Active</option>
              <option>Inactive</option>
            </Select>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Feature flags</p>
            <div className="flex flex-wrap gap-2">
              {selected.featureFlags.map((flag) => (
                <Badge key={flag} variant="info">{flag}</Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-slate-700">Included limits</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="Included branches" defaultValue={String(selected.includedBranches)} />
              <Input label="Included users" defaultValue={String(selected.includedUsers)} />
              <Input label="Included orders / month" defaultValue={String(selected.includedOrders)} />
              <Input label="Storage (GB)" defaultValue={String(selected.storageGb)} />
              <Input label="Support level" defaultValue={selected.supportLevel} />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary">Cancel</Button>
            <Button type="button">Save package</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
