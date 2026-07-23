import { notFound } from "next/navigation";
import { BranchDetailPanel } from "@/components/branch/BranchDetailPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import {
  getTenantBranchDetail,
  listEligibleUsersForBranchAssignment,
} from "@/lib/branch/queries";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = {
  params: Promise<{ branchId: string }>;
};

export default async function TenantBranchDetailPage({ params }: PageProps) {
  const session = await requireTenantPermission("/settings/branches");
  const { branchId } = await params;
  const { t } = await getServerI18n(session);

  const branch = await getTenantBranchDetail(session.tenantId, branchId);
  if (!branch) notFound();

  const [eligibleUsers, canEdit] = await Promise.all([
    listEligibleUsersForBranchAssignment(session.tenantId),
    hasTenantPermission(session.tenantId, session.userId, "/settings/branches", "canEdit"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="tenantBranchDetail"
        description={t("branch.detail.description")}
      />
      <BranchDetailPanel branch={branch} eligibleUsers={eligibleUsers} canEdit={canEdit} />
    </div>
  );
}
