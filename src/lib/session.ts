export type SessionUser = {
  name: string;
  role: string;
  employeeCode: string;
};

export type LoginKind = "host" | "tenant";

export type SessionContext = {
  loginKind: LoginKind;
  userId: string;
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  branchId: string;
  branchName: string;
  branchCode: string;
  user: SessionUser;
};

export const SESSION_COOKIE = "abs-pilot-session";

export const PLATFORM_SESSION_CONTEXT = {
  tenantId: "platform",
  tenantName: "ABSHealthcare Platform",
  tenantCode: "HOST",
  branchId: "host-console",
  branchName: "Host Console",
  branchCode: "HOST-01",
} as const;

export const DEMO_USERS = [
  {
    username: "arif.hossain",
    password: "demo",
    name: "Arif Hossain",
    role: "Receptionist",
    employeeCode: "EMP-201",
  },
  {
    username: "tania.sultana",
    password: "demo",
    name: "Tania Sultana",
    role: "Receptionist",
    employeeCode: "EMP-202",
  },
  {
    username: "dr.shafiqul",
    password: "demo",
    name: "Dr. Shafiqul Islam",
    role: "Doctor",
    employeeCode: "DR-1001",
  },
  {
    username: "admin",
    password: "demo",
    name: "Syed Asif Iqbal",
    role: "Administrator",
    employeeCode: "EMP-701",
  },
] as const;

function isValidSession(parsed: Partial<SessionContext>): parsed is SessionContext {
  return Boolean(
    parsed.loginKind &&
      parsed.userId &&
      parsed.tenantId &&
      parsed.branchId &&
      parsed.user?.name &&
      parsed.tenantName &&
      parsed.branchName,
  );
}

export function parseSession(raw: string | undefined): SessionContext | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<SessionContext>;

    if (!parsed.loginKind) {
      parsed.loginKind = "tenant";
    }

    if (isValidSession(parsed)) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function isHostSession(session: SessionContext): boolean {
  return session.loginKind === "host";
}

export function isTenantSession(session: SessionContext): boolean {
  return session.loginKind === "tenant";
}

import { getRoleHomePath as getNavigationHomePath } from "@/lib/navigation";

export function getRoleHomePath(role: string, loginKind?: LoginKind): string {
  if (loginKind === "host" || role === "Host Admin") {
    return "/host/dashboard";
  }

  return getNavigationHomePath(role);
}

export function getPostLoginPath(session: SessionContext): string {
  if (session.loginKind === "host") {
    return "/host/dashboard";
  }

  return "/dashboard";
}
