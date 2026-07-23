import { BranchManagementPanel } from "@/components/branch/BranchManagementPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantPermission, hasTenantPermission } from "@/lib/rbac/auth";
import { listTenantBranches } from "@/lib/branch/queries";
import { getServerI18n } from "@/lib/i18n/server";
import type { BranchType } from "@/generated/prisma/client";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function TenantBranchesPage({ searchParams }: PageProps) {
  const session = await requireTenantPermission("/settings/branches");
  const { t } = await getServerI18n(session);
  const params = await searchParams;

  const page = Number(readParam(params, "page") ?? "1") || 1;
  const search = readParam(params, "search") ?? "";
  const statusRaw = readParam(params, "status") ?? "all";
  const branchTypeRaw = readParam(params, "branchType") ?? "all";

  const status =
    statusRaw === "active" || statusRaw === "inactive" ? statusRaw : ("all" as const);
  const branchType =
    branchTypeRaw && branchTypeRaw !== "all" ? (branchTypeRaw as BranchType) : ("all" as const);

  const result = await listTenantBranches(session.tenantId, {
    search,
    status,
    branchType,
    page,
    pageSize: 20,
  });

  const [canCreate, canEdit, canApprove] = await Promise.all([
    hasTenantPermission(session.tenantId, session.userId, "/settings/branches", "canCreate"),
    hasTenantPermission(session.tenantId, session.userId, "/settings/branches", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/settings/branches", "canApprove"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="tenantBranchList"
        description={t("branch.list.description")}
      />
      <BranchManagementPanel
        branches={result.rows}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        canCreate={canCreate}
        canEdit={canEdit}
        canApprove={canApprove}
      />
    </div>
  );
}
