"use client";

import Link from "next/link";
import { Badge, Button, Card, CardBody, Input, Select, Textarea } from "@/components/ui";
import {
  SAAS_TENANTS,
  SUBSCRIPTION_PACKAGES,
  type SaasTenant,
} from "@/lib/saas-foundation-data";

export function TenantFormPanel({
  mode,
  tenant,
}: {
  mode: "create" | "edit";
  tenant?: SaasTenant;
}) {
  const data = tenant ?? SAAS_TENANTS[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              A. Tenant profile
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="Tenant code" defaultValue={mode === "edit" ? data.code : ""} placeholder="ABMG" />
              <Input label="Tenant name" defaultValue={mode === "edit" ? data.name : ""} placeholder="Al Baraka Medical Group" />
              <Input label="Legal name" defaultValue={mode === "edit" ? data.legalName : ""} />
              <Input label="Trade license no" defaultValue={mode === "edit" ? data.tradeLicenseNo : ""} />
              <Input label="Tax BIN no" defaultValue={mode === "edit" ? data.taxBinNo : ""} />
              <Input label="Contact person" defaultValue={mode === "edit" ? data.contactPerson : ""} />
              <Input label="Contact mobile" defaultValue={mode === "edit" ? data.contactMobile : ""} />
              <Input label="Contact email" defaultValue={mode === "edit" ? data.contactEmail : ""} />
              <Input label="Address" defaultValue={mode === "edit" ? data.address : ""} className="sm:col-span-2" />
              <Input label="City" defaultValue={mode === "edit" ? data.city : ""} />
              <Input label="District" defaultValue={mode === "edit" ? data.district : ""} />
              <Input label="Country" defaultValue={mode === "edit" ? data.country : "Bangladesh"} />
              <Select label="Timezone" defaultValue={data.timezone}>
                <option>Asia/Dhaka</option>
                <option>Asia/Kolkata</option>
              </Select>
              <Select label="Default language" defaultValue={data.defaultLanguage}>
                <option value="EN">English</option>
                <option value="BN">Bangla</option>
                <option value="AR">Arabic</option>
              </Select>
              <Select label="Tenant type" defaultValue={data.tenantType}>
                <option>Hospital</option>
                <option>Diagnostic Center</option>
                <option>Clinic Network</option>
                <option>Multi-Specialty</option>
              </Select>
              <Select label="Tenant status" defaultValue={data.tenantStatus}>
                <option>Active</option>
                <option>Trial</option>
                <option>Suspended</option>
                <option>Expired</option>
              </Select>
              <Select label="Onboarding status" defaultValue={data.onboardingStatus}>
                <option>Draft</option>
                <option>Provisioning</option>
                <option>Ready</option>
                <option>Live</option>
              </Select>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              B. Branding
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Logo URL" defaultValue={data.branding.logoUrl} />
              <Input label="Report header logo URL" defaultValue={data.branding.reportHeaderLogoUrl} />
              <div className="sm:col-span-2">
                <Textarea label="Report footer text" rows={2} defaultValue={data.branding.reportFooterText} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              C. Deployment
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select label="Deployment mode" defaultValue={data.deployment.mode}>
                <option>Shared</option>
                <option>Dedicated</option>
                <option>On-Premise</option>
              </Select>
              <Input label="Subdomain" defaultValue={data.deployment.subdomain} />
              <Input label="Custom domain" defaultValue={data.deployment.customDomain} placeholder="Optional" />
              <Input label="App URL" defaultValue={data.deployment.appUrl} />
              <Select label="Environment" defaultValue={data.deployment.environment}>
                <option>Production</option>
                <option>Staging</option>
                <option>UAT</option>
              </Select>
              <Select label="Deployment status" defaultValue={data.deployment.status}>
                <option>Pending</option>
                <option>Deploying</option>
                <option>Live</option>
                <option>Failed</option>
              </Select>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              D. First admin
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="Admin name" defaultValue={mode === "edit" ? data.primaryAdmin.name : "Laila Hasan"} />
              <Input label="Admin email" defaultValue={mode === "edit" ? data.primaryAdmin.email : ""} />
              <Input label="Admin mobile" defaultValue={mode === "edit" ? data.primaryAdmin.mobile : ""} />
              <Select label="Admin role" defaultValue={data.primaryAdmin.role}>
                <option>Primary Tenant Admin</option>
                <option>Tenant Admin</option>
              </Select>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              E. Package
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select label="Subscription package" defaultValue={data.subscription.packageCode}>
                {SUBSCRIPTION_PACKAGES.map((pkg) => (
                  <option key={pkg.code} value={pkg.code}>
                    {pkg.name}
                  </option>
                ))}
              </Select>
              <Select label="Billing cycle" defaultValue={data.subscription.billingCycle}>
                <option>Monthly</option>
                <option>Yearly</option>
                <option>Quarterly</option>
              </Select>
              <Input label="Start date" defaultValue={data.subscription.startDate} />
              <Input label="End date" defaultValue={data.subscription.endDate} />
              <Input label="Grace period (days)" defaultValue={String(data.subscription.gracePeriodDays)} />
              <Select label="Auto renew" defaultValue={data.subscription.autoRenew ? "Yes" : "No"}>
                <option>Yes</option>
                <option>No</option>
              </Select>
            </div>
          </section>
        </CardBody>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Link href={tenant ? `/host/tenants/${tenant.id}` : "/host/tenants"}>
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
          <Button type="button">{mode === "create" ? "Create tenant" : "Save changes"}</Button>
        </div>
      </Card>
    </div>
  );
}
