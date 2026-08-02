import { OperationalUserWizardPanel } from "@/components/operational-readiness/OperationalUserWizardPanel";
import { ReadinessPageShell } from "@/components/operational-readiness/ReadinessPageShell";
import { prisma } from "@/lib/db";
import { READINESS_RESOURCE } from "@/lib/operational-readiness/constants";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function OperationalUsersReadinessPage() {
  const session = await requireTenantPermission(READINESS_RESOURCE);
  const [roles, branches, departments, users, canCreate] = await Promise.all([
    prisma.role.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      select: { id: true, roleCode: true, roleName: true },
      orderBy: { roleName: "asc" },
    }),
    prisma.branch.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      where: {
        isActive: true,
        OR: [{ tenantId: session.tenantId }, { tenantId: null }],
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { tenantId: session.tenantId },
      select: {
        id: true,
        username: true,
        email: true,
        userStatus: true,
        isActive: true,
        department: { select: { name: true } },
        userRoles: {
          where: { isPrimary: true, isActive: true },
          select: { role: { select: { roleName: true } } },
          take: 1,
        },
        userBranches: {
          where: { isPrimary: true, isActive: true },
          select: { branch: { select: { code: true } } },
          take: 1,
        },
      },
      orderBy: { username: "asc" },
    }),
    hasTenantPermission(
      session.tenantId,
      session.userId,
      READINESS_RESOURCE,
      "canCreate",
    ),
  ]);

  return (
    <ReadinessPageShell
      screenKey="readinessUsers"
      description="Create operational users with role, branch, department, and status."
    >
      <OperationalUserWizardPanel
        roles={roles}
        branches={branches}
        departments={departments}
        canCreate={canCreate}
        users={users.map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          userStatus: u.userStatus,
          isActive: u.isActive,
          roleName: u.userRoles[0]?.role.roleName ?? "—",
          branchCode: u.userBranches[0]?.branch.code ?? "—",
          departmentName: u.department?.name ?? "—",
        }))}
      />
    </ReadinessPageShell>
  );
}
