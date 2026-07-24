"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  applyMedicationImportAction,
  previewMedicationImportAction,
} from "@/app/actions/tenant-medications";
import { Badge, Button, Card, CardBody, Textarea } from "@/components/ui";
import type { MedicationImportRow } from "@/lib/medication/validation";
import { useI18n } from "@/lib/i18n/client";

export function MedicationImportPanel({ canCreate }: { canCreate: boolean }) {
  const router = useRouter();
  const { t } = useI18n();
  const [csvContent, setCsvContent] = useState("");
  const [preview, setPreview] = useState<{ rows: MedicationImportRow[]; validCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function runPreview() {
    startTransition(async () => {
      const result = await previewMedicationImportAction(csvContent);
      setPreview({ rows: result.rows, validCount: result.validCount });
      setError(null);
    });
  }

  function runApply() {
    startTransition(async () => {
      const result = await applyMedicationImportAction(csvContent);
      if (!result.ok) {
        setError(t(`pharmacy.errors.${result.errorCode}`, t("pharmacy.errors.generic")));
        return;
      }
      setError(null);
      setMessage(t("pharmacy.messages.importApplied", `Import completed (${result.rowsApplied ?? 0} rows).`));
      setPreview(null);
      setCsvContent("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>
      )}

      <Card>
        <CardBody className="space-y-4">
          <p className="text-sm text-slate-600">{t("pharmacy.import.templateHint")}</p>
          <Textarea
            label={t("pharmacy.fields.csvContent")}
            value={csvContent}
            onChange={(event) => setCsvContent(event.target.value)}
            rows={10}
            disabled={!canCreate || pending}
          />
          {canCreate && (
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="secondary" disabled={pending || !csvContent.trim()} onClick={runPreview}>
                {t("pharmacy.actions.previewImport")}
              </Button>
              <Button type="button" disabled={pending || !csvContent.trim()} onClick={runApply}>
                {t("pharmacy.actions.applyImport")}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {preview && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("pharmacy.import.previewTitle")}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("pharmacy.fields.validRows")}: {preview.validCount} / {preview.rows.length}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <th className="px-4 py-3">{t("pharmacy.fields.rowNumber")}</th>
                  <th className="px-4 py-3">{t("pharmacy.fields.brandName")}</th>
                  <th className="px-4 py-3">{t("pharmacy.fields.genericName")}</th>
                  <th className="px-4 py-3">{t("pharmacy.fields.manufacturer")}</th>
                  <th className="px-4 py-3">{t("pharmacy.fields.status")}</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.rowNumber} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-sm">{row.rowNumber}</td>
                    <td className="px-4 py-3 text-sm">{row.brandName}</td>
                    <td className="px-4 py-3 text-sm">{row.genericName}</td>
                    <td className="px-4 py-3 text-sm">{row.manufacturer ?? "—"}</td>
                    <td className="px-4 py-3">
                      {row.errors.length === 0 ? (
                        <Badge variant="success">{t("pharmacy.status.active")}</Badge>
                      ) : (
                        <Badge variant="danger">{row.errors.join(", ")}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.rows.length === 0 && (
            <CardBody>
              <p className="text-sm text-slate-500">{t("pharmacy.import.empty")}</p>
            </CardBody>
          )}
        </Card>
      )}
    </div>
  );
}
