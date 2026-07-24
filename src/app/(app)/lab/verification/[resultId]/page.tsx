import { notFound, redirect } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { VerificationReviewPanel } from "@/components/laboratory-verification/VerificationReviewPanel";
import { getVerificationReviewAction } from "@/app/actions/tenant-lab-verification";
import { isResultReadyForVerification } from "@/lib/laboratory-verification/constants";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ resultId: string }> };

export default async function VerificationReviewPage({ params }: PageProps) {
  const session = await requireTenantPermission("/lab/verification");
  const { t } = await getServerI18n(session);
  const { resultId } = await params;
  const result = await getVerificationReviewAction(resultId).catch(() => null);
  if (!result) notFound();

  if (!isResultReadyForVerification(result.status)) {
    redirect(`/lab/result-entry/${resultId}`);
  }

  const [canVerify, canReject] = await Promise.all([
    hasTenantPermission(session.tenantId, session.userId, "/lab/verification/verify", "canApprove"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/verification/reject", "canApprove"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="verificationReview"
        description={t("laboratoryVerification.review.description")}
      />
      <VerificationReviewPanel
        result={result}
        canVerify={canVerify}
        canReject={canReject}
        currentUserId={session.userId}
      />
    </div>
  );
}
