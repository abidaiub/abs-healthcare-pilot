import { notFound } from "next/navigation";
import { TenantFormPanel } from "@/components/host/TenantFormPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireHostSession } from "@/lib/auth";
import { getSaasTenantById } from "@/lib/saas-foundation-data";

export default async function TenantEditPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  await requireHostSession();
  const { tenantId } = await params;
  const tenant = getSaasTenantById(tenantId);

  if (!tenant) notFound();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="tenantEdit"
        description={`Edit ${tenant.name} — profile, branding, deployment, admin, and package.`}
      />
      <TenantFormPanel mode="edit" tenant={tenant} />
    </div>
  );
}
