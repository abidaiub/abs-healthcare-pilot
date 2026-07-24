import Link from "next/link";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { listReleaseHistoryAction } from "@/app/actions/tenant-lab-report-release";
import { Badge, Button, Card } from "@/components/ui";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission } from "@/lib/rbac/auth";

export default async function ReportReleaseHistoryPage() {
  const session = await requireTenantPermission("/lab/report-release/history");
  const { t } = await getServerI18n(session);
  const history = await listReleaseHistoryAction();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ModulePageHeader screenKey="reportReleaseHistory" description={t("laboratoryReportRelease.history.description")} />
        <Link href="/lab/report-release">
          <Button type="button" variant="secondary">{t("laboratoryReportRelease.actions.backToQueue")}</Button>
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{t("laboratoryReportRelease.fields.reportNumber")}</th>
                <th className="px-4 py-3">{t("laboratoryReportRelease.fields.patient")}</th>
                <th className="px-4 py-3">{t("laboratoryReportRelease.fields.test")}</th>
                <th className="px-4 py-3">{t("laboratoryReportRelease.fields.status")}</th>
                <th className="px-4 py-3">{t("laboratoryReportRelease.fields.releasedAt")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    {t("laboratoryReportRelease.history.empty")}
                  </td>
                </tr>
              ) : null}
              {history.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-teal-700">{entry.reportNumber}</td>
                  <td className="px-4 py-3">{entry.labResult.labOrder.patient.fullName}</td>
                  <td className="px-4 py-3">{entry.labResult.labOrderTest.testName}</td>
                  <td className="px-4 py-3">
                    <Badge variant={entry.status === "RELEASED" ? "success" : "default"}>{entry.status}</Badge>
                  </td>
                  <td className="px-4 py-3">{entry.releasedAt ? new Date(entry.releasedAt).toLocaleString() : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/lab/report-release/${entry.id}`}>
                      <Button type="button" variant="secondary">{t("laboratoryReportRelease.actions.review")}</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
