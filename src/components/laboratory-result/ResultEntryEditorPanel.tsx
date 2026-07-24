"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  acknowledgeCriticalValueAction,
  completeLabResultEntryAction,
  saveLabResultDraftAction,
  type LabResultActionResult,
  type LabResultEntryData,
  type SaveLabResultItemInput,
} from "@/app/actions/tenant-lab-results";
import { Badge, Button, Card, CardBody, Input, Textarea } from "@/components/ui";
import { ABNORMAL_FLAG_I18N, LAB_RESULT_STATUS_I18N } from "@/lib/laboratory-result/constants";
import { useI18n } from "@/lib/i18n/client";

type ItemDraft = SaveLabResultItemInput & {
  parameterName: string;
  resultType: string;
  unitSnapshot: string | null;
  referenceRangeSnapshot: string | null;
  abnormalFlag: string;
  isCritical: boolean;
  isRequired: boolean;
};

function itemToDraft(item: LabResultEntryData["items"][number]): ItemDraft {
  return {
    itemId: item.id,
    parameterName: item.parameterName,
    resultType: item.resultType,
    unitSnapshot: item.unitSnapshot,
    referenceRangeSnapshot: item.referenceRangeSnapshot,
    abnormalFlag: item.abnormalFlag,
    isCritical: item.isCritical,
    isRequired: item.isRequired,
    numericValue: item.numericValue != null ? Number(item.numericValue) : null,
    textValue: item.textValue,
    choiceValue: item.choiceValue,
    booleanValue: item.booleanValue,
    technicianComment: item.technicianComment,
  };
}

export function ResultEntryEditorPanel({
  result,
  canSave,
  canComplete,
  canAcknowledgeCritical,
}: {
  result: LabResultEntryData;
  canSave: boolean;
  canComplete: boolean;
  canAcknowledgeCritical: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [recordVersion, setRecordVersion] = useState(result.recordVersion);
  const [internalNote, setInternalNote] = useState(result.internalNote ?? "");
  const [reportNote, setReportNote] = useState(result.reportNote ?? "");
  const [items, setItems] = useState<ItemDraft[]>(() => result.items.map(itemToDraft));
  const [pending, startTransition] = useTransition();

  const unacknowledgedEvents = useMemo(
    () => result.criticalEvents.filter((event) => !event.acknowledgedAt),
    [result.criticalEvents],
  );

  function handleResult(actionResult: LabResultActionResult, redirectToDetail = false) {
    if (!actionResult.ok) {
      setError(t(`laboratoryResult.errors.${actionResult.errorCode}`, t("laboratoryResult.errors.generic")));
      return;
    }
    setError(null);
    if (actionResult.recordVersion != null) {
      setRecordVersion(actionResult.recordVersion);
    }
    if (redirectToDetail) {
      router.push(`/lab/result-entry/${result.id}`);
      return;
    }
    router.refresh();
  }

  function updateItem(itemId: string, patch: Partial<ItemDraft>) {
    setItems((current) => current.map((row) => (row.itemId === itemId ? { ...row, ...patch } : row)));
  }

  function saveDraft(thenComplete = false) {
    startTransition(async () => {
      const saveResult = await saveLabResultDraftAction(result.id, {
        internalNote,
        reportNote,
        items: items.map((row) => ({
          itemId: row.itemId,
          numericValue: row.numericValue,
          textValue: row.textValue,
          choiceValue: row.choiceValue,
          booleanValue: row.booleanValue,
          technicianComment: row.technicianComment,
        })),
      });
      if (!saveResult.ok) {
        handleResult(saveResult);
        return;
      }
      if (thenComplete) {
        handleResult(await completeLabResultEntryAction(result.id, saveResult.recordVersion ?? recordVersion), true);
        return;
      }
      handleResult(saveResult);
    });
  }

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
        <CardBody className="space-y-4">
          <h3 className="font-semibold text-slate-900">{t("laboratoryResult.sections.parameters")}</h3>
          {items.map((item) => (
            <div key={item.itemId} className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-2">
              <div>
                <p className="font-medium text-slate-900">
                  {item.parameterName}
                  {item.isRequired ? " *" : ""}
                </p>
                <p className="text-xs text-slate-500">
                  {item.referenceRangeSnapshot ?? t("laboratoryResult.fields.noRange")}
                  {item.unitSnapshot ? ` ${item.unitSnapshot}` : ""}
                </p>
                <Badge variant={item.isCritical ? "danger" : "default"}>
                  {t(ABNORMAL_FLAG_I18N[item.abnormalFlag as keyof typeof ABNORMAL_FLAG_I18N] ?? "laboratoryResult.abnormalFlag.undetermined")}
                </Badge>
              </div>
              <div className="space-y-2">
                {item.resultType === "NUMERIC" || item.resultType === "CALCULATED" ? (
                  <Input
                    type="number"
                    step="any"
                    value={item.numericValue ?? ""}
                    onChange={(event) =>
                      updateItem(item.itemId, {
                        numericValue: event.target.value === "" ? null : Number(event.target.value),
                      })
                    }
                  />
                ) : item.resultType === "BOOLEAN" ? (
                  <select
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={item.booleanValue == null ? "" : item.booleanValue ? "true" : "false"}
                    onChange={(event) =>
                      updateItem(item.itemId, {
                        booleanValue: event.target.value === "" ? null : event.target.value === "true",
                      })
                    }
                  >
                    <option value="">{t("laboratoryResult.fields.select")}</option>
                    <option value="true">{t("laboratoryResult.fields.yes")}</option>
                    <option value="false">{t("laboratoryResult.fields.no")}</option>
                  </select>
                ) : (
                  <Input
                    value={item.textValue ?? item.choiceValue ?? ""}
                    onChange={(event) =>
                      updateItem(item.itemId, {
                        textValue: event.target.value,
                        choiceValue: item.resultType === "OPTION_LIST" ? event.target.value : item.choiceValue,
                      })
                    }
                  />
                )}
                <Input
                  value={item.technicianComment ?? ""}
                  placeholder={t("laboratoryResult.fields.technicianComment")}
                  onChange={(event) => updateItem(item.itemId, { technicianComment: event.target.value })}
                />
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <Textarea
            value={internalNote}
            onChange={(event) => setInternalNote(event.target.value)}
            placeholder={t("laboratoryResult.fields.internalNote")}
          />
          <Textarea
            value={reportNote}
            onChange={(event) => setReportNote(event.target.value)}
            placeholder={t("laboratoryResult.fields.reportNote")}
          />
        </CardBody>
      </Card>

      {unacknowledgedEvents.length > 0 ? (
        <Card>
          <CardBody className="space-y-3">
            <h3 className="font-semibold text-red-700">{t("laboratoryResult.sections.criticalValues")}</h3>
            {unacknowledgedEvents.map((event) => {
              const item = result.items.find((row) => row.id === event.labResultItemId);
              return (
                <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm">{item?.parameterName}</p>
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
        <Link href={`/lab/result-entry/${result.id}`}>
          <Button type="button" variant="ghost">{t("laboratoryResult.actions.viewDetail")}</Button>
        </Link>
        {canSave ? (
          <Button type="button" disabled={pending} onClick={() => saveDraft(false)}>
            {t("laboratoryResult.actions.saveDraft")}
          </Button>
        ) : null}
        {canComplete && unacknowledgedEvents.length === 0 ? (
          <Button type="button" disabled={pending} onClick={() => saveDraft(true)}>
            {t("laboratoryResult.actions.complete")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
