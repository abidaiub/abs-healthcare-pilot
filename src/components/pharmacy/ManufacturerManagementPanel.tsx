"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { createManufacturerAction } from "@/app/actions/tenant-medications";
import { Badge, Button, Card, CardBody, Input } from "@/components/ui";
import { useI18n } from "@/lib/i18n/client";

type ManufacturerRow = {
  id: string;
  name: string;
  shortName: string | null;
  country: string | null;
  registrationNumber: string | null;
  isActive: boolean;
};

export function ManufacturerManagementPanel({
  manufacturers,
  canCreate,
}: {
  manufacturers: ManufacturerRow[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createManufacturerAction(formData);
      if (!result.ok) {
        setError(t(`pharmacy.errors.${result.errorCode}`, t("pharmacy.errors.generic")));
        return;
      }
      setError(null);
      e.currentTarget.reset();
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {canCreate && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("pharmacy.actions.addManufacturer")}</h2>
          </div>
          <CardBody>
            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Input label={t("pharmacy.fields.manufacturerName")} name="name" required disabled={pending} />
              <Input label={t("pharmacy.fields.shortName")} name="shortName" disabled={pending} />
              <Input label={t("pharmacy.fields.registrationNumber")} name="registrationNumber" disabled={pending} />
              <Input label={t("pharmacy.fields.country")} name="country" disabled={pending} />
              <Input label={t("pharmacy.fields.contactPhone")} name="contactPhone" disabled={pending} />
              <Input label={t("pharmacy.fields.contactEmail")} name="contactEmail" type="email" disabled={pending} />
              <div className="md:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={pending}>{t("pharmacy.actions.addManufacturer")}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-4 py-3">{t("pharmacy.fields.manufacturerName")}</th>
                <th className="px-4 py-3">{t("pharmacy.fields.shortName")}</th>
                <th className="px-4 py-3">{t("pharmacy.fields.country")}</th>
                <th className="px-4 py-3">{t("pharmacy.fields.status")}</th>
              </tr>
            </thead>
            <tbody>
              {manufacturers.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-sm">{row.shortName ?? "—"}</td>
                  <td className="px-4 py-3 text-sm">{row.country ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={row.isActive ? "success" : "default"}>
                      {row.isActive ? t("pharmacy.status.active") : t("pharmacy.status.inactive")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {manufacturers.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-slate-500">{t("pharmacy.list.empty")}</div>
        )}
      </Card>
    </div>
  );
}
