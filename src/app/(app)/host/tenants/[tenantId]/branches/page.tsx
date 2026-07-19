import Link from "next/link";
import { notFound } from "next/navigation";
import { BranchManagementPanel } from "@/components/host/BranchManagementPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { Button } from "@/components/ui";
import { requireHostSession } from "@/lib/auth";
import { getTenantDetailById } from "@/lib/saas/queries";

export default async function TenantBranchesPage({
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
        screenKey="branchManagement"
        description={`Branch management for ${tenant.name}`}
        action={
          <Link href={`/host/tenants/${tenant.id}`}>
            <Button type="button" variant="secondary">Tenant detail</Button>
          </Link>
        }
      />
      <BranchManagementPanel tenant={tenant} />
    </div>
  );
}
