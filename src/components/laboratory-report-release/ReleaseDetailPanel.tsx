"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  downloadReportPdfAction,
  initiateAmendmentAction,
  printReportAction,
  publishPortalAction,
  withdrawReleaseAction,
} from "@/app/actions/tenant-lab-report-release";
import { Badge, Button, Card, CardBody, Input } from "@/components/ui";
import { useI18n } from "@/lib/i18n/client";
import type { LabReportSnapshot } from "@/lib/laboratory-report-release/snapshot";

type ReleaseDetailProps = {
  release: {
    id: string;
    reportNumber: string;
    status: string;
    portalPublishEligible: boolean;
    portalPublishedAt: Date | null;
    printCount: number;
    downloadCount: number;
    releasedAt: Date | null;
    labResult: {
      id: string;
      recordVersion: number;
      labOrder: {
        orderNumber: string;
        patient: { patientNumber: string; fullName: string };
      };
      labOrderTest: { testName: string };
    };
    currentVersion: {
      id: string;
      versionNumber: number;
      releasedAt: Date | null;
    } | null;
    versions: Array<{ id: string; versionNumber: number; status: string; releasedAt: Date | null }>;
    verificationTokens: Array<{ token: string }>;
  };
  snapshot: LabReportSnapshot | null;
  permissions: {
    canPrint: boolean;
    canDownload: boolean;
    canPublishPortal: boolean;
    canWithdraw: boolean;
    canAmend: boolean;
  };
};

function statusVariant(status: string) {
  if (status === "RELEASED") return "success" as const;
  if (status === "RELEASE_PENDING" || status === "AMENDED") return "warning" as const;
  if (status === "WITHDRAWN") return "danger" as const;
  return "default" as const;
}

