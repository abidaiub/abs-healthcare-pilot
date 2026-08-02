"use client";

import { useState, useTransition } from "react";
import {
  downloadPortalReportAction,
  recordPortalViewAction,
  type PortalReportsData,
} from "@/app/actions/portal-reports";
import { portalLogoutAction } from "@/app/actions/portal-auth";
import { Badge, Button, Card, CardBody } from "@/components/ui";

function formatDateTime(value: Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function triggerDownload(fileName: string, base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function PortalReportsPanel({ data }: { data: PortalReportsData }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const delegatedPatients = data.accessiblePatients.filter((row) => row.relationship !== "SELF");

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-900">{data.patientName}</p>
            <p className="text-sm text-slate-600">Patient ID: {data.patientNumber}</p>
            <p className="text-xs text-slate-500">
              Session expires at {formatDateTime(data.expiresAt)}
            </p>
            {delegatedPatients.length ? (
              <p className="mt-2 text-xs text-slate-500">
                Family access granted for:{" "}
                {delegatedPatients
                  .map((row) => `${row.patientName} (${row.relationship.toLowerCase()})`)
                  .join(", ")}
              </p>
            ) : null}
          </div>
          <form action={portalLogoutAction}>
            <Button type="submit" variant="secondary">
              Sign out
            </Button>
          </form>
        </CardBody>
      </Card>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error === "PORTAL_NOT_AUTHENTICATED"
            ? "Your session has expired. Please sign in again."
            : "This report is not available for download."}
        </div>
      ) : null}

      {!data.reports.length ? (
        <Card>
          <CardBody className="text-sm text-slate-600">
            No released reports are available yet. Reports appear here only after the laboratory
            verifies and releases them.
          </CardBody>
        </Card>
      ) : (
        data.reports.map((report) => (
          <Card key={report.releaseId}>
            <CardBody className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{report.testName}</p>
                  <p className="text-sm text-slate-600">Report: {report.reportNumber}</p>
                  <p className="text-xs text-slate-500">
                    {report.patientName} · {report.branchName}
                  </p>
                  <p className="text-xs text-slate-500">
                    Released: {formatDateTime(report.releasedAt)} · Version {report.versionNumber}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">Released</Badge>
                  {report.isSuperseded ? <Badge variant="warning">Superseded</Badge> : null}
                </div>
              </div>
              <Button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await recordPortalViewAction(report.releaseId);
                    const result = await downloadPortalReportAction(report.releaseId);
                    if (!result.ok) {
                      setError(result.errorCode);
                      return;
                    }
                    setError(null);
                    triggerDownload(result.fileName, result.base64);
                  })
                }
              >
                Download PDF
              </Button>
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
