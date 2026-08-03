import Link from "next/link";
import { notFound } from "next/navigation";
import { TenantDetailPanel } from "@/components/host/TenantDetailPanel";
import { TenantAdminAccessPanel } from "@/components/host/TenantAdminAccessPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { Button } from "@/components/ui";
import { requireHostSession } from "@/lib/auth";
import { getTenantDetailById } from "@/lib/saas/queries";
import { getTenantAdminAccess } from "@/lib/saas/tenant-admin-access-query";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  await requireHostSession();
  const { tenantId } = await params;
  const [tenant, tenantAdminAccess] = await Promise.all([
    getTenantDetailById(tenantId),
    getTenantAdminAccess(tenantId),
  ]);

  if (!tenant) notFound();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="tenantDetail"
        description={`${tenant.code} — subscription, modules, usage limits, and status history.`}
        action={
          <Link href="/host/tenants">
            <Button type="button" variant="secondary">All tenants</Button>
          </Link>
        }
      />
      <TenantDetailPanel tenant={tenant} />
      <TenantAdminAccessPanel access={tenantAdminAccess} tenantId={tenantId} />
    </div>
  );
}