export function ReleaseDetailPanel({ release, snapshot, permissions }: ReleaseDetailProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [reprintReason, setReprintReason] = useState("");
  const [withdrawReason, setWithdrawReason] = useState("");
  const [amendReason, setAmendReason] = useState("");

  function runAction(action: () => Promise<{ ok: boolean; errorCode?: string }>, refresh = true) {
    setErrorCode(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setErrorCode(result.errorCode ?? "generic");
        return;
      }
      if (refresh) router.refresh();
    });
  }

  function handlePrint() {
    runAction(async () => {
      const result = await printReportAction(release.id, release.printCount > 0 ? reprintReason : undefined);
      if (result.ok) window.open(`/lab/report-release/${release.id}/print`, "_blank");
      return result;
    }, false);
  }

  function handleDownload() {
    runAction(async () => {
      const result = await downloadReportPdfAction(release.id);
      if (!result.ok) return result;
      const bytes = Uint8Array.from(atob(result.base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      router.refresh();
      return { ok: true };
    }, false);
  }

  const verifyUrl =
    release.verificationTokens[0]?.token != null
      ? `/verify/report/${release.verificationTokens[0].token}`
      : null;

  return (
    <div className="space-y-6">
      {errorCode ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {t(`laboratoryReportRelease.errors.${errorCode}`, t("laboratoryReportRelease.errors.generic"))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={statusVariant(release.status)}>
          {t(`laboratoryReportRelease.status.${release.status === "RELEASE_PENDING" ? "releasePending" : release.status.toLowerCase()}`)}
        </Badge>
        {release.portalPublishEligible ? <Badge variant="success">{t("laboratoryReportRelease.badges.portalEligible")}</Badge> : null}
        {release.portalPublishedAt ? <Badge variant="info">{t("laboratoryReportRelease.badges.portalPublished")}</Badge> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardBody><p className="text-sm text-slate-500">{t("laboratoryReportRelease.fields.reportNumber")}</p><p className="mt-1 text-lg font-semibold">{release.reportNumber.startsWith("QUEUED-") ? "—" : release.reportNumber}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-slate-500">{t("laboratoryReportRelease.fields.version")}</p><p className="mt-1 text-lg font-semibold">{release.currentVersion?.versionNumber ?? "—"}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-slate-500">{t("laboratoryReportRelease.fields.printCount")}</p><p className="mt-1 text-lg font-semibold">{release.printCount}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-slate-500">{t("laboratoryReportRelease.fields.downloadCount")}</p><p className="mt-1 text-lg font-semibold">{release.downloadCount}</p></CardBody></Card>
      </div>

      <Card>
        <CardBody className="grid gap-2 text-sm md:grid-cols-2">
          <p><strong>{t("laboratoryReportRelease.fields.patient")}:</strong> {release.labResult.labOrder.patient.fullName}</p>
          <p><strong>{t("laboratoryReportRelease.fields.orderNumber")}:</strong> {release.labResult.labOrder.orderNumber}</p>
          <p><strong>{t("laboratoryReportRelease.fields.test")}:</strong> {release.labResult.labOrderTest.testName}</p>
          <p><strong>{t("laboratoryReportRelease.fields.resultVersion")}:</strong> {release.labResult.recordVersion}</p>
        </CardBody>
      </Card>

      {snapshot ? (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("laboratoryReportRelease.sections.preview")}</h2>
          </div>
          <CardBody className="space-y-2 text-sm">
            <p>{snapshot.tenant.name} · {snapshot.branch.name}</p>
            <p>{snapshot.patient.fullName} · {snapshot.test.testName}</p>
            <p>{t("laboratoryReportRelease.fields.parameterCount")}: {snapshot.results.length}</p>
            {verifyUrl ? <p className="text-xs text-slate-500">{t("laboratoryReportRelease.fields.qrVerify")}: {verifyUrl}</p> : null}
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("laboratoryReportRelease.sections.actions")}</h2>
        </div>
        <CardBody className="space-y-4">
          {release.printCount > 0 ? (
            <Input label={t("laboratoryReportRelease.fields.reprintReason")} value={reprintReason} onChange={(e) => setReprintReason(e.target.value)} />
          ) : null}
          <div className="flex flex-wrap gap-2">
            {permissions.canPrint && release.status === "RELEASED" ? (
              <>
                <Button type="button" disabled={pending} onClick={handlePrint}>{t("laboratoryReportRelease.actions.print")}</Button>
                <Link href={`/lab/report-release/${release.id}/print`} target="_blank">
                  <Button type="button" variant="secondary">{t("laboratoryReportRelease.actions.openPrintView")}</Button>
                </Link>
              </>
            ) : null}
            {permissions.canDownload && release.status === "RELEASED" ? (
              <Button type="button" variant="secondary" disabled={pending} onClick={handleDownload}>{t("laboratoryReportRelease.actions.downloadPdf")}</Button>
            ) : null}
            {permissions.canPublishPortal && release.status === "RELEASED" && release.portalPublishEligible && !release.portalPublishedAt ? (
              <Button type="button" variant="secondary" disabled={pending} onClick={() => runAction(() => publishPortalAction(release.id))}>
                {t("laboratoryReportRelease.actions.publishPortal")}
              </Button>
            ) : null}
          </div>

          {permissions.canWithdraw && release.status === "RELEASED" ? (
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <Input label={t("laboratoryReportRelease.fields.withdrawReason")} value={withdrawReason} onChange={(e) => setWithdrawReason(e.target.value)} />
              <Button type="button" variant="ghost" disabled={pending} onClick={() => runAction(() => withdrawReleaseAction(release.id, withdrawReason))}>
                {t("laboratoryReportRelease.actions.withdraw")}
              </Button>
            </div>
          ) : null}

          {permissions.canAmend && release.status === "RELEASED" ? (
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <Input label={t("laboratoryReportRelease.fields.amendReason")} value={amendReason} onChange={(e) => setAmendReason(e.target.value)} />
              <Button type="button" variant="ghost" disabled={pending} onClick={() => runAction(() => initiateAmendmentAction(release.id, amendReason, release.labResult.recordVersion))}>
                {t("laboratoryReportRelease.actions.amend")}
              </Button>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("laboratoryReportRelease.sections.versionHistory")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{t("laboratoryReportRelease.fields.version")}</th>
                <th className="px-4 py-3">{t("laboratoryReportRelease.fields.status")}</th>
                <th className="px-4 py-3">{t("laboratoryReportRelease.fields.releasedAt")}</th>
              </tr>
            </thead>
            <tbody>
              {release.versions.map((version) => (
                <tr key={version.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">{version.versionNumber}</td>
                  <td className="px-4 py-3">{version.status}</td>
                  <td className="px-4 py-3">{version.releasedAt ? new Date(version.releasedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Link href="/lab/report-release">
        <Button type="button" variant="ghost">{t("laboratoryReportRelease.actions.backToQueue")}</Button>
      </Link>
    </div>
  );
}
