// TODO: Replace mock session with real authentication before production.

import {
  PLATFORM_SESSION_CONTEXT,
  type SessionContext,
} from "@/lib/session";

export const MOCK_SESSION_STORAGE_KEY = "abs-pilot-mock-session";

export type TenantMockSessionInput = {
  loginKind: "tenant";
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  branchId: string;
  branchName: string;
  branchCode: string;
  role: string;
  userName: string;
};

export type HostMockSessionInput = {
  loginKind: "host";
  userName: string;
};

export type MockSessionInput = TenantMockSessionInput | HostMockSessionInput;

/** @deprecated Use TenantMockSessionInput */
export type LegacyMockSessionInput = Omit<TenantMockSessionInput, "loginKind">;

export function buildHostMockSessionContext(
  input: HostMockSessionInput,
): SessionContext {
  return {
    loginKind: "host",
    ...PLATFORM_SESSION_CONTEXT,
    user: {
      name: input.userName.trim() || "Host Administrator",
      role: "Host Admin",
      employeeCode: "HOST-001",
    },
  };
}

export function buildTenantMockSessionContext(
  input: TenantMockSessionInput,
): SessionContext {
  return {
    loginKind: "tenant",
    tenantId: input.tenantId,
    tenantName: input.tenantName,
    tenantCode: input.tenantCode,
    branchId: input.branchId,
    branchName: input.branchName,
    branchCode: input.branchCode,
    user: {
      name: input.userName,
      role: input.role,
      employeeCode: "MOCK-USER",
    },
  };
}

export function buildMockSessionContext(input: MockSessionInput): SessionContext {
  if (input.loginKind === "host") {
    return buildHostMockSessionContext(input);
  }

  return buildTenantMockSessionContext(input);
}

export function inferTenantRole(username: string): string {
  const value = username.trim().toLowerCase();

  if (value.includes("admin")) return "Tenant Admin";
  if (value.startsWith("dr") || value.includes("doctor")) return "Doctor";
  if (value.includes("lab")) return "Lab Technician";
  if (value.includes("bill") || value.includes("cashier")) return "Billing";
  if (value.includes("portal")) return "Patient Portal User";

  return "Reception";
}

export function persistMockSessionClient(input: MockSessionInput): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOCK_SESSION_STORAGE_KEY, JSON.stringify(input));
}

export function clearMockSessionClient(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
}
