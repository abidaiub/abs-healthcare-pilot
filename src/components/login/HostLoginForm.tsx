"use client";

import Link from "next/link";
import { useState } from "react";
import { hostLoginAction } from "@/app/actions/host-auth";
import {
  LoginBrandingPanel,
  PLATFORM_STATS,
} from "@/components/login/LoginBrandingPanel";
import { Badge, Button, Card, CardBody, Input } from "@/components/ui";

export function HostLoginForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await hostLoginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <LoginBrandingPanel
        headline="Platform host console for multi-tenant healthcare operations"
        description="Sign in as a host administrator to manage tenants, global catalogs, module registry, and SaaS settings."
      />

      <div className="flex w-full flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-8 lg:hidden">
            <p className="text-lg font-semibold text-slate-900">ABSHealthcareLite</p>
            <p className="text-sm text-slate-500">Platform Host Console</p>
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
                <Badge variant="info">Host Login</Badge>
                <h2 className="mt-3 text-xl font-semibold text-slate-900">
                  Platform administrator
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Host-only access. Tenant hospital staff should use the tenant
                  login instead.
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <Input
                  label="Username"
                  name="username"
                  placeholder="admin.abs"
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
                  {submitting ? "Signing in..." : "Sign in to Host Console"}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-500">
                Hospital or clinic staff?{" "}
                <Link
                  href="/login"
                  className="font-medium text-teal-700 hover:text-teal-800"
                >
                  Go to tenant login
                </Link>
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
