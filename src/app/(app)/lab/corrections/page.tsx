import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { CorrectionWorklistPanel } from "@/components/laboratory-verification/CorrectionWorklistPanel";
import { listCorrectionWorklistAction } from "@/app/actions/tenant-lab-verification";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function CorrectionWorklistPage() {
  const session = await requireTenantPermission("/lab/corrections");
  const { t } = await getServerI18n(session);
  const [rows, canStart, canEdit] = await Promise.all([
    listCorrectionWorklistAction(),
    hasTenantPermission(session.tenantId, session.userId, "/lab/corrections", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/corrections/resubmit", "canEdit"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="correctionWorklist"
        description={t("laboratoryVerification.corrections.description")}
      />
      <CorrectionWorklistPanel rows={rows} canStart={canStart} canEdit={canEdit} />
    </div>
  );
}
