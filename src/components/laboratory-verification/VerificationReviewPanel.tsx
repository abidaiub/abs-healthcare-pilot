"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  getVerificationReviewAction,
  rejectLabResultForCorrectionAction,
  startVerificationReviewAction,
  verifyLabResultAction,
  type LabVerificationActionResult,
} from "@/app/actions/tenant-lab-verification";
import { Badge, Button, Card, CardBody, Textarea } from "@/components/ui";
import { ABNORMAL_FLAG_I18N } from "@/lib/laboratory-result/constants";
import {
  REJECTION_REASON_CODES,
  REJECTION_REASON_I18N,
  type RejectionReasonCode,
} from "@/lib/laboratory-verification/constants";
import { useI18n } from "@/lib/i18n/client";

export type VerificationReviewData = Awaited<ReturnType<typeof getVerificationReviewAction>>;

function formatValue(item: VerificationReviewData["items"][number]): string {
  if (item.numericValue != null) return String(item.numericValue);
  if (item.textValue) return item.textValue;
  if (item.choiceValue) return item.choiceValue;
  if (item.booleanValue != null) return item.booleanValue ? "Yes" : "No";
  return "—";
}

export function VerificationReviewPanel({
  result,
  canVerify,
  canReject,
  currentUserId,
}: {
  result: VerificationReviewData;
  canVerify: boolean;
  canReject: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [recordVersion] = useState(result.recordVersion);
  const [verificationComment, setVerificationComment] = useState("");
  const [selfApprovalOverride, setSelfApprovalOverride] = useState(false);
  const [selfApprovalReason, setSelfApprovalReason] = useState("");
  const [rejectReasonCode, setRejectReasonCode] = useState<RejectionReasonCode>("VALUE_RECHECK_REQUIRED");
  const [rejectReasonText, setRejectReasonText] = useState("");
  const [selectedParameterIds, setSelectedParameterIds] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const isSelfVerifier =
    result.enteredById === currentUserId || result.entryCompletedById === currentUserId;
  const unacknowledgedEvents = useMemo(
    () => result.criticalEvents.filter((event) => !event.acknowledgedAt),
    [result.criticalEvents],
  );

  useEffect(() => {
    startTransition(async () => {
      await startVerificationReviewAction(result.id);
    });
  }, [result.id]);

  function handleResult(actionResult: LabVerificationActionResult) {
    if (!actionResult.ok) {
      setError(t(`laboratoryVerification.errors.${actionResult.errorCode}`, t("laboratoryVerification.errors.generic")));
      return;
    }
    setError(null);
    router.push("/lab/verification");
    router.refresh();
  }

  function toggleParameter(itemId: string) {
    setSelectedParameterIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
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
        <div className="flex flex-wrap gap-2">
          <Link href={`/lab/verification/${result.id}/history`}>
            <Button type="button" variant="ghost">{t("laboratoryVerification.actions.viewHistory")}</Button>
          </Link>
          <Link href="/lab/verification">
            <Button type="button" variant="ghost">{t("laboratoryVerification.actions.backToWorklist")}</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {isSelfVerifier ? (
        <Card>
          <CardBody className="space-y-3 text-sm text-amber-800">
            <p>{t("laboratoryVerification.review.selfVerifierWarning")}</p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selfApprovalOverride}
                onChange={(event) => setSelfApprovalOverride(event.target.checked)}
              />
              {t("laboratoryVerification.review.selfApprovalOverride")}
            </label>
            {selfApprovalOverride ? (
              <Textarea
                value={selfApprovalReason}
                onChange={(event) => setSelfApprovalReason(event.target.value)}
                placeholder={t("laboratoryVerification.fields.selfApprovalReason")}
              />
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {unacknowledgedEvents.length > 0 ? (
        <Card>
          <CardBody className="text-sm text-red-700">
            {t("laboratoryVerification.review.unacknowledgedCriticalPrefix")} {unacknowledgedEvents.length}
          </CardBody>
        </Card>
      ) : null}

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
                  {canReject ? <th className="py-2 pr-2">{t("laboratoryVerification.fields.flag")}</th> : null}
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
                    {canReject ? (
                      <td className="py-2 pr-2">
                        <input
                          type="checkbox"
                          checked={selectedParameterIds.includes(item.id)}
                          onChange={() => toggleParameter(item.id)}
                        />
                      </td>
                    ) : null}
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

      <Card>
        <CardBody className="space-y-4">
          <Textarea
            value={verificationComment}
            onChange={(event) => setVerificationComment(event.target.value)}
            placeholder={t("laboratoryVerification.fields.verificationComment")}
          />
          {canVerify ? (
            <Button
              type="button"
              disabled={pending || (isSelfVerifier && selfApprovalOverride && !selfApprovalReason.trim())}
              onClick={() =>
                startTransition(async () => {
                  handleResult(
                    await verifyLabResultAction({
                      resultId: result.id,
                      recordVersion,
                      verificationComment,
                      selfApprovalOverride: isSelfVerifier ? selfApprovalOverride : undefined,
                      selfApprovalReason: isSelfVerifier ? selfApprovalReason : undefined,
                    }),
                  );
                })
              }
            >
              {t("laboratoryVerification.actions.verify")}
            </Button>
          ) : null}
        </CardBody>
      </Card>

      {canReject ? (
        <Card>
          <CardBody className="space-y-4">
            <h3 className="font-semibold text-slate-900">{t("laboratoryVerification.sections.rejectForCorrection")}</h3>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={rejectReasonCode}
              onChange={(event) => setRejectReasonCode(event.target.value as RejectionReasonCode)}
            >
              {REJECTION_REASON_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(REJECTION_REASON_I18N[code])}
                </option>
              ))}
            </select>
            <Textarea
              value={rejectReasonText}
              onChange={(event) => setRejectReasonText(event.target.value)}
              placeholder={t("laboratoryVerification.fields.rejectionReasonText")}
            />
            {selectedParameterIds.length > 0 ? (
              <p className="text-xs text-slate-500">
                {t("laboratoryVerification.fields.selectedParameters")}: {selectedParameterIds.length}
              </p>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              disabled={pending || !rejectReasonText.trim()}
              onClick={() =>
                startTransition(async () => {
                  handleResult(
                    await rejectLabResultForCorrectionAction({
                      resultId: result.id,
                      recordVersion,
                      reasonCode: rejectReasonCode,
                      reasonText: rejectReasonText,
                      affectedParameterIds: selectedParameterIds,
                      verificationComment,
                    }),
                  );
                })
              }
            >
              {t("laboratoryVerification.actions.rejectForCorrection")}
            </Button>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
