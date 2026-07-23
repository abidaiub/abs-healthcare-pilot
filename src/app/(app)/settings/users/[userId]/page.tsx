import { notFound } from "next/navigation";
import { UserFormPanel } from "@/components/rbac/UserFormPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { listTenantBranches } from "@/lib/diagnostic/queries";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { getTenantUserDetail, listTenantRoles } from "@/lib/rbac/queries";

export default async function EditTenantUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const session = await requireTenantPermission("/settings/users", "canEdit");
  const [user, roles, branches] = await Promise.all([
    getTenantUserDetail(session.tenantId, userId),
    listTenantRoles(session.tenantId),
    listTenantBranches(session.tenantId),
  ]);

  if (!user) notFound();

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="tenantUserEdit"
        description={`Edit ${user.username}, reset password, and update role or branch assignment.`}
      />
      <UserFormPanel mode="edit" user={user} roles={roles} branches={branches} />
    </div>
  );
}
