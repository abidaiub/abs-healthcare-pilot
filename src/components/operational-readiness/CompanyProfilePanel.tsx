"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveCompanyProfileAction } from "@/app/actions/tenant-operational-readiness";
import { Button, Card, CardBody, CardHeader, Input } from "@/components/ui";

type Profile = {
  tenantName: string;
  address: string | null;
  contactMobile: string;
  contactEmail: string;
  website: string | null;
  logoUrl: string | null;
  reportHeaderLogoUrl: string | null;
  reportFooterText: string | null;
  invoiceFooterText: string | null;
  headerBrandingText: string | null;
  footerBrandingText: string | null;
  barcodePrefix: string | null;
};

export function CompanyProfilePanel({
  profile,
  canEdit,
}: {
  profile: Profile;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    tenantName: profile.tenantName ?? "",
    address: profile.address ?? "",
    phone: profile.contactMobile ?? "",
    email: profile.contactEmail ?? "",
    website: profile.website ?? "",
    logoUrl: profile.logoUrl ?? "",
    reportHeaderLogoUrl: profile.reportHeaderLogoUrl ?? "",
    reportFooterText: profile.reportFooterText ?? "",
    invoiceFooterText: profile.invoiceFooterText ?? "",
    headerBrandingText: profile.headerBrandingText ?? "",
    footerBrandingText: profile.footerBrandingText ?? "",
    barcodePrefix: profile.barcodePrefix ?? "",
  });

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveCompanyProfileAction(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Company profile saved and audited.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader
        title="Company Profile"
        description="Tenant branding used on invoices, reports, and go-live readiness."
      />
      <CardBody className="grid gap-4 md:grid-cols-2">
        <Input
          label="Company name"
          value={form.tenantName}
          disabled={!canEdit || pending}
          onChange={(e) => setForm((f) => ({ ...f, tenantName: e.target.value }))}
        />
        <Input
          label="Phone"
          value={form.phone}
          disabled={!canEdit || pending}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
        <Input
          label="Email"
          value={form.email}
          disabled={!canEdit || pending}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <Input
          label="Website"
          value={form.website}
          disabled={!canEdit || pending}
          onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
        />
        <Input
          label="Address"
          value={form.address}
          disabled={!canEdit || pending}
          className="md:col-span-2"
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        />
        <Input
          label="Tenant logo URL"
          value={form.logoUrl}
          disabled={!canEdit || pending}
          onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
        />
        <Input
          label="Header branding / report header logo URL"
          value={form.reportHeaderLogoUrl || form.headerBrandingText}
          disabled={!canEdit || pending}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              reportHeaderLogoUrl: e.target.value,
              headerBrandingText: e.target.value,
            }))
          }
        />
        <Input
          label="Invoice footer"
          value={form.invoiceFooterText}
          disabled={!canEdit || pending}
          className="md:col-span-2"
          onChange={(e) =>
            setForm((f) => ({ ...f, invoiceFooterText: e.target.value }))
          }
        />
        <Input
          label="Report footer"
          value={form.reportFooterText}
          disabled={!canEdit || pending}
          className="md:col-span-2"
          onChange={(e) =>
            setForm((f) => ({ ...f, reportFooterText: e.target.value }))
          }
        />
        <Input
          label="Footer branding"
          value={form.footerBrandingText}
          disabled={!canEdit || pending}
          className="md:col-span-2"
          onChange={(e) =>
            setForm((f) => ({ ...f, footerBrandingText: e.target.value }))
          }
        />
        <Input
          label="Barcode prefix"
          value={form.barcodePrefix}
          disabled={!canEdit || pending}
          onChange={(e) =>
            setForm((f) => ({ ...f, barcodePrefix: e.target.value }))
          }
        />
      </CardBody>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
        <div className="text-sm">
          {error && <p className="text-rose-600">{error}</p>}
          {message && <p className="text-emerald-700">{message}</p>}
        </div>
        <Button type="button" disabled={!canEdit || pending} onClick={save}>
          Save company profile
        </Button>
      </div>
    </Card>
  );
}
