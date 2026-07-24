"use client";

import Link from "next/link";
import { getVerificationHistoryAction } from "@/app/actions/tenant-lab-verification";
import { Badge, Button, Card, CardBody } from "@/components/ui";
import {
  REJECTION_REASON_I18N,
  VERIFICATION_DECISION_I18N,
  type RejectionReasonCode,
} from "@/lib/laboratory-verification/constants";
import { useI18n } from "@/lib/i18n/client";

export type VerificationHistoryEntry = Awaited<ReturnType<typeof getVerificationHistoryAction>>[number];

function formatDate(value: Date | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function VerificationHistoryPanel({
  resultId,
  entries,
}: {
  resultId: string;
  entries: VerificationHistoryEntry[];
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link href={`/lab/verification/${resultId}`}>
          <Button type="button" variant="ghost">{t("laboratoryVerification.actions.backToReview")}</Button>
        </Link>
        <Link href="/lab/verification">
          <Button type="button" variant="ghost">{t("laboratoryVerification.actions.backToWorklist")}</Button>
        </Link>
      </div>

      {!entries.length ? (
        <Card>
          <CardBody className="text-sm text-slate-600">{t("laboratoryVerification.history.empty")}</CardBody>
        </Card>
      ) : (
        entries.map((entry) => {
          const reasonCode = entry.rejectionReasonCode as RejectionReasonCode | null;
          return (
            <Card key={entry.id}>
              <CardBody className="space-y-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">
                    {t("laboratoryVerification.history.sequenceLabel")} #{entry.verificationSequence}
                  </p>
                  <Badge variant={entry.decision === "VERIFIED" ? "success" : "warning"}>
                    {t(VERIFICATION_DECISION_I18N[entry.decision])}
                  </Badge>
                </div>
                <p>
                  <span className="font-medium">{t("laboratoryVerification.fields.verifier")}: </span>
                  {entry.verifierDisplayNameSnapshot}
                  {entry.verifierDesignationSnapshot ? ` · ${entry.verifierDesignationSnapshot}` : ""}
                </p>
                <p>
                  <span className="font-medium">{t("laboratoryVerification.fields.resultVersion")}: </span>
                  {entry.resultVersionReviewed}
                </p>
                {entry.decision === "VERIFIED" ? (
                  <p>
                    <span className="font-medium">{t("laboratoryVerification.fields.verifiedAt")}: </span>
                    {formatDate(entry.verifiedAt)}
                  </p>
                ) : (
                  <>
                    <p>
                      <span className="font-medium">{t("laboratoryVerification.fields.rejectedAt")}: </span>
                      {formatDate(entry.rejectedAt)}
                    </p>
                    {reasonCode ? (
                      <p>
                        <span className="font-medium">{t("laboratoryVerification.fields.reason")}: </span>
                        {t(REJECTION_REASON_I18N[reasonCode])}
                      </p>
                    ) : null}
                    {entry.rejectionReasonText ? <p>{entry.rejectionReasonText}</p> : null}
                  </>
                )}
                {entry.verificationComment ? (
                  <p>
                    <span className="font-medium">{t("laboratoryVerification.fields.comment")}: </span>
                    {entry.verificationComment}
                  </p>
                ) : null}
                {entry.selfApprovalOverride ? (
                  <p className="text-amber-700">
                    {t("laboratoryVerification.history.selfApproval")}: {entry.selfApprovalReason ?? "—"}
                  </p>
                ) : null}
              </CardBody>
            </Card>
          );
        })
      )}
    </div>
  );
}
