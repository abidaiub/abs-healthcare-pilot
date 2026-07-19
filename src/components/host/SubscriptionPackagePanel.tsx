"use client";

import { useState } from "react";
import { Badge, Card, CardBody, CardHeader, Input, Select } from "@/components/ui";
import { formatBdt } from "@/lib/saas/format";
import type { SubscriptionPackageRow } from "@/lib/saas/types";

export function SubscriptionPackagePanel({
  packages,
}: {
  packages: SubscriptionPackageRow[];
}) {
  const [selected, setSelected] = useState<SubscriptionPackageRow>(
    packages[0] ?? {
      id: "",
      code: "",
      name: "",
      type: "",
      monthlyFee: 0,
      yearlyFee: 0,
      includedBranches: 0,
      includedUsers: 0,
      includedOrders: 0,
      storageGb: 0,
      supportLevel: "",
      status: "Inactive",
    },
  );

  if (packages.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-slate-600">
            No subscription packages found. Run <code>npm run db:seed</code> to seed packages.
          </p>
        </CardBody>
      </Card>
    );
  }

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
              {packages.map((pkg) => (
                <tr
                  key={pkg.id}
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
        <CardHeader title="Package detail" description={`${selected.name} — database-backed read view`} />
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Package code" value={selected.code} readOnly className="bg-slate-50" />
          <Input label="Package name" value={selected.name} readOnly className="bg-slate-50" />
          <Input label="Type" value={selected.type} readOnly className="bg-slate-50" />
          <Input label="Monthly fee (BDT)" value={String(selected.monthlyFee)} readOnly className="bg-slate-50" />
          <Input label="Yearly fee (BDT)" value={String(selected.yearlyFee)} readOnly className="bg-slate-50" />
          <Select label="Status" value={selected.status} disabled>
            <option>Active</option>
            <option>Inactive</option>
          </Select>
          <Input label="Included branches" value={String(selected.includedBranches)} readOnly className="bg-slate-50" />
          <Input label="Included users" value={String(selected.includedUsers)} readOnly className="bg-slate-50" />
          <Input label="Included orders / month" value={String(selected.includedOrders)} readOnly className="bg-slate-50" />
          <Input label="Storage (GB)" value={String(selected.storageGb)} readOnly className="bg-slate-50" />
          <Input label="Support level" value={selected.supportLevel} readOnly className="bg-slate-50" />
        </CardBody>
      </Card>
    </div>
  );
}
