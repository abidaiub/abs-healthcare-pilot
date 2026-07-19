import { notFound } from "next/navigation";
import { TenantFormPanel } from "@/components/host/TenantFormPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireHostSession } from "@/lib/auth";
import {
  getTenantDetailById,
  listSubscriptionPackages,
} from "@/lib/saas/queries";

export default async function TenantEditPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  await requireHostSession();
  const { tenantId } = await params;
  const [tenant, packages] = await Promise.all([
    getTenantDetailById(tenantId),
    listSubscriptionPackages(),
  ]);

  if (!tenant) notFound();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="tenantEdit"
        description={`Edit ${tenant.name} — profile, branding, and subscription.`}
      />
      <TenantFormPanel mode="edit" tenant={tenant} packages={packages} />
    </div>
  );
}
