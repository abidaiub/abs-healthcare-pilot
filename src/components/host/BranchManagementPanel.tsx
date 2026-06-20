"use client";

import Link from "next/link";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import type { SaasTenant } from "@/lib/saas-foundation-data";

export function BranchManagementPanel({ tenant }: { tenant: SaasTenant }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {tenant.name} ({tenant.code}) — {tenant.branches.length} branches
        </p>
        <Link href={`/host/tenants/${tenant.id}`}>
          <Button type="button" variant="secondary">Back to tenant</Button>
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Branch code</th>
                <th className="px-4 py-3">Branch name</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Branch type</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {tenant.branches.map((branch) => (
                <tr key={branch.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-mono font-medium text-teal-700">{branch.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{branch.name}</td>
                  <td className="px-4 py-3 text-slate-600">{branch.address}</td>
                  <td className="px-4 py-3 text-slate-600">{branch.city}</td>
                  <td className="px-4 py-3 text-slate-600">{branch.district}</td>
                  <td className="px-4 py-3 text-slate-600">{branch.phone}</td>
                  <td className="px-4 py-3 text-slate-600">{branch.email}</td>
                  <td className="px-4 py-3 text-slate-600">{branch.branchType}</td>
                  <td className="px-4 py-3">
                    <Badge variant={branch.status === "Active" ? "success" : "default"}>
                      {branch.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <p className="text-sm font-semibold text-slate-900">Add / edit branch (mockup)</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Branch code" placeholder="BR-DHK-01" />
            <Input label="Branch name" placeholder="Dhaka Central Hospital" />
            <Input label="Address" placeholder="12/A Dhanmondi, Dhaka 1209" />
            <Input label="City" placeholder="Dhaka" />
            <Input label="District" placeholder="Dhaka" />
            <Input label="Phone" placeholder="+880 17 0000 0001" />
            <Input label="Email" placeholder="dhaka@albarakamedical.com" />
            <Select label="Branch type" defaultValue="Hospital">
              <option>Hospital</option>
              <option>Diagnostic</option>
              <option>Clinic</option>
              <option>Collection Center</option>
            </Select>
            <Select label="Status" defaultValue="Active">
              <option>Active</option>
              <option>Inactive</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary">Cancel</Button>
            <Button type="button">Save branch</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
