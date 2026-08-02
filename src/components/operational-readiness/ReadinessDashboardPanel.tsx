"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  declareReadyForFirstPatientAction,
  refreshReadinessSnapshotAction,
} from "@/app/actions/tenant-operational-readiness";
import { Badge, Button, Card, CardBody, CardHeader } from "@/components/ui";
import type { OperationalReadinessReport } from "@/lib/operational-readiness/types";

function toneVariant(tone: "green" | "yellow" | "red") {
  if (tone === "green") return "success" as const;
  if (tone === "yellow") return "warning" as const;
  return "danger" as const;
}

export function ReadinessDashboardPanel({
  report,
  canApprove,
}: {
  report: OperationalReadinessReport;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function declareReady() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await declareReadyForFirstPatientAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(
        `READY FOR FIRST PATIENT declared · snapshot score ${result.data?.scorePercent}%`,
      );
      router.refresh();
    });
  }

  function refreshSnapshot() {
    setError(null);
    startTransition(async () => {
      const result = await refreshReadinessSnapshotAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(`Operational readiness snapshot saved (${result.data?.scorePercent}%)`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Overall Readiness Score</p>
            <p className="mt-1 text-5xl font-semibold tracking-tight text-slate-900">
              {report.scorePercent}%
            </p>
            <div className="mt-3">
              <Badge
                variant={
                  report.readyStatus === "READY_FOR_FIRST_PATIENT"
                    ? "success"
                    : "danger"
                }
              >
                {report.readyStatus === "READY_FOR_FIRST_PATIENT"
                  ? "READY FOR FIRST PATIENT"
                  : "NOT READY"}
              </Badge>
            </div>
            {report.declaredReady && (
              <p className="mt-2 text-sm text-emerald-700">
                Declared ready
                {report.declaredReadyAt
                  ? ` at ${new Date(report.declaredReadyAt).toLocaleString()}`
                  : ""}
                {report.declaredReadyBy ? ` by ${report.declaredReadyBy}` : ""}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={refreshSnapshot}
            >
              Save checklist snapshot
            </Button>
            <Button
              type="button"
              disabled={pending || !canApprove || !report.canDeclareReady}
              onClick={declareReady}
            >
              READY FOR FIRST PATIENT
            </Button>
          </div>
        </CardBody>
      </Card>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {!report.canDeclareReady && (
        <Card>
          <CardHeader
            title="Blocking items"
            description="All blocking checks must be green before go-live."
          />
          <CardBody>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              {report.blockers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Operational Checklist Engine"
          description="Green = ready · Yellow = warning · Red = blocking gap"
        />
        <CardBody className="space-y-3">
          {report.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-lg border border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={toneVariant(item.tone)}>{item.tone.toUpperCase()}</Badge>
                  <p className="font-medium text-slate-900">{item.label}</p>
                  {item.blocking && (
                    <span className="text-xs text-slate-400">blocking</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
              </div>
              {item.href && (
                <Link
                  href={item.href}
                  className="text-sm font-medium text-teal-700 hover:underline"
                >
                  Open
                </Link>
              )}
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
