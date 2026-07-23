import { Suspense } from "react";
import { TenantAuditCenterPanel } from "@/components/audit/TenantAuditCenterPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import {
  getTenantAuditFilterOptions,
  listTenantAuditLogs,
} from "@/lib/audit/queries";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission } from "@/lib/rbac/auth";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

async function AuditCenterContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireTenantPermission("/settings/audit");
  const params = await searchParams;

  const initialFilters = {
    search: readParam(params, "search"),
    dateFrom: readParam(params, "dateFrom"),
    dateTo: readParam(params, "dateTo"),
    branchId: readParam(params, "branchId"),
    userId: readParam(params, "userId"),
    actionType: readParam(params, "actionType"),
    entityType: readParam(params, "entityType"),
    moduleCode: readParam(params, "moduleCode"),
    page: readParam(params, "page"),
  };

  const page = Number(initialFilters.page ?? "1") || 1;

  const [result, filterOptions] = await Promise.all([
    listTenantAuditLogs({
      tenantId: session.tenantId,
      search: initialFilters.search,
      dateFrom: initialFilters.dateFrom,
      dateTo: initialFilters.dateTo,
      branchId:
        initialFilters.branchId && initialFilters.branchId !== "All"
          ? initialFilters.branchId
          : undefined,
      userId:
        initialFilters.userId && initialFilters.userId !== "All"
          ? initialFilters.userId
          : undefined,
      actionType:
        initialFilters.actionType && initialFilters.actionType !== "All"
          ? (initialFilters.actionType as never)
          : undefined,
      entityType:
        initialFilters.entityType && initialFilters.entityType !== "All"
          ? initialFilters.entityType
          : undefined,
      moduleCode:
        initialFilters.moduleCode && initialFilters.moduleCode !== "All"
          ? initialFilters.moduleCode
          : undefined,
      page,
    }),
    getTenantAuditFilterOptions(session.tenantId),
  ]);

  return (
    <TenantAuditCenterPanel
      result={result}
      filterOptions={filterOptions}
      initialFilters={
        Object.fromEntries(
          Object.entries(initialFilters).filter(
            (entry): entry is [string, string] => Boolean(entry[1]),
          ),
        ) as Record<string, string>
      }
    />
  );
}

export default async function TenantAuditCenterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireTenantPermission("/settings/audit");
  const { t } = await getServerI18n(session);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="tenantAuditCenter"
        description={t("audit.center.description")}
      />
      <Suspense fallback={<p className="text-sm text-slate-500">{t("system.loadingAudit")}</p>}>
        <AuditCenterContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
