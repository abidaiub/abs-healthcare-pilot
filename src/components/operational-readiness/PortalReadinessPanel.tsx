"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { savePortalReadinessSettingsAction } from "@/app/actions/tenant-operational-readiness";
import { Button, Card, CardBody, CardHeader, Input } from "@/components/ui";

type Settings = {
  portalEnabled: boolean;
  selfRegistration: boolean;
  downloadPdfEnabled: boolean;
  qrVerificationEnabled: boolean;
  notificationEnabled: boolean;
  passwordMinLength: number;
  passwordRequireMixed: boolean;
};

export function PortalReadinessPanel({
  settings,
  canEdit,
}: {
  settings: Settings;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState(settings);

  function toggle(key: keyof Settings) {
    setForm((f) => ({ ...f, [key]: !f[key] }));
  }

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await savePortalReadinessSettingsAction(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Portal readiness settings saved and audited.");
      router.refresh();
    });
  }

  const flags: Array<{ key: keyof Settings; label: string }> = [
    { key: "portalEnabled", label: "Portal enabled" },
    { key: "selfRegistration", label: "Self registration" },
    { key: "downloadPdfEnabled", label: "Download PDF" },
    { key: "qrVerificationEnabled", label: "QR verification" },
    { key: "notificationEnabled", label: "Notification" },
    { key: "passwordRequireMixed", label: "Password requires mixed characters" },
  ];

  return (
    <Card>
      <CardHeader
        title="Patient Portal Readiness"
        description="Tenant-level portal policy switches for go-live readiness."
      />
      <CardBody className="space-y-4">
        {flags.map((flag) => (
          <label key={flag.key} className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(form[flag.key])}
              disabled={!canEdit || pending}
              onChange={() => toggle(flag.key)}
            />
            {flag.label}
          </label>
        ))}
        <Input
          label="Password minimum length"
          type="number"
          min={6}
          max={32}
          value={form.passwordMinLength}
          disabled={!canEdit || pending}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              passwordMinLength: Number(e.target.value || 8),
            }))
          }
        />
      </CardBody>
      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
        <div className="text-sm">
          {error && <p className="text-rose-600">{error}</p>}
          {message && <p className="text-emerald-700">{message}</p>}
        </div>
        <Button type="button" disabled={!canEdit || pending} onClick={save}>
          Save portal settings
        </Button>
      </div>
    </Card>
  );
}
