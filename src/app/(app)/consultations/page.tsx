import Link from "next/link";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { Badge, Button, Card } from "@/components/ui";
import { listEncountersAction } from "@/app/actions/tenant-consultations";
import { ENCOUNTER_STATUS_I18N_KEYS } from "@/lib/consultation/constants";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";
import type { ClinicalEncounterStatus } from "@/lib/consultation/types";

type EncounterListRow = {
  id: string;
  encounterNumber: string;
  consultationDate: Date;
  status: ClinicalEncounterStatus;
  patient: { fullName: string };
  doctor: { doctorName: string };
};

export default async function ConsultationsPage() {
  const session = await requireTenantPermission("/consultations");
  const { t } = await getServerI18n(session);
  const [encounters, canStartWorklist] = await Promise.all([
    listEncountersAction(),
    hasTenantPermission(session.tenantId, session.userId, "/doctor/worklist", "canView"),
  ]);
  const rows = encounters as EncounterListRow[];

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="consultationList"
        description={t("consultation.list.description")}
        action={
          canStartWorklist ? (
            <Link href="/doctor/worklist">
              <Button type="button" variant="secondary">{t("consultation.list.openWorklist")}</Button>
            </Link>
          ) : undefined
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-4 py-3">{t("consultation.fields.encounterNumber")}</th>
                <th className="px-4 py-3">{t("consultation.fields.patient")}</th>
                <th className="px-4 py-3">{t("consultation.fields.doctor")}</th>
                <th className="px-4 py-3">{t("consultation.fields.consultationDate")}</th>
                <th className="px-4 py-3">{t("consultation.fields.status")}</th>
                <th className="px-4 py-3 text-end">{t("consultation.actions.viewDetail")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-teal-700">{row.encounterNumber}</td>
                  <td className="px-4 py-3 text-sm">{row.patient.fullName}</td>
                  <td className="px-4 py-3 text-sm">{row.doctor.doctorName}</td>
                  <td className="px-4 py-3 text-sm">{new Date(row.consultationDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Badge variant="info">{t(ENCOUNTER_STATUS_I18N_KEYS[row.status])}</Badge>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Link href={`/consultations/${row.id}`} className="text-sm font-medium text-teal-700">
                      {t("consultation.actions.viewDetail")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-slate-500">{t("consultation.list.empty")}</div>
        )}
      </Card>
    </div>
  );
}
