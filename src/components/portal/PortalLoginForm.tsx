"use client";

import { useState, useTransition } from "react";
import { portalLoginAction } from "@/app/actions/portal-auth";
import { Button, Card, CardBody, Input } from "@/components/ui";

const ERROR_MESSAGES: Record<string, string> = {
  PORTAL_INVALID_CREDENTIALS: "Sign-in details are incorrect. Please check and try again.",
  PORTAL_ACCOUNT_SUSPENDED: "This portal account is suspended. Please contact the report desk.",
  PORTAL_ACCOUNT_NOT_VERIFIED: "This portal account is not activated yet. Please contact the report desk.",
  PORTAL_DISABLED_FOR_TENANT: "The patient portal is not enabled for this centre.",
};

export function PortalLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardBody className="space-y-5">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-slate-900">Patient portal sign in</h1>
          <p className="text-sm text-slate-600">
            Sign in with the mobile number or email registered at the centre. You will only see
            reports that have been released to you.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {ERROR_MESSAGES[error] ?? "Sign-in failed. Please try again."}
          </div>
        ) : null}

        <form
          className="space-y-4"
          action={(formData) =>
            startTransition(async () => {
              const result = await portalLoginAction(formData);
              if (result && !result.ok) setError(result.errorCode);
            })
          }
        >
          <Input name="tenantCode" label="Centre code" required autoComplete="organization" />
          <Input name="username" label="Mobile or email" required autoComplete="username" />
          <Input
            name="password"
            type="password"
            label="Password"
            required
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" disabled={pending}>
            Sign in
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
