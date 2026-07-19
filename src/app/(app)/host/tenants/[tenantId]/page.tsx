import Link from "next/link";
import { notFound } from "next/navigation";
import { TenantDetailPanel } from "@/components/host/TenantDetailPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { Button } from "@/components/ui";
import { requireHostSession } from "@/lib/auth";
import { getTenantDetailById } from "@/lib/saas/queries";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  await requireHostSession();
  const { tenantId } = await params;
  const tenant = await getTenantDetailById(tenantId);

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
    </div>
  );
}
