"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { changeTenantStatusAction } from "@/app/actions/host-tenant";
import { Badge, Button, Card, CardBody, CardHeader, Input, Select } from "@/components/ui";
import { evaluateTenantOnboarding } from "@/lib/saas/onboarding";
import { formatBdt } from "@/lib/saas/format";
import { getStatusBadgeVariant } from "@/lib/saas/status-badge";
import type { TenantDetailRecord } from "@/lib/saas/types";

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

export function TenantDetailPanel({ tenant }: { tenant: TenantDetailRecord }) {
  const sub = tenant.subscription;
  const limits = tenant.usageLimits;
  const onboarding = evaluateTenantOnboarding(tenant);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function runStatusAction(
    action: "suspend" | "reactivate" | "archive" | "activate",
  ) {
    const reason =
      action === "suspend" || action === "archive"
        ? window.prompt(`Enter ${action} reason:`)
        : undefined;
    if ((action === "suspend" || action === "archive") && !reason?.trim()) return;

    startTransition(async () => {
      const result = await changeTenantStatusAction({
        tenantId: tenant.id,
        action,
        reason: reason ?? undefined,
      });
      setMessage(result.ok ? "Status updated." : result.error);
    });
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={getStatusBadgeVariant(tenant.tenantStatus)}>
          {tenant.tenantStatus}
        </Badge>
        <Badge variant="info">{tenant.onboardingStatus}</Badge>
        {!onboarding.canActivate && tenant.tenantStatus !== "Active" && (
          <Badge variant="warning">Onboarding incomplete</Badge>
        )}
        {sub && sub.dueAmount > 0 && (
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
        <Button
          type="button"
          variant="secondary"
          disabled={pending || !onboarding.canActivate}
          onClick={() => runStatusAction("activate")}
        >
          Activate tenant
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            runStatusAction(
              tenant.tenantStatus === "Suspended" ? "reactivate" : "suspend",
            )
          }
        >
          {tenant.tenantStatus === "Suspended" ? "Reactivate" : "Suspend"}
        </Button>
      </div>

      <Card>
        <CardHeader title="Onboarding workflow" description="Persisted readiness checks" />
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {onboarding.steps.map((step) => (
            <div
              key={step.id}
              className="rounded-xl border border-slate-200 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">{step.label}</p>
                <Badge
                  variant={
                    step.state === "completed"
                      ? "success"
                      : step.state === "blocked"
                        ? "danger"
                        : "warning"
                  }
                >
                  {step.state}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">{step.detail}</p>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Tenant profile" description={`${tenant.code} — ${tenant.legalName ?? tenant.name}`} />
          <CardBody className="grid gap-3 text-sm sm:grid-cols-2">
            <div><span className="text-slate-500">Contact</span><p className="font-medium">{tenant.contactPerson}</p></div>
            <div><span className="text-slate-500">Email</span><p className="font-medium">{tenant.contactEmail}</p></div>
            <div><span className="text-slate-500">Mobile</span><p className="font-medium">{tenant.contactMobile}</p></div>
            <div><span className="text-slate-500">Location</span><p className="font-medium">{tenant.city ?? "—"}, {tenant.district ?? "—"}</p></div>
            <div><span className="text-slate-500">Primary admin</span><p className="font-medium">{tenant.primaryAdmin.name}</p></div>
            <div><span className="text-slate-500">Admin email</span><p className="font-medium">{tenant.primaryAdmin.email}</p></div>
            <div><span className="text-slate-500">Branches</span><p className="font-medium">{tenant.branches.length} configured</p></div>
            <div><span className="text-slate-500">Users</span><p className="font-medium">{tenant.userCount}</p></div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Tenant subscription" description="Billing and package assignment" />
          <CardBody className="space-y-4">
            {sub ? (
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div><span className="text-slate-500">Current package</span><p className="font-medium">{sub.packageName}</p></div>
                <div><span className="text-slate-500">Billing cycle</span><p className="font-medium">{sub.billingCycle}</p></div>
                <div><span className="text-slate-500">Start date</span><p className="font-medium">{sub.subscriptionStart}</p></div>
                <div><span className="text-slate-500">End date</span><p className="font-medium">{sub.subscriptionEnd}</p></div>
                <div><span className="text-slate-500">Next billing</span><p className="font-medium">{sub.nextBillingDate}</p></div>
                <div>
                  <span className="text-slate-500">Status</span>
                  <p><Badge variant={getStatusBadgeVariant(sub.subscriptionStatus)}>{sub.subscriptionStatus}</Badge></p>
                </div>
                <div><span className="text-slate-500">Due amount</span><p className="font-semibold text-amber-700">{formatBdt(sub.dueAmount)}</p></div>
                <div><span className="text-slate-500">Grace period</span><p className="font-medium">{sub.gracePeriodDays} days</p></div>
                <div><span className="text-slate-500">Auto renew</span><p className="font-medium">{sub.autoRenew ? "Yes" : "No"}</p></div>
              </div>
            ) : (
              <p className="text-sm text-amber-700">No subscription assigned.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Usage dashboard" description="Configured limits vs measured usage" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Metric</th>
                <th className="px-4 py-3">Configured</th>
                <th className="px-4 py-3">Measured</th>
                <th className="px-4 py-3">State</th>
              </tr>
            </thead>
            <tbody>
              {tenant.usageSnapshot.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Usage limits not configured.
                  </td>
                </tr>
              ) : (
                tenant.usageSnapshot.map((row) => (
                  <tr key={row.label} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.label}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.configured} {row.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.measured === null ? "Not measured" : `${row.measured} ${row.unit}`}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          row.state === "ok"
                            ? "success"
                            : row.state === "not_measured"
                              ? "default"
                              : "warning"
                        }
                      >
                        {row.state === "not_measured" ? "Not measured" : row.state.replace("_", " ")}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Tenant module assignment" description="Database-backed module state" />
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
                <tr key={mod.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{mod.moduleCode}</p>
                    <p className="text-xs text-slate-500">{mod.moduleName}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{mod.moduleGroup}</td>
                  <td className="px-4 py-3">
                    <Badge variant={mod.isEnabled ? "success" : "default"}>
                      {mod.isEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusBadgeVariant(mod.moduleStatus)}>{mod.moduleStatus}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{mod.enabledFrom}</td>
                  <td className="px-4 py-3 text-slate-600">{mod.enabledTo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {limits && (
        <Card>
          <CardHeader title="Tenant usage limits" description="Package defaults with host overrides" />
          <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <LimitField label="Max branches" value={limits.maxBranches} />
            <LimitField label="Max users" value={limits.maxUsers} />
            <LimitField label="Max patients / month" value={limits.maxPatientsPerMonth} />
            <LimitField label="Max orders / month" value={limits.maxOrdersPerMonth} />
            <LimitField label="Max reports / month" value={limits.maxReportsPerMonth} />
            <LimitField label="Max storage (GB)" value={limits.maxStorageGb} />
            <LimitField label="Max SMS" value={limits.maxSmsPerMonth} />
            <LimitField label="Max WhatsApp" value={limits.maxWhatsappPerMonth} />
            <LimitField label="Max API calls" value={limits.maxApiCallsPerMonth} />
            <LimitField label="Allow custom domain" value={limits.allowCustomDomain} type="boolean" />
            <LimitField label="Allow API access" value={limits.allowApiAccess} type="boolean" />
            <LimitField label="Allow patient portal" value={limits.allowPatientPortal} type="boolean" />
            <LimitField label="Allow multi branch" value={limits.allowMultiBranch} type="boolean" />
            <LimitField label="Allow report branding" value={limits.allowReportBranding} type="boolean" />
          </CardBody>
        </Card>
      )}

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
              {tenant.statusHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No status history recorded yet.
                  </td>
                </tr>
              ) : (
                tenant.statusHistory.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-slate-600">{entry.oldStatus}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(entry.newStatus)}>{entry.newStatus}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{entry.remarks ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{entry.changedBy}</td>
                    <td className="px-4 py-3 text-slate-600">{entry.changedAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
