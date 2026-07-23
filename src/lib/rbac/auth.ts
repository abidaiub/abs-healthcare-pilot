import { redirect } from "next/navigation";
import { requireTenantSession } from "@/lib/auth";
import type { PermissionAction } from "@/lib/rbac/permission-catalog";
import { userCanAccessResource } from "@/lib/rbac/queries";

export async function requireTenantPermission(
  resourceKey: string,
  action: PermissionAction = "canView",
) {
  const session = await requireTenantSession();

  const allowed = await userCanAccessResource(
    session.tenantId,
    session.userId,
    resourceKey,
    action,
  );

  if (!allowed) {
    redirect("/dashboard?error=insufficient-permission");
  }

  return session;
}

export async function hasTenantPermission(
  tenantId: string,
  userId: string,
  resourceKey: string,
  action: PermissionAction = "canView",
): Promise<boolean> {
  return userCanAccessResource(tenantId, userId, resourceKey, action);
}
