import { notFound, redirect } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { ResultEntryEditorPanel } from "@/components/laboratory-result/ResultEntryEditorPanel";
import { getLabResultEntryAction } from "@/app/actions/tenant-lab-results";
import { listCorrectionWorklistAction } from "@/app/actions/tenant-lab-verification";
import { isLabResultCorrectable, isLabResultEditable } from "@/lib/laboratory-result/constants";
import { parseAffectedParameterIds } from "@/lib/laboratory-verification/parameter-ids";
import type { RejectionReasonCode } from "@/lib/laboratory-verification/constants";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ resultId: string }> };

export default async function ResultEntryEditPage({ params }: PageProps) {
  const session = await requireTenantPermission("/lab/result-entry");
  const { t } = await getServerI18n(session);
  const { resultId } = await params;
  const result = await getLabResultEntryAction(resultId).catch(() => null);
  if (!result) notFound();

  const correctionMode = isLabResultCorrectable(result.status);
  if (!isLabResultEditable(result.status) && !correctionMode) {
    redirect(`/lab/result-entry/${resultId}`);
  }

  let correctionContext:
    | {
        correctionRequestId: string;
        reasonCode: RejectionReasonCode;
        reasonText: string;
        affectedParameterIds: string[];
        verifierName?: string;
      }
    | undefined;

  if (correctionMode) {
    const corrections = await listCorrectionWorklistAction().catch(() => []);
    const open = corrections.find((row) => row.labResultId === resultId);
    if (open) {
      correctionContext = {
        correctionRequestId: open.id,
        reasonCode: open.verification.rejectionReasonCode as RejectionReasonCode,
        reasonText: open.verification.rejectionReasonText ?? open.reasonText,
        affectedParameterIds: parseAffectedParameterIds(open.verification.affectedParameterIds),
        verifierName: open.verification.verifierDisplayNameSnapshot,
      };
    }
  }

  const [canSave, canComplete, canAcknowledgeCritical, canResubmit] = await Promise.all([
    hasTenantPermission(session.tenantId, session.userId, "/lab/result-entry/edit", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/result-entry/complete", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/result-entry/critical-acknowledge", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/corrections/resubmit", "canEdit"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="labResultEdit" description={t("laboratoryResult.edit.description")} />
      <ResultEntryEditorPanel
        result={result}
        canSave={canSave}
        canComplete={canComplete && !correctionMode}
        canAcknowledgeCritical={canAcknowledgeCritical}
        correctionContext={correctionContext}
        canResubmit={canResubmit && correctionMode}
      />
    </div>
  );
}
