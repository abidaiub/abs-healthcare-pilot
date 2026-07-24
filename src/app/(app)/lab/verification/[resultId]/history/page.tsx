import { notFound } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { VerificationHistoryPanel } from "@/components/laboratory-verification/VerificationHistoryPanel";
import { getVerificationHistoryAction, getVerificationReviewAction } from "@/app/actions/tenant-lab-verification";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ resultId: string }> };

export default async function VerificationHistoryPage({ params }: PageProps) {
  const session = await requireTenantPermission("/lab/verification/history");
  const { t } = await getServerI18n(session);
  const { resultId } = await params;

  const result = await getVerificationReviewAction(resultId).catch(() => null);
  if (!result) notFound();

  const entries = await getVerificationHistoryAction(resultId);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="verificationHistory"
        description={t("laboratoryVerification.history.description")}
      />
      <VerificationHistoryPanel resultId={resultId} entries={entries} />
    </div>
  );
}
