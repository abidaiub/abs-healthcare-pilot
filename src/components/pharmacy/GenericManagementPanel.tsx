"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { createMedicationGenericAction } from "@/app/actions/tenant-medications";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import { useI18n } from "@/lib/i18n/client";

type GenericRow = {
  id: string;
  genericCode: string;
  genericName: string;
  isControlled: boolean;
  isHighAlert: boolean;
  isActive: boolean;
  category: { displayName: string } | null;
};

type CategoryOption = { id: string; displayName: string };

export function GenericManagementPanel({
  generics,
  categories,
  canCreate,
}: {
  generics: GenericRow[];
  categories: CategoryOption[];
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
      const result = await createMedicationGenericAction(formData);
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
            <h2 className="text-base font-semibold text-slate-900">{t("pharmacy.actions.addGeneric")}</h2>
          </div>
          <CardBody>
            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Input label={t("pharmacy.fields.genericCode")} name="genericCode" required disabled={pending} />
              <Input label={t("pharmacy.fields.genericName")} name="genericName" required disabled={pending} />
              <Select label={t("pharmacy.fields.category")} name="categoryId" disabled={pending} defaultValue="">
                <option value="">—</option>
                {categories.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.displayName}
                  </option>
                ))}
              </Select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isControlled" disabled={pending} />
                {t("pharmacy.fields.isControlled")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isHighAlert" disabled={pending} />
                {t("pharmacy.fields.isHighAlert")}
              </label>
              <div className="md:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={pending}>{t("pharmacy.actions.addGeneric")}</Button>
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
                <th className="px-4 py-3">{t("pharmacy.fields.genericCode")}</th>
                <th className="px-4 py-3">{t("pharmacy.fields.genericName")}</th>
                <th className="px-4 py-3">{t("pharmacy.fields.category")}</th>
                <th className="px-4 py-3">{t("pharmacy.fields.status")}</th>
              </tr>
            </thead>
            <tbody>
              {generics.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-sm">{row.genericCode}</td>
                  <td className="px-4 py-3 text-sm">{row.genericName}</td>
                  <td className="px-4 py-3 text-sm">{row.category?.displayName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={row.isActive ? "success" : "default"}>
                        {row.isActive ? t("pharmacy.status.active") : t("pharmacy.status.inactive")}
                      </Badge>
                      {row.isControlled && <Badge variant="warning">{t("pharmacy.fields.isControlled")}</Badge>}
                      {row.isHighAlert && <Badge variant="danger">{t("pharmacy.fields.isHighAlert")}</Badge>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {generics.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-slate-500">{t("pharmacy.list.empty")}</div>
        )}
      </Card>
    </div>
  );
}
