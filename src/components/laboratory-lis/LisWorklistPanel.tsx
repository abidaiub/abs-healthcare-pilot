"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  ingestAnalyzerMessageAction,
  reconcileImportMessageAction,
  type LabLisActionResult,
} from "@/app/actions/tenant-lab-lis";
import { Badge, Button, Card, CardBody, Input, Select, Textarea } from "@/components/ui";
import type { AnalyzerImportChannel, AnalyzerImportStatus } from "@/generated/prisma/client";
import {
  ANALYZER_IMPORT_CHANNEL_I18N,
  ANALYZER_IMPORT_ERROR_I18N,
  ANALYZER_IMPORT_STATUS_I18N,
  isReconcilable,
} from "@/lib/laboratory-lis/constants";
import { useI18n } from "@/lib/i18n/client";

export type LisQueueRow = {
  id: string;
  messageControlId: string;
  machineSampleId: string;
  machineTestCode: string | null;
  importChannel: AnalyzerImportChannel;
  processedStatus: AnalyzerImportStatus;
  rawPayload: string;
  receivedAt: Date;
  processedAt: Date | null;
  attemptCount: number;
  analyzer: { analyzerCode: string; machineName: string } | null;
  labSample: { accessionNumber: string } | null;
  labOrderTest: { testName: string } | null;
  labResult: { id: string; status: string } | null;
  errors: Array<{
    id: string;
    errorCode: keyof typeof ANALYZER_IMPORT_ERROR_I18N;
    errorMessage: string;
    resolvedAt: Date | null;
  }>;
};

const CHANNELS: AnalyzerImportChannel[] = ["HL7", "ASTM", "MIDDLEWARE", "API", "CSV"];

function statusVariant(status: AnalyzerImportStatus) {
  if (status === "SUCCESS" || status === "RECONCILED") return "success" as const;
  if (status === "QUARANTINED" || status === "ERROR") return "danger" as const;
  if (status === "DUPLICATE") return "warning" as const;
  return "info" as const;
}

