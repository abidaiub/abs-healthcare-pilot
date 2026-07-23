import type { PermissionAction } from "@/lib/rbac/permission-catalog";

export type EffectivePermission = {
  resourceKey: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canPrint: boolean;
};

export type PermissionMatrixRow = {
  resourceKey: string;
  moduleCode: string;
  permissionCode: string;
  label: string;
  group: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canPrint: boolean;
};

export type TenantUserRow = {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  userStatus: string;
  isActive: boolean;
  forcePasswordChange: boolean;
  primaryRoleName: string | null;
  primaryRoleCode: string | null;
  primaryBranchName: string | null;
  roleCount: number;
  updatedAt: string;
};

export type TenantRoleRow = {
  id: string;
  roleCode: string;
  roleName: string;
  description: string | null;
  isActive: boolean;
  userCount: number;
  permissionCount: number;
};

export type TenantUserDetail = TenantUserRow & {
  roleIds: string[];
  primaryRoleId: string | null;
  branchIds: string[];
  primaryBranchId: string | null;
};

export type PermissionCheckAction = Exclude<PermissionAction, never>;
