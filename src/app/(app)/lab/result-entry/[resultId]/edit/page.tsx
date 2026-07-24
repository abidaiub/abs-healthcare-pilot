import { notFound, redirect } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { ResultEntryEditorPanel } from "@/components/laboratory-result/ResultEntryEditorPanel";
import { getLabResultEntryAction } from "@/app/actions/tenant-lab-results";
import { isLabResultEditable } from "@/lib/laboratory-result/constants";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ resultId: string }> };

export default async function ResultEntryEditPage({ params }: PageProps) {
  const session = await requireTenantPermission("/lab/result-entry");
  const { t } = await getServerI18n(session);
  const { resultId } = await params;
  const result = await getLabResultEntryAction(resultId).catch(() => null);
  if (!result) notFound();

  if (!isLabResultEditable(result.status)) {
    redirect(`/lab/result-entry/${resultId}`);
  }

  const [canSave, canComplete, canAcknowledgeCritical] = await Promise.all([
    hasTenantPermission(session.tenantId, session.userId, "/lab/result-entry/edit", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/result-entry/complete", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/result-entry/critical-acknowledge", "canEdit"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="labResultEdit" description={t("laboratoryResult.edit.description")} />
      <ResultEntryEditorPanel
        result={result}
        canSave={canSave}
        canComplete={canComplete}
        canAcknowledgeCritical={canAcknowledgeCritical}
      />
    </div>
  );
}
