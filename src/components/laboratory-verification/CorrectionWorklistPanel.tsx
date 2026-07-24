"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  listCorrectionWorklistAction,
  startLabResultCorrectionAction,
  type LabVerificationActionResult,
} from "@/app/actions/tenant-lab-verification";
import { Badge, Button, Card, CardBody } from "@/components/ui";
import {
  CORRECTION_STATUS_I18N,
  REJECTION_REASON_I18N,
  type RejectionReasonCode,
} from "@/lib/laboratory-verification/constants";
import { parseAffectedParameterIds } from "@/lib/laboratory-verification/parameter-ids";
import { useI18n } from "@/lib/i18n/client";

export type CorrectionWorklistRow = Awaited<
  ReturnType<typeof listCorrectionWorklistAction>
>[number];

export function CorrectionWorklistPanel({
  rows,
  canStart,
  canEdit,
}: {
  rows: CorrectionWorklistRow[];
  canStart: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleResult(result: LabVerificationActionResult, resultId?: string) {
    if (!result.ok) {
      setError(t(`laboratoryVerification.errors.${result.errorCode}`, t("laboratoryVerification.errors.generic")));
      return;
    }
    setError(null);
    if (resultId ?? result.resultId) {
      router.push(`/lab/result-entry/${result.resultId}/edit`);
      return;
    }
    router.refresh();
  }

  if (!rows.length) {
    return (
      <Card>
        <CardBody className="text-sm text-slate-600">{t("laboratoryVerification.corrections.empty")}</CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {rows.map((row) => {
        const reasonCode = row.verification.rejectionReasonCode as RejectionReasonCode | null;
        const affectedIds = parseAffectedParameterIds(row.verification.affectedParameterIds);
        return (
          <Card key={row.id}>
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{row.labResult.labOrderTest.testName}</p>
                  <p className="text-sm text-slate-600">
                    {row.labResult.labOrder.patient.fullName} · {row.labResult.labOrder.orderNumber}
                    {row.labResult.labSample ? ` · ${row.labResult.labSample.accessionNumber}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t("laboratoryVerification.fields.rejectedBy")}: {row.verification.verifierDisplayNameSnapshot}
                  </p>
                </div>
                <Badge variant="warning">{t(CORRECTION_STATUS_I18N[row.status])}</Badge>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {reasonCode ? (
                  <p className="font-medium">{t(REJECTION_REASON_I18N[reasonCode])}</p>
                ) : null}
                <p>{row.verification.rejectionReasonText ?? row.reasonText}</p>
                {affectedIds.length > 0 ? (
                  <p className="mt-1 text-xs">
                    {t("laboratoryVerification.fields.affectedParameters")}: {affectedIds.length}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/lab/result-entry/${row.labResultId}`}>
                  <Button type="button" variant="ghost">
                    {t("laboratoryVerification.actions.viewResult")}
                  </Button>
                </Link>
                {row.status === "OPEN" && canStart ? (
                  <Button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        handleResult(await startLabResultCorrectionAction(row.id), row.labResultId);
                      })
                    }
                  >
                    {t("laboratoryVerification.actions.startCorrection")}
                  </Button>
                ) : null}
                {canEdit && row.status === "IN_PROGRESS" ? (
                  <Link href={`/lab/result-entry/${row.labResultId}/edit`}>
                    <Button type="button">{t("laboratoryVerification.actions.continueCorrection")}</Button>
                  </Link>
                ) : null}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
