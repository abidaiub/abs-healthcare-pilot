"use client";

import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import type { PrescriptionStatus } from "@/lib/prescription/types";
import { PRESCRIPTION_STATUS_I18N_KEYS } from "@/lib/prescription/constants";
import { useI18n } from "@/lib/i18n/client";

export type PrescriptionListRow = {
  id: string;
  prescriptionNumber: string;
  status: PrescriptionStatus;
  versionNumber: number;
  isCurrentVersion: boolean;
  prescribedAt: Date;
  patient: { patientNumber: string; fullName: string };
  doctor: { doctorName: string; doctorCode: string };
  branch: { code: string; name: string };
  encounter: { encounterNumber: string };
};

export function PrescriptionListPanel({ rows }: { rows: PrescriptionListRow[] }) {
  const { t } = useI18n();

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="px-4 py-3">{t("prescription.fields.prescriptionNumber")}</th>
              <th className="px-4 py-3">{t("prescription.fields.patient")}</th>
              <th className="px-4 py-3">{t("prescription.fields.doctor")}</th>
              <th className="px-4 py-3">{t("prescription.fields.encounter")}</th>
              <th className="px-4 py-3">{t("prescription.fields.prescribedAt")}</th>
              <th className="px-4 py-3">{t("prescription.fields.status")}</th>
              <th className="px-4 py-3 text-end">{t("prescription.actions.viewDetail")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-teal-700">
                  {row.prescriptionNumber}
                  {row.versionNumber > 1 && (
                    <span className="ms-1 text-xs text-slate-500">v{row.versionNumber}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">{row.patient.fullName}</td>
                <td className="px-4 py-3 text-sm">{row.doctor.doctorName}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-600">{row.encounter.encounterNumber}</td>
                <td className="px-4 py-3 text-sm">{new Date(row.prescribedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Badge variant={row.status === "FINALIZED" ? "success" : row.status === "DRAFT" ? "info" : "default"}>
                    {t(PRESCRIPTION_STATUS_I18N_KEYS[row.status])}
                  </Badge>
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
        <div className="px-6 py-10 text-center text-sm text-slate-500">{t("prescription.list.empty")}</div>
      )}
    </Card>
  );
}
