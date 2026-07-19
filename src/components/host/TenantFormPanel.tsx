"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createTenantAction,
  updateTenantAction,
} from "@/app/actions/host-tenant";
import { Badge, Button, Card, CardBody, Input, Select, Textarea } from "@/components/ui";
import type { SubscriptionPackageRow, TenantDetailRecord } from "@/lib/saas/types";

export function TenantFormPanel({
  mode,
  tenant,
  packages,
}: {
  mode: "create" | "edit";
  tenant?: TenantDetailRecord;
  packages: SubscriptionPackageRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const defaultPackage = packages[0];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createTenantAction(formData)
          : await updateTenantAction(tenant!.id, formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push(`/host/tenants/${result.tenantId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardBody className="space-y-8">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                A. Tenant profile
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Input
                  label="Tenant code *"
                  name="tenantCode"
                  defaultValue={mode === "edit" ? tenant?.code : ""}
                  placeholder="ABMG"
                  readOnly={mode === "edit"}
                  required
                />
                <Input
                  label="Tenant name *"
                  name="tenantName"
                  defaultValue={mode === "edit" ? tenant?.name : ""}
                  required
                />
                <Input label="Legal name" name="legalName" defaultValue={tenant?.legalName ?? ""} />
                <Input label="Trade license no" name="tradeLicenseNo" defaultValue={tenant?.tradeLicenseNo ?? ""} />
                <Input label="Tax BIN no" name="taxBinNo" defaultValue={tenant?.taxBinNo ?? ""} />
                <Input label="Contact person *" name="contactPerson" defaultValue={tenant?.contactPerson ?? ""} required />
                <Input label="Contact mobile *" name="contactMobile" defaultValue={tenant?.contactMobile ?? ""} required />
                <Input label="Contact email *" name="contactEmail" type="email" defaultValue={tenant?.contactEmail ?? ""} required />
                <Input label="Address" name="address" defaultValue={tenant?.address ?? ""} className="sm:col-span-2" />
                <Input label="City" name="city" defaultValue={tenant?.city ?? ""} />
                <Input label="District" name="district" defaultValue={tenant?.district ?? ""} />
                <Input label="Country" name="country" defaultValue={tenant?.country ?? "Bangladesh"} />
                <Select label="Timezone" name="timezone" defaultValue={tenant?.timezone ?? "Asia/Dhaka"}>
                  <option value="Asia/Dhaka">Asia/Dhaka</option>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                </Select>
                <Select label="Default language" name="defaultLanguage" defaultValue={tenant?.defaultLanguage ?? "EN"}>
                  <option value="EN">English</option>
                  <option value="BN">Bangla</option>
                </Select>
                <Select label="Tenant type" name="tenantType" defaultValue={tenant?.tenantType ?? "Multi-Specialty"}>
                  <option>Hospital</option>
                  <option>Diagnostic Center</option>
                  <option>Clinic Network</option>
                  <option>Multi-Specialty</option>
                </Select>
                {mode === "edit" && (
                  <>
                    <Select label="Tenant status" name="tenantStatus" defaultValue={tenant?.tenantStatus ?? "Trial"}>
                      <option>Active</option>
                      <option>Trial</option>
                      <option>Suspended</option>
                      <option>Expired</option>
                      <option>Archived</option>
                    </Select>
                    <Select label="Onboarding status" name="onboardingStatus" defaultValue={tenant?.onboardingStatus ?? "Setup Pending"}>
                      <option>Draft</option>
                      <option>Setup Pending</option>
                      <option>Live</option>
                      <option>Blocked</option>
                    </Select>
                  </>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                B. Branding
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Logo URL" name="logoUrl" defaultValue={tenant?.branding.logoUrl ?? ""} />
                <Input label="Report header logo URL" name="reportHeaderLogoUrl" defaultValue={tenant?.branding.reportHeaderLogoUrl ?? ""} />
                <div className="sm:col-span-2">
                  <Textarea label="Report footer text" name="reportFooterText" rows={2} defaultValue={tenant?.branding.reportFooterText ?? ""} />
                </div>
              </div>
            </section>

            {mode === "create" && (
              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  C. First admin *
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Input label="Admin name" name="adminName" placeholder="Primary Tenant Admin" required />
                  <Input label="Admin email" name="adminEmail" type="email" required />
                  <Input label="Admin mobile" name="adminMobile" />
                  <Input label="Admin username" name="adminUsername" placeholder="Optional — defaults from email" />
                  <Input label="Temporary password" name="adminPassword" type="password" placeholder="Defaults to Tenant@2026!" />
                </div>
              </section>
            )}

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {mode === "create" ? "D. Package *" : "C. Package"}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Select
                  label="Subscription package"
                  name="packageId"
                  defaultValue={
                    packages.find((p) => p.code === tenant?.subscription?.packageCode)?.id ??
                    defaultPackage?.id
                  }
                  required={mode === "create"}
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.code})
                    </option>
                  ))}
                </Select>
                <Select label="Billing cycle" name="billingCycle" defaultValue={tenant?.subscription?.billingCycle ?? "Monthly"}>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                  <option value="QUARTERLY">Quarterly</option>
                </Select>
                <Input
                  label="Start date"
                  name="subscriptionStart"
                  type="date"
                  defaultValue="2026-01-01"
                />
                <Input
                  label="End date"
                  name="subscriptionEnd"
                  type="date"
                  defaultValue="2026-12-31"
                />
                <Input label="Grace period (days)" name="gracePeriodDays" defaultValue={String(tenant?.subscription?.gracePeriodDays ?? 7)} />
                <Select label="Auto renew" name="autoRenew" defaultValue={tenant?.subscription?.autoRenew ? "true" : "true"}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Select>
              </div>
            </section>

            {mode === "edit" && tenant?.primaryAdmin && (
              <section className="space-y-2">
                <Badge variant="info">Primary admin</Badge>
                <p className="text-sm text-slate-600">
                  {tenant.primaryAdmin.name} — {tenant.primaryAdmin.email}
                </p>
              </section>
            )}
          </CardBody>
          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <Link href={tenant ? `/host/tenants/${tenant.id}` : "/host/tenants"}>
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : mode === "create" ? "Create tenant" : "Save changes"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
