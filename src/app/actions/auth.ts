"use server";

// TODO: Replace mock session with real authentication before production.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  buildMockSessionContext,
  type HostMockSessionInput,
  type MockSessionInput,
  type TenantMockSessionInput,
} from "@/lib/mock-session";
import {
  DEMO_USERS,
  getPostLoginPath,
  getRoleHomePath,
  parseSession,
  SESSION_COOKIE,
  type SessionContext,
} from "@/lib/session";

async function writeSessionCookie(session: SessionContext): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function setHostMockSessionAction(
  input: HostMockSessionInput,
): Promise<void> {
  await writeSessionCookie(buildMockSessionContext(input));
}

export async function setTenantMockSessionAction(
  input: TenantMockSessionInput,
): Promise<void> {
  await writeSessionCookie(buildMockSessionContext(input));
}

/** @deprecated Use setTenantMockSessionAction or setHostMockSessionAction */
export async function setMockSessionAction(
  input: Omit<TenantMockSessionInput, "loginKind">,
): Promise<void> {
  await setTenantMockSessionAction({ ...input, loginKind: "tenant" });
}

export async function loginAction(
  formData: FormData,
): Promise<{ error: string } | void> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const tenantId = String(formData.get("tenantId") ?? "").trim();
  const branchId = String(formData.get("branchId") ?? "").trim();

  const user = DEMO_USERS.find(
    (entry) => entry.username === username && entry.password === password,
  );

  if (!user) {
    return { error: "Invalid username or password. Use demo / demo credentials." };
  }

  if (!tenantId || !branchId) {
    return { error: "Please select tenant and branch." };
  }

  let tenantName = "Al Baraka Medical Group";
  let tenantCode = "ABMG";
  let branchName = "Dhaka Central Hospital";
  let branchCode = "BR-DHK-01";

  try {
    const [tenant, branch] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.branch.findUnique({ where: { id: branchId } }),
    ]);

    if (tenant) {
      tenantName = tenant.tenantName;
      tenantCode = tenant.tenantCode;
    }

    if (branch) {
      branchName = branch.name;
      branchCode = branch.code;
    }
  } catch {
    // Fall back to sample labels when database is unavailable.
  }

  const session: SessionContext = {
    loginKind: "tenant",
    tenantId,
    tenantName,
    tenantCode,
    branchId,
    branchName,
    branchCode,
    user: {
      name: user.name,
      role: user.role,
      employeeCode: user.employeeCode,
    },
  };

  await writeSessionCookie(session);
  redirect(getRoleHomePath(user.role, "tenant"));
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const session = parseSession(cookieStore.get(SESSION_COOKIE)?.value);
  cookieStore.delete(SESSION_COOKIE);
  redirect(session?.loginKind === "host" ? "/host/login" : "/login");
}

export async function getTenantOptions() {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      include: {
        branches: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { tenantName: "asc" },
    });

    if (tenants.length > 0) return tenants;
  } catch {
    // Database unavailable — use static fallback.
  }

  return [
    {
      id: "fallback-tenant",
      tenantCode: "ABMG",
      tenantName: "Al Baraka Medical Group",
      shortCode: "ABMG",
      legalName: null,
      tradeLicenseNo: null,
      taxBinNo: null,
      contactPerson: "Syed Asif Iqbal",
      contactMobile: "+880 17 0000 0000",
      contactEmail: "admin@albarakamedical.com",
      address: "12/A Dhanmondi, Dhaka 1209",
      city: "Dhaka",
      district: null,
      country: "Bangladesh",
      timezone: "Asia/Dhaka",
      defaultLanguage: "EN",
      tenantType: "MIXED",
      tenantStatus: "ACTIVE",
      onboardingStatus: "ACTIVE",
      logoUrl: null,
      reportHeaderLogoUrl: null,
      reportFooterText: null,
      isActive: true,
      createdAt: new Date(),
      createdBy: null,
      updatedAt: new Date(),
      updatedBy: null,
      branches: [
        {
          id: "fallback-branch",
          tenantId: "fallback-tenant",
          code: "BR-DHK-01",
          name: "Dhaka Central Hospital",
          address: "12/A Dhanmondi, Dhaka 1209",
          city: "Dhaka",
          district: null,
          phone: "+880 17 0000 0001",
          email: "dhaka@albarakamedical.com",
          status: "ACTIVE",
          isActive: true,
          createdAt: new Date(),
          createdBy: null,
          updatedAt: new Date(),
          updatedBy: null,
        },
      ],
    },
  ];
}
