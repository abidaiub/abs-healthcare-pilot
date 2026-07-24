import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { VerificationWorklistPanel } from "@/components/laboratory-verification/VerificationWorklistPanel";
import { listVerificationWorklistAction } from "@/app/actions/tenant-lab-verification";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission } from "@/lib/rbac/auth";

export default async function VerificationWorklistPage() {
  const session = await requireTenantPermission("/lab/verification");
  const { t } = await getServerI18n(session);
  const rows = await listVerificationWorklistAction();

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="verification"
        description={t("laboratoryVerification.worklist.description")}
      />
      <VerificationWorklistPanel rows={rows} />
    </div>
  );
}
