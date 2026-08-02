import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const PORTAL_SESSION_COOKIE = "abs-portal-session";

/** Hard session lifetime. A portal session cannot be extended past this without a new login. */
export const PORTAL_SESSION_TTL_MINUTES = 30;

export type PortalSessionContext = {
  accountId: string;
  tenantId: string;
  patientId: string;
  patientNumber: string;
  patientName: string;
  username: string;
  expiresAt: Date;
};

/** Only the digest is persisted, so a database read cannot reveal a usable session cookie. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function writePortalSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearPortalSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PORTAL_SESSION_COOKIE);
}

/**
 * Resolves the current portal session from the cookie. Expired, revoked and suspended
 * sessions resolve to null so no portal data is ever returned for them.
 */
export async function getPortalSession(): Promise<PortalSessionContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.patientPortalSession.findUnique({
    where: { sessionToken: hashSessionToken(token) },
    include: {
      account: {
        include: {
          patient: { select: { id: true, patientNumber: true, fullName: true, isActive: true } },
        },
      },
    },
  });

  if (!session || session.isRevoked || session.expiresAt.getTime() <= Date.now()) return null;

  const account = session.account;
  if (!account.isActive || account.isSuspended || !account.patient.isActive) return null;

  return {
    accountId: account.id,
    tenantId: account.tenantId,
    patientId: account.patient.id,
    patientNumber: account.patient.patientNumber,
    patientName: account.patient.fullName,
    username: account.username,
    expiresAt: session.expiresAt,
  };
}
