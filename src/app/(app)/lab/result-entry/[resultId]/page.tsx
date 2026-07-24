import { notFound } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { ResultEntryDetailPanel } from "@/components/laboratory-result/ResultEntryDetailPanel";
import { getLabResultEntryAction } from "@/app/actions/tenant-lab-results";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ resultId: string }> };

export default async function ResultEntryDetailPage({ params }: PageProps) {
  const session = await requireTenantPermission("/lab/result-entry");
  const { t } = await getServerI18n(session);
  const { resultId } = await params;
  const result = await getLabResultEntryAction(resultId).catch(() => null);
  if (!result) notFound();

  const [canEdit, canComplete, canReopen, canAcknowledgeCritical] = await Promise.all([
    hasTenantPermission(session.tenantId, session.userId, "/lab/result-entry/edit", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/result-entry/complete", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/result-entry/reopen", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/result-entry/critical-acknowledge", "canEdit"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="labResultDetail" description={t("laboratoryResult.detail.description")} />
      <ResultEntryDetailPanel
        result={result}
        canEdit={canEdit}
        canComplete={canComplete}
        canReopen={canReopen}
        canAcknowledgeCritical={canAcknowledgeCritical}
      />
    </div>
  );
}
