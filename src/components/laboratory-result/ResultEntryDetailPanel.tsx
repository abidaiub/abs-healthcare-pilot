"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  acknowledgeCriticalValueAction,
  cancelLabResultAction,
  completeLabResultEntryAction,
  reopenLabResultEntryAction,
  type LabResultActionResult,
  type LabResultEntryData,
} from "@/app/actions/tenant-lab-results";
import { Badge, Button, Card, CardBody, Textarea } from "@/components/ui";
import {
  ABNORMAL_FLAG_I18N,
  LAB_RESULT_STATUS_I18N,
  canReopenLabResult,
  isLabResultCorrectable,
  isLabResultEditable,
} from "@/lib/laboratory-result/constants";
import { useI18n } from "@/lib/i18n/client";

function formatValue(item: LabResultEntryData["items"][number]): string {
  if (item.numericValue != null) return String(item.numericValue);
  if (item.textValue) return item.textValue;
  if (item.choiceValue) return item.choiceValue;
  if (item.booleanValue != null) return item.booleanValue ? "Yes" : "No";
  return "—";
}

export function ResultEntryDetailPanel({
  result,
  canEdit,
  canComplete,
  canReopen,
  canAcknowledgeCritical,
}: {
  result: LabResultEntryData;
  canEdit: boolean;
  canComplete: boolean;
  canReopen: boolean;
  canAcknowledgeCritical: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [pending, startTransition] = useTransition();

  function handleResult(actionResult: LabResultActionResult) {
    if (!actionResult.ok) {
      setError(t(`laboratoryResult.errors.${actionResult.errorCode}`, t("laboratoryResult.errors.generic")));
      return;
    }
    setError(null);
    router.refresh();
  }

  const editable = isLabResultEditable(result.status);
  const correctable = isLabResultCorrectable(result.status);
  const unacknowledgedEvents = result.criticalEvents.filter((event) => !event.acknowledgedAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-semibold text-teal-700">{result.labOrder.orderNumber}</p>
          <p className="text-sm text-slate-600">
            {result.labOrder.patient.fullName} · {result.labOrderTest.testName}
          </p>
        </div>
        <Badge variant="info">{t(LAB_RESULT_STATUS_I18N[result.status])}</Badge>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <CardBody className="space-y-3 text-sm">
          <p>
            <span className="font-medium">{t("laboratoryResult.fields.accession")}: </span>
            {result.labSample.accessionNumber}
          </p>
          <p>
            <span className="font-medium">{t("laboratoryResult.fields.branch")}: </span>
            {result.labOrder.branch.name}
          </p>
          {result.internalNote ? (
            <p>
              <span className="font-medium">{t("laboratoryResult.fields.internalNote")}: </span>
              {result.internalNote}
            </p>
          ) : null}
          {result.reportNote ? (
            <p>
              <span className="font-medium">{t("laboratoryResult.fields.reportNote")}: </span>
              {result.reportNote}
            </p>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <h3 className="font-semibold text-slate-900">{t("laboratoryResult.sections.parameters")}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2 pr-4">{t("laboratoryResult.fields.parameter")}</th>
                  <th className="py-2 pr-4">{t("laboratoryResult.fields.value")}</th>
                  <th className="py-2 pr-4">{t("laboratoryResult.fields.unit")}</th>
                  <th className="py-2 pr-4">{t("laboratoryResult.fields.referenceRange")}</th>
                  <th className="py-2">{t("laboratoryResult.fields.flag")}</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{item.parameterName}</td>
                    <td className="py-2 pr-4 font-medium">{formatValue(item)}</td>
                    <td className="py-2 pr-4">{item.unitSnapshot ?? "—"}</td>
                    <td className="py-2 pr-4">{item.referenceRangeSnapshot ?? "—"}</td>
                    <td className="py-2">
                      <Badge variant={item.isCritical ? "danger" : "default"}>
                        {t(ABNORMAL_FLAG_I18N[item.abnormalFlag])}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {unacknowledgedEvents.length > 0 ? (
        <Card>
          <CardBody className="space-y-4">
            <h3 className="font-semibold text-red-700">{t("laboratoryResult.sections.criticalValues")}</h3>
            {unacknowledgedEvents.map((event) => {
              const item = result.items.find((row) => row.id === event.labResultItemId);
              return (
                <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm">
                    {item?.parameterName}: {item ? formatValue(item) : "—"}
                  </p>
                  {canAcknowledgeCritical ? (
                    <Button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          handleResult(await acknowledgeCriticalValueAction(event.id));
                        })
                      }
                    >
                      {t("laboratoryResult.actions.acknowledgeCritical")}
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </CardBody>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link href="/lab/result-entry">
          <Button type="button" variant="ghost">{t("laboratoryResult.actions.backToWorklist")}</Button>
        </Link>
        {canEdit && editable ? (
          <Link href={`/lab/result-entry/${result.id}/edit`}>
            <Button type="button">{t("laboratoryResult.actions.edit")}</Button>
          </Link>
        ) : null}
        {canEdit && correctable ? (
          <>
            <Link href={`/lab/result-entry/${result.id}/edit`}>
              <Button type="button">{t("laboratoryVerification.actions.correctResult")}</Button>
            </Link>
            <Link href="/lab/corrections">
              <Button type="button" variant="ghost">{t("laboratoryVerification.actions.openCorrections")}</Button>
            </Link>
          </>
        ) : null}
        {canComplete && editable && unacknowledgedEvents.length === 0 ? (
          <Button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                handleResult(await completeLabResultEntryAction(result.id, result.recordVersion));
              })
            }
          >
            {t("laboratoryResult.actions.complete")}
          </Button>
        ) : null}
      </div>

      {canReopen && canReopenLabResult(result.status) ? (
        <Card>
          <CardBody className="space-y-3">
            <h3 className="font-semibold text-slate-900">{t("laboratoryResult.sections.reopen")}</h3>
            <Textarea
              value={reopenReason}
              onChange={(event) => setReopenReason(event.target.value)}
              placeholder={t("laboratoryResult.fields.reopenReason")}
            />
            <Button
              type="button"
              variant="ghost"
              disabled={pending || !reopenReason.trim()}
              onClick={() =>
                startTransition(async () => {
                  handleResult(await reopenLabResultEntryAction(result.id, reopenReason, result.recordVersion));
                })
              }
            >
              {t("laboratoryResult.actions.reopen")}
            </Button>
          </CardBody>
        </Card>
      ) : null}

      {canEdit && result.status !== "CANCELLED" && result.status !== "VERIFIED" ? (
        <Card>
          <CardBody className="space-y-3">
            <h3 className="font-semibold text-slate-900">{t("laboratoryResult.sections.cancel")}</h3>
            <Textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder={t("laboratoryResult.fields.cancelReason")}
            />
            <Button
              type="button"
              variant="ghost"
              disabled={pending || !cancelReason.trim()}
              onClick={() =>
                startTransition(async () => {
                  handleResult(await cancelLabResultAction(result.id, cancelReason));
                })
              }
            >
              {t("laboratoryResult.actions.cancel")}
            </Button>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
