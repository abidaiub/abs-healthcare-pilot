import type { Permission } from "@/generated/prisma/client";
import type { PermissionAction } from "@/lib/rbac/permission-catalog";
import type { EffectivePermission } from "@/lib/rbac/types";

export function emptyEffectivePermission(resourceKey: string): EffectivePermission {
  return {
    resourceKey,
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canPrint: false,
  };
}

export function mergePermissionRows(
  rows: Pick<
    Permission,
    | "resourceKey"
    | "canView"
    | "canCreate"
    | "canEdit"
    | "canDelete"
    | "canApprove"
    | "canPrint"
  >[],
): Map<string, EffectivePermission> {
  const merged = new Map<string, EffectivePermission>();

  for (const row of rows) {
    const current = merged.get(row.resourceKey) ?? emptyEffectivePermission(row.resourceKey);
    merged.set(row.resourceKey, {
      resourceKey: row.resourceKey,
      canView: current.canView || row.canView,
      canCreate: current.canCreate || row.canCreate,
      canEdit: current.canEdit || row.canEdit,
      canDelete: current.canDelete || row.canDelete,
      canApprove: current.canApprove || row.canApprove,
      canPrint: current.canPrint || row.canPrint,
    });
  }

  return merged;
}

export function canAccess(
  permissions: Map<string, EffectivePermission>,
  resourceKey: string,
  action: PermissionAction = "canView",
): boolean {
  const permission = permissions.get(resourceKey);
  if (!permission) return false;
  return permission[action];
}

export function canAccessRoute(
  permissions: Map<string, EffectivePermission>,
  route: string,
  action: PermissionAction = "canView",
): boolean {
  const normalized = route.split("?")[0]?.replace(/\/$/, "") || "/";

  for (const [resourceKey, permission] of permissions.entries()) {
    if (
      normalized === resourceKey ||
      normalized.startsWith(`${resourceKey}/`)
    ) {
      return permission[action];
    }
  }

  return false;
}
