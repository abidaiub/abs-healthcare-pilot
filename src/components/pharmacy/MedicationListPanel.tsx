"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { listMedicationsAction } from "@/app/actions/tenant-medications";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import type { MedicationCatalogStatus } from "@/generated/prisma/client";
import { MEDICATION_STATUS_I18N_KEYS } from "@/lib/medication/constants";
import { useI18n } from "@/lib/i18n/client";

export type MedicationListRow = {
  id: string;
  internalCode: string;
  brandName: string;
  genericDisplayName: string | null;
  displayStrength: string | null;
  status: MedicationCatalogStatus;
  generic: { genericName: string } | null;
  manufacturer: { name: string } | null;
  dosageForm: { displayName: string } | null;
};

const STATUS_VARIANTS: Record<MedicationCatalogStatus, "default" | "success" | "warning" | "info"> = {
  DRAFT: "info",
  ACTIVE: "success",
  INACTIVE: "warning",
  ARCHIVED: "default",
};

export function MedicationListPanel({
  rows: initialRows,
  canCreate,
}: {
  rows: MedicationListRow[];
  canCreate: boolean;
}) {
  const { t } = useI18n();
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const filteredCount = useMemo(() => rows.length, [rows]);

  function applyFilters() {
    startTransition(async () => {
      const next = await listMedicationsAction({
        query: query.trim() || undefined,
        status: (status || undefined) as MedicationCatalogStatus | undefined,
      });
      setRows(next as MedicationListRow[]);
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <Input
              label={t("pharmacy.fields.query")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("pharmacy.fields.brandName")}
            />
          </div>
          <Select
            label={t("pharmacy.fields.status")}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">—</option>
            {(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"] as MedicationCatalogStatus[]).map((value) => (
              <option key={value} value={value}>
                {t(MEDICATION_STATUS_I18N_KEYS[value])}
              </option>
            ))}
          </Select>
          <Button type="button" disabled={pending} onClick={applyFilters}>
            {t("pharmacy.fields.search")}
          </Button>
          {canCreate && (
            <Link href="/pharmacy/medications/new">
              <Button>{t("pharmacy.actions.create")}</Button>
            </Link>
          )}
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-4 py-3">{t("pharmacy.fields.internalCode")}</th>
                <th className="px-4 py-3">{t("pharmacy.fields.brandName")}</th>
                <th className="px-4 py-3">{t("pharmacy.fields.genericName")}</th>
                <th className="px-4 py-3">{t("pharmacy.fields.manufacturer")}</th>
                <th className="px-4 py-3">{t("pharmacy.fields.displayStrength")}</th>
                <th className="px-4 py-3">{t("pharmacy.fields.status")}</th>
                <th className="px-4 py-3 text-end">{t("pharmacy.actions.viewDetail")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-sm text-teal-700">{row.internalCode}</td>
                  <td className="px-4 py-3 text-sm font-medium">{row.brandName}</td>
                  <td className="px-4 py-3 text-sm">
                    {row.genericDisplayName ?? row.generic?.genericName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">{row.manufacturer?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-sm">{row.displayStrength ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[row.status]}>
                      {t(MEDICATION_STATUS_I18N_KEYS[row.status])}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Link href={`/pharmacy/medications/${row.id}`} className="text-sm font-medium text-teal-700">
                      {t("pharmacy.actions.viewDetail")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCount === 0 && (
          <div className="px-6 py-10 text-center text-sm text-slate-500">{t("pharmacy.list.empty")}</div>
        )}
      </Card>
    </div>
  );
}