function formatDateTime(value: Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function LisWorklistPanel({
  rows,
  canImport,
  canReconcile,
}: {
  rows: LisQueueRow[];
  canImport: boolean;
  canReconcile: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | AnalyzerImportStatus>("ALL");
  const [channel, setChannel] = useState<AnalyzerImportChannel>("HL7");
  const [rawPayload, setRawPayload] = useState("");
  const [reconcileId, setReconcileId] = useState<string | null>(null);
  const [correctedSampleId, setCorrectedSampleId] = useState("");
  const [correctedFromCode, setCorrectedFromCode] = useState("");
  const [correctedToCode, setCorrectedToCode] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");

  const visibleRows = useMemo(
    () => (statusFilter === "ALL" ? rows : rows.filter((row) => row.processedStatus === statusFilter)),
    [rows, statusFilter],
  );

  function handleResult(result: LabLisActionResult, successMessageKey: string) {
    if (!result.ok) {
      setNotice(null);
      setError(
        t(`laboratoryLis.errors.${result.errorCode}`, t("laboratoryLis.errors.generic")) +
          (result.errorMessage ? ` (${result.errorMessage})` : ""),
      );
      router.refresh();
      return;
    }
    setError(null);
    setNotice(t(successMessageKey));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {notice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}

      <Card>
        <CardBody className="space-y-3 text-sm text-slate-600">
          <p>{t("laboratoryLis.hints.matchingKey")}</p>
          <p>{t("laboratoryLis.hints.idempotency")}</p>
        </CardBody>
      </Card>

      {canImport ? (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("laboratoryLis.sections.simulate")}</h2>
          </div>
          <CardBody className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
              <Select
                label={t("laboratoryLis.fields.channel")}
                value={channel}
                onChange={(event) => setChannel(event.target.value as AnalyzerImportChannel)}
              >
                {CHANNELS.map((option) => (
                  <option key={option} value={option}>
                    {t(ANALYZER_IMPORT_CHANNEL_I18N[option])}
                  </option>
                ))}
              </Select>
              <Textarea
                label={t("laboratoryLis.fields.rawPayload")}
                rows={6}
                value={rawPayload}
                onChange={(event) => setRawPayload(event.target.value)}
              />
            </div>
            <Button
              type="button"
              disabled={pending || !rawPayload.trim()}
              onClick={() =>
                startTransition(async () => {
                  const result = await ingestAnalyzerMessageAction({ channel, rawPayload });
                  if (result.ok) setRawPayload("");
                  handleResult(result, "laboratoryLis.messages.imported");
                })
              }
            >
              {t("laboratoryLis.actions.receiveMessage")}
            </Button>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardBody>
          <Select
            label={t("laboratoryLis.fields.status")}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "ALL" | AnalyzerImportStatus)}
          >
            <option value="ALL">{t("common.all", "All")}</option>
            {(Object.keys(ANALYZER_IMPORT_STATUS_I18N) as AnalyzerImportStatus[]).map((status) => (
              <option key={status} value={status}>
                {t(ANALYZER_IMPORT_STATUS_I18N[status])}
              </option>
            ))}
          </Select>
        </CardBody>
      </Card>

      {!visibleRows.length ? (
        <Card>
          <CardBody className="text-sm text-slate-600">{t("laboratoryLis.messages.queueEmpty")}</CardBody>
        </Card>
      ) : (
        visibleRows.map((row) => {
          const openError = row.errors.find((entry) => !entry.resolvedAt) ?? row.errors[0] ?? null;
          const showReconcile = canReconcile && isReconcilable(row.processedStatus);
          return (
            <Card key={row.id}>
              <CardBody className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">
                      {t("laboratoryLis.fields.machineSampleId")}: {row.machineSampleId}
                    </p>
                    <p className="text-sm text-slate-600">
                      {t("laboratoryLis.fields.messageControlId")}: {row.messageControlId}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t("laboratoryLis.fields.analyzer")}:{" "}
                      {row.analyzer ? `${row.analyzer.machineName} (${row.analyzer.analyzerCode})` : "—"} ·{" "}
                      {t("laboratoryLis.fields.receivedAt")}: {formatDateTime(row.receivedAt)} ·{" "}
                      {t("laboratoryLis.fields.attemptCount")}: {row.attemptCount}
                    </p>
                    {row.labOrderTest || row.labSample ? (
                      <p className="text-xs text-slate-500">
                        {t("laboratoryLis.fields.test")}: {row.labOrderTest?.testName ?? "—"} ·{" "}
                        {t("laboratoryLis.fields.sample")}: {row.labSample?.accessionNumber ?? "—"}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">{t(ANALYZER_IMPORT_CHANNEL_I18N[row.importChannel])}</Badge>
                    <Badge variant={statusVariant(row.processedStatus)}>
                      {t(ANALYZER_IMPORT_STATUS_I18N[row.processedStatus])}
                    </Badge>
                  </div>
                </div>

                {openError ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <p className="font-medium">{t(ANALYZER_IMPORT_ERROR_I18N[openError.errorCode])}</p>
                    <p className="text-xs">{openError.errorMessage}</p>
                    {openError.resolvedAt ? (
                      <p className="text-xs text-emerald-700">
                        {t("laboratoryLis.status.reconciled")}: {formatDateTime(openError.resolvedAt)}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <details className="rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-600">
                  <summary className="cursor-pointer font-medium text-slate-700">
                    {t("laboratoryLis.sections.rawPayload")}
                  </summary>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all">{row.rawPayload}</pre>
                </details>

                <div className="flex flex-wrap gap-2">
                  {row.labResult ? (
                    <Link href={`/lab/result-entry/${row.labResult.id}`}>
                      <Button type="button" variant="ghost">
                        {t("laboratoryLis.actions.viewResult")}
                      </Button>
                    </Link>
                  ) : null}
                  {showReconcile ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setReconcileId(reconcileId === row.id ? null : row.id);
                        setCorrectedSampleId(row.machineSampleId);
                        setCorrectedFromCode(row.machineTestCode ?? "");
                        setCorrectedToCode("");
                        setResolutionNote("");
                      }}
                    >
                      {t("laboratoryLis.sections.reconcile")}
                    </Button>
                  ) : null}
                </div>

                {showReconcile && reconcileId === row.id ? (
                  <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-600">{t("laboratoryLis.hints.reconcile")}</p>
                    <div className="grid gap-4 lg:grid-cols-3">
                      <Input
                        label={t("laboratoryLis.fields.correctedSampleId")}
                        value={correctedSampleId}
                        onChange={(event) => setCorrectedSampleId(event.target.value)}
                      />
                      <Input
                        label={t("laboratoryLis.fields.machineTestCode")}
                        value={correctedFromCode}
                        onChange={(event) => setCorrectedFromCode(event.target.value)}
                      />
                      <Input
                        label={t("laboratoryLis.fields.correctedTestCode")}
                        value={correctedToCode}
                        onChange={(event) => setCorrectedToCode(event.target.value)}
                      />
                    </div>
                    <Textarea
                      label={t("laboratoryLis.fields.resolutionNote")}
                      rows={2}
                      value={resolutionNote}
                      onChange={(event) => setResolutionNote(event.target.value)}
                    />
                    <Button
                      type="button"
                      disabled={pending || !resolutionNote.trim()}
                      onClick={() =>
                        startTransition(async () => {
                          const machineTestCodeMap =
                            correctedFromCode.trim() && correctedToCode.trim()
                              ? { [correctedFromCode.trim()]: correctedToCode.trim() }
                              : undefined;
                          const result = await reconcileImportMessageAction({
                            queueId: row.id,
                            machineSampleId: correctedSampleId.trim() || undefined,
                            machineTestCodeMap,
                            resolutionNote,
                          });
                          if (result.ok) setReconcileId(null);
                          handleResult(result, "laboratoryLis.messages.reconciled");
                        })
                      }
                    >
                      {t("laboratoryLis.actions.reconcile")}
                    </Button>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          );
        })
      )}
    </div>
  );
}
