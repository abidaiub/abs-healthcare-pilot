"use client";

import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import type { PrescriptionStatus } from "@/lib/prescription/types";
import { PRESCRIPTION_STATUS_I18N_KEYS } from "@/lib/prescription/constants";
import { useI18n } from "@/lib/i18n/client";

export type PrescriptionHistoryRow = {
  id: string;
  prescriptionNumber: string;
  status: PrescriptionStatus;
  versionNumber: number;
  isCurrentVersion: boolean;
  prescribedAt: Date;
  finalizedAt: Date | null;
  cancelledAt: Date | null;
  revisionReason: string | null;
  cancellationReason: string | null;
};

export function PrescriptionHistoryPanel({
  rows,
  prescriptionNumber,
}: {
  rows: PrescriptionHistoryRow[];
  prescriptionNumber: string;
}) {
  const { t } = useI18n();

  return (
    <Card>
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-900">
          {prescriptionNumber} — {t("prescription.sections.versionHistory")}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="px-4 py-3">{t("prescription.fields.versionNumber")}</th>
              <th className="px-4 py-3">{t("prescription.fields.status")}</th>
              <th className="px-4 py-3">{t("prescription.fields.prescribedAt")}</th>
              <th className="px-4 py-3">{t("prescription.fields.finalizedAt")}</th>
              <th className="px-4 py-3 text-end">{t("prescription.actions.viewDetail")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-sm">
                  v{row.versionNumber}
                  {row.isCurrentVersion && (
                    <Badge variant="success">
                      {t("prescription.history.currentVersion")}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={row.status === "FINALIZED" ? "success" : row.status === "DRAFT" ? "info" : "default"}>
                    {t(PRESCRIPTION_STATUS_I18N_KEYS[row.status])}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm">{new Date(row.prescribedAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm">
                  {row.finalizedAt ? new Date(row.finalizedAt).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3 text-end">
                  <Link href={`/prescriptions/${row.id}`} className="text-sm font-medium text-teal-700">
                    {t("prescription.actions.viewDetail")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <div className="px-6 py-10 text-center text-sm text-slate-500">{t("prescription.history.empty")}</div>
      )}
    </Card>
  );
}
