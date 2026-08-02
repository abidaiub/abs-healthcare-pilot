"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { normalizeMobile } from "@/lib/patient/normalize";
import { PORTAL_ERROR_CODES } from "@/lib/portal/errors";
import {
  clearPortalSessionCookie,
  generateSessionToken,
  getPortalSession,
  hashSessionToken,
  PORTAL_SESSION_TTL_MINUTES,
  writePortalSessionCookie,
} from "@/lib/portal/session";

export type PortalAuthActionResult = { ok: true } | { ok: false; errorCode: string };

const MAX_FAILED_ATTEMPTS = 5;

async function requestContext() {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  return {
    ipAddress: forwarded?.split(",")[0]?.trim() ?? null,
    deviceInfo: headerList.get("user-agent")?.slice(0, 200) ?? null,
  };
}

/** Accepts either the registered email or a Bangladesh-normalised mobile number. */
function candidateUsernames(rawUsername: string): string[] {
  const trimmed = rawUsername.trim().toLowerCase();
  const normalizedMobile = normalizeMobile(trimmed);
  return [...new Set([trimmed, normalizedMobile].filter((value): value is string => Boolean(value)))];
}

export async function portalLoginAction(formData: FormData): Promise<PortalAuthActionResult> {
  const rawUsername = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const tenantCode = String(formData.get("tenantCode") ?? "").trim();
  const context = await requestContext();

  if (!rawUsername.trim() || !password || !tenantCode) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_INVALID_CREDENTIALS };
  }

  const tenant = await prisma.tenant.findFirst({
    where: { tenantCode },
    select: { id: true, usageLimit: { select: { allowPatientPortal: true } } },
  });
  if (!tenant) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_INVALID_CREDENTIALS };
  }
  if (tenant.usageLimit && !tenant.usageLimit.allowPatientPortal) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_DISABLED_FOR_TENANT };
  }

  const usernames = candidateUsernames(rawUsername);
  const account = await prisma.patientPortalAccount.findFirst({
    where: { tenantId: tenant.id, username: { in: usernames }, isActive: true },
    include: { patient: { select: { isActive: true } } },
  });

  async function recordFailure(reason: string, accountId?: string) {
    await prisma.patientPortalLoginHistory.create({
      data: {
        tenantId: tenant!.id,
        accountId: accountId ?? null,
        username: usernames[0],
        isSuccess: false,
        failReason: reason,
        ipAddress: context.ipAddress,
        deviceInfo: context.deviceInfo,
      },
    });
  }

  // A missing account and a wrong password return the same code so the portal cannot be
  // used to discover which patients are enrolled.
  if (!account) {
    await recordFailure("ACCOUNT_NOT_FOUND");
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_INVALID_CREDENTIALS };
  }
  if (account.isSuspended || !account.patient.isActive) {
    await recordFailure("ACCOUNT_SUSPENDED", account.id);
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_ACCOUNT_SUSPENDED };
  }
  if (!account.isVerified) {
    await recordFailure("ACCOUNT_NOT_VERIFIED", account.id);
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_ACCOUNT_NOT_VERIFIED };
  }

  if (!verifyPassword(password, account.passwordHash)) {
    const nextCount = account.failedAttemptCount + 1;
    await prisma.patientPortalAccount.update({
      where: { id: account.id },
      data: {
        failedAttemptCount: nextCount,
        ...(nextCount >= MAX_FAILED_ATTEMPTS
          ? {
              isSuspended: true,
              suspendedAt: new Date(),
              suspendReason: "MAX_FAILED_LOGIN_ATTEMPTS",
            }
          : {}),
      },
    });
    await recordFailure("INVALID_PASSWORD", account.id);
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_INVALID_CREDENTIALS };
  }

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + PORTAL_SESSION_TTL_MINUTES * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.patientPortalSession.updateMany({
      where: { accountId: account.id, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
    await tx.patientPortalSession.create({
      data: {
        tenantId: tenant.id,
        accountId: account.id,
        sessionToken: hashSessionToken(token),
        expiresAt,
        ipAddress: context.ipAddress,
        deviceInfo: context.deviceInfo,
      },
    });
    await tx.patientPortalAccount.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date(), failedAttemptCount: 0 },
    });
    await tx.patientPortalLoginHistory.create({
      data: {
        tenantId: tenant.id,
        accountId: account.id,
        username: account.username,
        isSuccess: true,
        ipAddress: context.ipAddress,
        deviceInfo: context.deviceInfo,
      },
    });
  });

  await writePortalSessionCookie(token, expiresAt);
  redirect("/portal/reports");
}

export async function portalLogoutAction(): Promise<void> {
  const session = await getPortalSession();
  if (session) {
    await prisma.patientPortalSession.updateMany({
      where: { accountId: session.accountId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }
  await clearPortalSessionCookie();
  redirect("/portal/login");
}
