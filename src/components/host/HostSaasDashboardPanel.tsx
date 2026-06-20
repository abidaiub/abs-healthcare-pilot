"use client";

import Link from "next/link";
import { Badge, Button, Card, CardBody, StatCard } from "@/components/ui";
import {
  SAAS_TENANTS,
  formatBdt,
  getHostDashboardKpis,
} from "@/lib/saas-foundation-data";

export function HostSaasDashboardPanel() {
  const kpis = getHostDashboardKpis();
  const dueTenants = SAAS_TENANTS.filter((t) => t.subscription.dueAmount > 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
          Layer 1 — SaaS Foundation
        </p>
        <p className="mt-1 text-sm text-violet-900">
          Host context only. Tenant, subscription, module, and audit management
          mockups — no backend.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total tenants" value={kpis.totalTenants} hint="Provisioned" accent="teal" />
        <StatCard label="Active tenants" value={kpis.activeTenants} hint="Live subscriptions" accent="blue" />
        <StatCard label="Trial tenants" value={kpis.trialTenants} hint="Evaluation period" accent="violet" />
        <StatCard label="Suspended tenants" value={kpis.suspendedTenants} hint="Payment / policy hold" accent="amber" />
        <StatCard label="Monthly revenue" value={formatBdt(kpis.monthlyRevenue)} hint="Last billing cycle" accent="teal" />
        <StatCard label="Due amount" value={formatBdt(kpis.dueAmount)} hint="Outstanding invoices" accent="amber" />
        <StatCard label="Enabled modules" value={kpis.enabledModules} hint="Global registry" accent="blue" />
        <StatCard label="Active subscriptions" value={kpis.activeSubscriptions} hint="Active + overdue" accent="violet" />
      </div>

      <Card>
        <CardBody className="flex flex-wrap gap-3">
          <Link href="/host/tenants/new">
            <Button type="button">Create tenant</Button>
          </Link>
          <Link href="/host/subscription-packages">
            <Button type="button" variant="secondary">Assign package</Button>
          </Link>
          <Link href="/host/modules">
            <Button type="button" variant="secondary">Enable modules</Button>
          </Link>
          <Link href="/host/tenants?filter=due">
            <Button type="button" variant="secondary">View due tenants</Button>
          </Link>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody className="space-y-3">
            <p className="text-sm font-semibold text-slate-900">Tenant overview</p>
            {SAAS_TENANTS.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/host/tenants/${tenant.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 transition-colors hover:border-teal-300 hover:bg-teal-50/30"
              >
                <div>
                  <p className="font-medium text-slate-900">{tenant.name}</p>
                  <p className="text-sm text-slate-500">
                    {tenant.code} · {tenant.tenantType}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={tenant.tenantStatus === "Active" ? "success" : tenant.tenantStatus === "Trial" ? "info" : "danger"}>
                    {tenant.tenantStatus}
                  </Badge>
                  {tenant.subscription.dueAmount > 0 && (
                    <Badge variant="warning">{formatBdt(tenant.subscription.dueAmount)} due</Badge>
                  )}
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <p className="text-sm font-semibold text-slate-900">Due tenants</p>
            {dueTenants.length === 0 ? (
              <p className="text-sm text-slate-500">No outstanding dues.</p>
            ) : (
              dueTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{tenant.name}</p>
                    <p className="text-sm text-slate-500">{tenant.subscription.packageName}</p>
                  </div>
                  <p className="font-semibold text-amber-800">
                    {formatBdt(tenant.subscription.dueAmount)}
                  </p>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
