"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { setTenantMockSessionAction } from "@/app/actions/auth";
import {
  LoginBrandingPanel,
  PLATFORM_STATS,
} from "@/components/login/LoginBrandingPanel";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import type { TenantOptionRow } from "@/lib/diagnostic/types";
import { persistMockSessionClient, type TenantMockSessionInput } from "@/lib/mock-session";
import { TENANT_PRIMARY_ROLES } from "@/lib/navigation";

type AccountStatus = "Active" | "Locked" | "Inactive";

type Props = {
  tenants: TenantOptionRow[];
};

export function TenantLoginForm({ tenants }: Props) {
  const router = useRouter();
  const [tenantId, setTenantId] = useState<string>(tenants[0]?.id ?? "");
  const [branchId, setBranchId] = useState<string>(
    tenants[0]?.branches[0]?.id ?? "",
  );
  const [selectedRole, setSelectedRole] = useState<string>(
    TENANT_PRIMARY_ROLES[1],
  );
  const [accountStatus] = useState<AccountStatus>("Active");
  const [showForcePasswordChange] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    if (!selectedTenant) return;

    const formData = new FormData(event.currentTarget);
    const userName = String(formData.get("username") ?? "").trim();
    const role = String(formData.get("role") ?? selectedRole).trim();
    const branch = branches.find((entry) => entry.id === branchId);
    if (!branch) return;

    const mockSession: TenantMockSessionInput = {
      loginKind: "tenant",
      tenantId: selectedTenant.id,
      tenantName: selectedTenant.name,
      tenantCode: selectedTenant.code,
      branchId: branch.id,
      branchName: branch.name,
      branchCode: branch.code,
      role,
      userName: userName || "Workspace User",
    };

    setSubmitting(true);
    try {
      persistMockSessionClient(mockSession);
      await setTenantMockSessionAction(mockSession);
      router.push("/dashboard");
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
        description="Select your tenant and branch from the database. Demo session — credentials not verified against User table yet."
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

          {showForcePasswordChange && (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-medium">Password change required</p>
              <p className="mt-1 text-xs text-amber-700">
                Your account requires a password update before continuing. UI
                placeholder — no enforcement in demo session.
              </p>
            </div>
          )}

          <Card>
            <CardBody className="space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">Tenant Login</Badge>
                  <Badge variant="success">Database tenants</Badge>
                  <Badge
                    variant={
                      accountStatus === "Active"
                        ? "success"
                        : accountStatus === "Locked"
                          ? "danger"
                          : "default"
                    }
                  >
                    Account: {accountStatus}
                  </Badge>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-900">
                  Staff sign in
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tenant and branch loaded from Prisma. Session uses real tenantId for data scoping.
                </p>
              </div>

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

                <Select
                  label="Primary role"
                  name="role"
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value)}
                  required
                >
                  {TENANT_PRIMARY_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Username"
                  name="username"
                  placeholder="rec_arif"
                  autoComplete="username"
                  required
                />

                <div>
                  <Input
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                </div>

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
