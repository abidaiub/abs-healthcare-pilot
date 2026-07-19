"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { tenantLoginAction } from "@/app/actions/host-auth";
import {
  LoginBrandingPanel,
  PLATFORM_STATS,
} from "@/components/login/LoginBrandingPanel";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import type { TenantOptionRow } from "@/lib/diagnostic/types";

type Props = {
  tenants: TenantOptionRow[];
};

export function TenantLoginForm({ tenants }: Props) {
  const [tenantId, setTenantId] = useState<string>(tenants[0]?.id ?? "");
  const [branchId, setBranchId] = useState<string>(
    tenants[0]?.branches[0]?.id ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === tenantId),
    [tenants, tenantId],
  );
  const branches = selectedTenant?.branches ?? [];

  function handleTenantChange(nextTenantId: string) {
    setTenantId(nextTenantId);
    const tenant = tenants.find((entry) => entry.id === nextTenantId);
    setBranchId(tenant?.branches[0]?.id ?? "");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTenant || !branchId) return;

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("tenantId", tenantId);
      formData.set("branchId", branchId);
      const result = await tenantLoginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (tenants.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md">
          <CardBody>
            <p className="font-semibold text-slate-900">No tenants available</p>
            <p className="mt-2 text-sm text-slate-600">
              Run <code className="text-xs">npm run db:seed</code> to create the ABMG tenant, or check database connectivity.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <LoginBrandingPanel
        headline="Tenant workspace for hospitals, diagnostics, and clinics"
        description="Select your tenant and branch, then sign in with your assigned credentials."
      />

      <div className="flex w-full flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-8 lg:hidden">
            <p className="text-lg font-semibold text-slate-900">ABSHealthcareLite</p>
            <p className="text-sm text-slate-500">
              Multi-Tenant Hospital &amp; Diagnostic ERP
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              {PLATFORM_STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-sm font-semibold text-slate-900">{stat.value}</p>
                  <p className="text-[10px] text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <Card>
            <CardBody className="space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">Tenant Login</Badge>
                  <Badge variant="success">Database tenants</Badge>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-900">
                  Staff sign in
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Credentials are verified server-side against the User table.
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <Select
                  label="Company / Tenant"
                  name="tenantId"
                  value={tenantId}
                  onChange={(event) => handleTenantChange(event.target.value)}
                  required
                >
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.code})
                    </option>
                  ))}
                </Select>

                <Select
                  label="Branch"
                  name="branchId"
                  value={branchId}
                  onChange={(event) => setBranchId(event.target.value)}
                  required
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </Select>

                <Input
                  label="Username"
                  name="username"
                  placeholder="laila.hasan"
                  autoComplete="username"
                  required
                />

                <Input
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Signing in..." : "Sign in to workspace"}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-500">
                Platform administrator?{" "}
                <Link
                  href="/host/login"
                  className="font-medium text-teal-700 hover:text-teal-800"
                >
                  Go to host login
                </Link>
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
