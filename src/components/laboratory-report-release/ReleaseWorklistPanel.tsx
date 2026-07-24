"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  authorizeReleaseAction,
  prepareReleaseAction,
} from "@/app/actions/tenant-lab-report-release";
import { Badge, Button, Card } from "@/components/ui";
import { useI18n } from "@/lib/i18n/client";

type QueueProps = {
  pendingReleases: Array<{
    id: string;
    reportNumber: string;
    status: string;
    stateVersion: number;
    resultVersionSnapshot: number;
    portalPublishEligible: boolean;
    portalPublishedAt: Date | null;
    labResult: {
      id: string;
      recordVersion: number;
      labOrder: {
        orderNumber: string;
        patient: { patientNumber: string; fullName: string };
        branch: { code: string; name: string };
      };
      labOrderTest: { testName: string };
      labSample: { accessionNumber: string };
    };
  }>;
  verifiedWithoutRelease: Array<{
    id: string;
    recordVersion: number;
    labOrder: {
      orderNumber: string;
      patient: { patientNumber: string; fullName: string };
      branch: { code: string; name: string };
    };
    labOrderTest: { testName: string };
    labSample: { accessionNumber: string };
  }>;
  canAuthorize: boolean;
  canPrepare: boolean;
};

function statusVariant(status: string) {
  if (status === "RELEASED") return "success" as const;
  if (status === "RELEASE_PENDING" || status === "AMENDED") return "warning" as const;
  if (status === "WITHDRAWN") return "danger" as const;
  return "default" as const;
}

export function ReleaseWorklistPanel({
  pendingReleases,
  verifiedWithoutRelease,
  canAuthorize,
  canPrepare,
}: QueueProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errorCode, setErrorCode] = useState<string | null>(null);

  function handlePrepare(resultId: string, recordVersion: number) {
    setErrorCode(null);
    startTransition(async () => {
      const result = await prepareReleaseAction(resultId, recordVersion);
      if (!result.ok) {
        setErrorCode(result.errorCode);
        return;
      }
      router.refresh();
      if (result.releaseId) router.push(`/lab/report-release/${result.releaseId}`);
    });
  }

  function handleAuthorize(releaseId: string, recordVersion: number, stateVersion: number) {
    setErrorCode(null);
    startTransition(async () => {
      const result = await authorizeReleaseAction(releaseId, recordVersion, stateVersion);
      if (!result.ok) {
        setErrorCode(result.errorCode);
        return;
      }
      router.refresh();
      router.push(`/lab/report-release/${releaseId}`);
    });
  }

  return (
    <div className="space-y-6">
      {errorCode ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {t(`laboratoryReportRelease.errors.${errorCode}`, t("laboratoryReportRelease.errors.generic"))}
        </div>
      ) : null}

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("laboratoryReportRelease.sections.pendingQueue")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("laboratoryReportRelease.worklist.description")}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{t("laboratoryReportRelease.fields.reportNumber")}</th>
                <th className="px-4 py-3">{t("laboratoryReportRelease.fields.orderNumber")}</th>
                <th className="px-4 py-3">{t("laboratoryReportRelease.fields.patient")}</th>
                <th className="px-4 py-3">{t("laboratoryReportRelease.fields.test")}</th>
                <th className="px-4 py-3">{t("laboratoryReportRelease.fields.status")}</th>
                <th className="px-4 py-3">{t("laboratoryReportRelease.fields.version")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pendingReleases.length === 0 && verifiedWithoutRelease.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    {t("laboratoryReportRelease.worklist.empty")}
                  </td>
                </tr>
              ) : null}
              {verifiedWithoutRelease.map((result) => (
                <tr key={result.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-400">—</td>
                  <td className="px-4 py-3 text-slate-600">{result.labOrder.orderNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{result.labOrder.patient.fullName}</td>
                  <td className="px-4 py-3 text-slate-600">{result.labOrderTest.testName}</td>
                  <td className="px-4 py-3">
                    <Badge variant="info">{t("laboratoryResult.status.verified")}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{result.recordVersion}</td>
                  <td className="px-4 py-3 text-right">
                    {canPrepare ? (
                      <Button type="button" disabled={pending} onClick={() => handlePrepare(result.id, result.recordVersion)}>
                        {t("laboratoryReportRelease.actions.prepare")}
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {pendingReleases.map((release) => (
                <tr key={release.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-teal-700">
                    {release.reportNumber.startsWith("QUEUED-") ? "—" : release.reportNumber}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{release.labResult.labOrder.orderNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{release.labResult.labOrder.patient.fullName}</td>
                  <td className="px-4 py-3 text-slate-600">{release.labResult.labOrderTest.testName}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(release.status)}>
                      {t(`laboratoryReportRelease.status.${release.status === "RELEASE_PENDING" ? "releasePending" : release.status.toLowerCase()}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{release.labResult.recordVersion}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link href={`/lab/report-release/${release.id}`}>
                      <Button type="button" variant="secondary">{t("laboratoryReportRelease.actions.review")}</Button>
                    </Link>
                    {canAuthorize ? (
                      <Button
                        type="button"
                        disabled={pending}
                        onClick={() => handleAuthorize(release.id, release.labResult.recordVersion, release.stateVersion)}
                      >
                        {t("laboratoryReportRelease.actions.authorizeRelease")}
                      </Button>
                    ) : null}
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
