import {
  getHostNavGroups,
  getTenantNavGroupsFromPermissions,
  type NavGroup,
} from "@/lib/navigation";
import { getEffectivePermissionsForUser } from "@/lib/rbac/queries";
import { isHostSession, type SessionContext } from "@/lib/session";

/**
 * Resolve sidebar groups for the logged-in session using effective permissions
 * (all assigned roles merged). Host console is not permission-filtered here.
 */
export async function resolveAuthorizedNavGroups(
  session: SessionContext,
): Promise<NavGroup[]> {
  if (isHostSession(session)) {
    return getHostNavGroups();
  }

  const permissions = await getEffectivePermissionsForUser(
    session.tenantId,
    session.userId,
  );
  return getTenantNavGroupsFromPermissions(permissions);
}
