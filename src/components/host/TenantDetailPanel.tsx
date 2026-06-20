"use client";

import Link from "next/link";
import { Badge, Button, Card, CardBody, CardHeader, Input, Select } from "@/components/ui";
import {
  formatBdt,
  getStatusBadgeVariant,
  type SaasTenant,
} from "@/lib/saas-foundation-data";

function LimitField({
  label,
  value,
  type = "number",
}: {
  label: string;
  value: string | number | boolean;
  type?: "number" | "boolean";
}) {
  if (type === "boolean") {
    return (
      <Select label={label} value={value ? "Yes" : "No"} disabled>
        <option>Yes</option>
        <option>No</option>
      </Select>
    );
  }
  return (
    <Input label={label} value={String(value)} readOnly className="bg-slate-50" />
  );
}

export function TenantDetailPanel({ tenant }: { tenant: SaasTenant }) {
  const sub = tenant.subscription;
  const limits = tenant.usageLimits;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={getStatusBadgeVariant(tenant.tenantStatus)}>
          {tenant.tenantStatus}
        </Badge>
        <Badge variant="info">{tenant.onboardingStatus}</Badge>
        <Badge>{tenant.deployment.mode} · {tenant.deployment.status}</Badge>
        {sub.dueAmount > 0 && (
          <Badge variant="warning">{formatBdt(sub.dueAmount)} due</Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/host/tenants/${tenant.id}/edit`}>
          <Button type="button" variant="secondary">Edit tenant</Button>
        </Link>
        <Link href={`/host/tenants/${tenant.id}/branches`}>
          <Button type="button" variant="secondary">Manage branches</Button>
        </Link>
        <Button type="button" variant="secondary">Assign admin</Button>
        <Button type="button" variant="secondary">
          {tenant.tenantStatus === "Suspended" ? "Activate" : "Suspend"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Tenant profile" description={`${tenant.code} — ${tenant.legalName}`} />
          <CardBody className="grid gap-3 text-sm sm:grid-cols-2">
            <div><span className="text-slate-500">Contact</span><p className="font-medium">{tenant.contactPerson}</p></div>
            <div><span className="text-slate-500">Email</span><p className="font-medium">{tenant.contactEmail}</p></div>
            <div><span className="text-slate-500">Mobile</span><p className="font-medium">{tenant.contactMobile}</p></div>
            <div><span className="text-slate-500">Location</span><p className="font-medium">{tenant.city}, {tenant.district}</p></div>
            <div><span className="text-slate-500">Primary admin</span><p className="font-medium">{tenant.primaryAdmin.name}</p></div>
            <div><span className="text-slate-500">Admin email</span><p className="font-medium">{tenant.primaryAdmin.email}</p></div>
            <div><span className="text-slate-500">App URL</span><p className="font-mono text-teal-700">{tenant.deployment.appUrl}</p></div>
            <div><span className="text-slate-500">Branches</span><p className="font-medium">{tenant.branches.length} configured</p></div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Tenant subscription" description="Billing and package assignment" />
          <CardBody className="space-y-4">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div><span className="text-slate-500">Current package</span><p className="font-medium">{sub.packageName}</p></div>
              <div><span className="text-slate-500">Billing cycle</span><p className="font-medium">{sub.billingCycle}</p></div>
              <div><span className="text-slate-500">Start date</span><p className="font-medium">{sub.startDate}</p></div>
              <div><span className="text-slate-500">End date</span><p className="font-medium">{sub.endDate}</p></div>
              <div><span className="text-slate-500">Next billing</span><p className="font-medium">{sub.nextBillingDate}</p></div>
              <div>
                <span className="text-slate-500">Status</span>
                <p><Badge variant={getStatusBadgeVariant(sub.status)}>{sub.status}</Badge></p>
              </div>
              <div><span className="text-slate-500">Due amount</span><p className="font-semibold text-amber-700">{formatBdt(sub.dueAmount)}</p></div>
              <div><span className="text-slate-500">Grace period</span><p className="font-medium">{sub.gracePeriodDays} days</p></div>
              <div><span className="text-slate-500">Auto renew</span><p className="font-medium">{sub.autoRenew ? "Yes" : "No"}</p></div>
              {sub.lastPaymentDate && (
                <div><span className="text-slate-500">Last payment</span><p className="font-medium">{formatBdt(sub.lastPaymentAmount ?? 0)} on {sub.lastPaymentDate}</p></div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Button type="button" variant="secondary">Change package</Button>
              <Button type="button" variant="secondary">Renew</Button>
              <Button type="button" variant="secondary">Suspend</Button>
              <Button type="button">Record payment</Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Tenant module assignment" description="Enable/disable modules per tenant. OPD/IPD/Pharmacy disabled by default for diagnostic-first." />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Enabled</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Enabled from</th>
                <th className="px-4 py-3">Enabled to</th>
              </tr>
            </thead>
            <tbody>
              {tenant.modules.map((mod) => (
                <tr key={mod.moduleCode} className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{mod.moduleCode}</p>
                    <p className="text-xs text-slate-500">{mod.moduleName}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{mod.moduleGroup}</td>
                  <td className="px-4 py-3">
                    <Badge variant={mod.enabled ? "success" : "default"}>
                      {mod.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusBadgeVariant(mod.status)}>{mod.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{mod.enabledFrom}</td>
                  <td className="px-4 py-3 text-slate-600">{mod.enabledTo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Tenant usage limits" description="Package defaults with host overrides" />
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <LimitField label="Max branches" value={limits.maxBranches} />
          <LimitField label="Max users" value={limits.maxUsers} />
          <LimitField label="Max patients / month" value={limits.maxPatientsPerMonth} />
          <LimitField label="Max orders / month" value={limits.maxOrdersPerMonth} />
          <LimitField label="Max reports / month" value={limits.maxReportsPerMonth} />
          <LimitField label="Max storage (GB)" value={limits.maxStorageGb} />
          <LimitField label="Max SMS" value={limits.maxSms} />
          <LimitField label="Max WhatsApp" value={limits.maxWhatsapp} />
          <LimitField label="Max API calls" value={limits.maxApiCalls} />
          <LimitField label="Allow custom domain" value={limits.allowCustomDomain} type="boolean" />
          <LimitField label="Allow API access" value={limits.allowApiAccess} type="boolean" />
          <LimitField label="Allow patient portal" value={limits.allowPatientPortal} type="boolean" />
          <LimitField label="Allow multi branch" value={limits.allowMultiBranch} type="boolean" />
          <LimitField label="Allow report branding" value={limits.allowReportBranding} type="boolean" />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Status history" description="Tenant lifecycle audit trail" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Old status</th>
                <th className="px-4 py-3">New status</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Changed by</th>
                <th className="px-4 py-3">Changed at</th>
              </tr>
            </thead>
            <tbody>
              {tenant.statusHistory.map((entry, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-600">{entry.oldStatus}</td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusBadgeVariant(entry.newStatus)}>{entry.newStatus}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{entry.reason}</td>
                  <td className="px-4 py-3 text-slate-600">{entry.changedBy}</td>
                  <td className="px-4 py-3 text-slate-600">{entry.changedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
