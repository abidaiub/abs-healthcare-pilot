import type { PrismaClient } from "@/generated/prisma/client";
import { hashPassword } from "@/lib/password";
import { normalizeMobile } from "@/lib/patient/normalize";

export type ReassignPortalUsernameInput = {
  tenantId: string;
  targetPatientId: string;
  username?: string;
  password: string;
  reason: string;
  supersededAccountId?: string;
  markVerified?: boolean;
  actorUserId: string;
};

export type ReassignPortalUsernameResult =
  | {
      ok: true;
      newAccountId: string;
      username: string;
      supersededAccountId: string;
      archivedUsername: string;
    }
  | { ok: false; errorCode: string };

const MIN_PASSWORD_LENGTH = 8;

function archivedUsernameFor(accountId: string, username: string): string {
  return `archived.${accountId.slice(-10)}.${username}`;
}

/**
 * Releases a portal username from a superseded account and enrolls the target patient.
 * Preserves the superseded account row and audit history; revokes active sessions.
 */
export async function reassignPortalUsername(
  prisma: PrismaClient,
  input: ReassignPortalUsernameInput,
): Promise<ReassignPortalUsernameResult> {
  const reason = input.reason?.trim();
  if (!reason) {
    return { ok: false, errorCode: "PORTAL_DELEGATION_REASON_REQUIRED" };
  }
  if (!input.password || input.password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, errorCode: "PORTAL_PASSWORD_TOO_SHORT" };
  }

  const patient = await prisma.patient.findFirst({
    where: { id: input.targetPatientId, tenantId: input.tenantId, isActive: true },
    select: {
      id: true,
      email: true,
      mobileNormalized: true,
      mobile: true,
    },
  });
  if (!patient) {
    return { ok: false, errorCode: "PORTAL_PATIENT_NOT_FOUND" };
  }

  const username = (
    input.username?.trim().toLowerCase() ||
    patient.email?.trim().toLowerCase() ||
    patient.mobileNormalized ||
    normalizeMobile(patient.mobile) ||
    ""
  ).trim();
  if (!username) {
    return { ok: false, errorCode: "PORTAL_PATIENT_CONTACT_REQUIRED" };
  }

  const existingForPatient = await prisma.patientPortalAccount.findFirst({
    where: {
      tenantId: input.tenantId,
      patientId: patient.id,
      isActive: true,
    },
    select: { id: true },
  });
  if (existingForPatient) {
    return { ok: false, errorCode: "PORTAL_ACCOUNT_EXISTS" };
  }

  const superseded = input.supersededAccountId
    ? await prisma.patientPortalAccount.findFirst({
        where: { id: input.supersededAccountId, tenantId: input.tenantId },
        select: { id: true, patientId: true, username: true, isActive: true },
      })
    : await prisma.patientPortalAccount.findFirst({
        where: { tenantId: input.tenantId, username, isActive: true },
        select: { id: true, patientId: true, username: true, isActive: true },
      });

  if (!superseded) {
    return { ok: false, errorCode: "PORTAL_USERNAME_NOT_HELD" };
  }
  if (superseded.patientId === patient.id) {
    return { ok: false, errorCode: "PORTAL_REASSIGN_SAME_PATIENT" };
  }
  if (superseded.username !== username) {
    return { ok: false, errorCode: "PORTAL_USERNAME_MISMATCH" };
  }

  const archivedUsername = archivedUsernameFor(superseded.id, superseded.username);
  const now = new Date();

  const newAccount = await prisma.$transaction(async (tx) => {
    await tx.patientPortalSession.updateMany({
      where: { accountId: superseded.id, isRevoked: false },
      data: { isRevoked: true, revokedAt: now },
    });

    await tx.patientPortalAccount.update({
      where: { id: superseded.id },
      data: {
        username: archivedUsername,
        isActive: false,
        isSuspended: true,
        suspendedAt: now,
        suspendReason: reason,
        updatedById: input.actorUserId,
      },
    });

    return tx.patientPortalAccount.create({
      data: {
        tenantId: input.tenantId,
        patientId: patient.id,
        username,
        passwordHash: hashPassword(input.password),
        isVerified: input.markVerified ?? true,
        createdById: input.actorUserId,
      },
    });
  });

  return {
    ok: true,
    newAccountId: newAccount.id,
    username,
    supersededAccountId: superseded.id,
    archivedUsername,
  };
}
