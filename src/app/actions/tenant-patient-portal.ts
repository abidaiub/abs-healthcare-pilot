"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireTenantSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { normalizeMobile } from "@/lib/patient/normalize";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { writeAuditLog } from "@/lib/saas/audit";
import { PORTAL_ERROR_CODES } from "@/lib/portal/errors";
import { reassignPortalUsername } from "@/lib/portal/reassign-username";

export type PortalAdminActionResult =
  | { ok: true; accountId?: string; username?: string }
  | { ok: false; errorCode: string };

const MIN_PASSWORD_LENGTH = 8;

async function auditPortalEvent(input: {
  tenantId: string;
  branchId?: string;
  userId: string;
  actorName: string;
  actionType: "INSERT" | "UPDATE";
  entityType: string;
  entityId: string;
  event: string;
  changeData?: Record<string, unknown>;
}) {
  await writeAuditLog({
    tenantId: input.tenantId,
    branchId: input.branchId,
    userId: input.userId,
    actionType: input.actionType,
    entityType: input.entityType,
    entityId: input.entityId,
    changeData: { event: input.event, ...(input.changeData ?? {}) },
    createdBy: input.actorName,
  });
}

/**
 * Counter-assisted portal enrollment. The login is the patient's own email or normalised
 * mobile; the password is never logged or returned.
 */
export async function enrollPatientPortalAccountAction(input: {
  patientId: string;
  username?: string;
  password: string;
  markVerified: boolean;
}): Promise<PortalAdminActionResult> {
  await requireTenantPermission("/settings/patient-portal/accounts", "canEdit");
  const session = await requireTenantSession();

  if (!input.password || input.password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_PASSWORD_TOO_SHORT };
  }

  const patient = await prisma.patient.findFirst({
    where: { id: input.patientId, tenantId: session.tenantId },
    select: {
      id: true,
      registrationBranchId: true,
      email: true,
      mobileNormalized: true,
      mobile: true,
    },
  });
  if (!patient) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_PATIENT_NOT_FOUND };
  }

  const username = (
    input.username?.trim().toLowerCase() ||
    patient.email?.trim().toLowerCase() ||
    patient.mobileNormalized ||
    normalizeMobile(patient.mobile) ||
    ""
  ).trim();
  if (!username) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_PATIENT_CONTACT_REQUIRED };
  }

  const existingForPatient = await prisma.patientPortalAccount.findFirst({
    where: { tenantId: session.tenantId, patientId: patient.id },
    select: { id: true },
  });
  if (existingForPatient) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_ACCOUNT_EXISTS };
  }

  const usernameTaken = await prisma.patientPortalAccount.findFirst({
    where: { tenantId: session.tenantId, username },
    select: { id: true },
  });
  if (usernameTaken) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_USERNAME_TAKEN };
  }

  const account = await prisma.patientPortalAccount.create({
    data: {
      tenantId: session.tenantId,
      patientId: patient.id,
      username,
      passwordHash: hashPassword(input.password),
      isVerified: input.markVerified,
      createdById: session.userId,
    },
  });

  await auditPortalEvent({
    tenantId: session.tenantId,
    branchId: patient.registrationBranchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "INSERT",
    entityType: "PatientPortalAccount",
    entityId: account.id,
    event: "PORTAL_ACCOUNT_ENROLLED",
    changeData: { patientId: patient.id, username, verified: input.markVerified },
  });

  revalidatePath("/settings/patient-portal");
  return { ok: true, accountId: account.id, username };
}

/**
 * Releases a portal username from a superseded patient account and enrolls the target
 * patient. Used when seed/UAT patient numbers diverge from runtime registration (DP-* vs PT-*).
 * Preserves the superseded account row and audit trail; does not move clinical reports.
 */
export async function reassignPortalUsernameAction(input: {
  targetPatientId: string;
  username: string;
  password: string;
  reason: string;
  supersededAccountId?: string;
  markVerified?: boolean;
}): Promise<PortalAdminActionResult> {
  await requireTenantPermission("/settings/patient-portal/accounts", "canApprove");
  const session = await requireTenantSession();

  const patient = await prisma.patient.findFirst({
    where: { id: input.targetPatientId, tenantId: session.tenantId },
    select: { id: true, registrationBranchId: true, patientNumber: true },
  });
  if (!patient) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_PATIENT_NOT_FOUND };
  }

  const result = await reassignPortalUsername(prisma, {
    tenantId: session.tenantId,
    targetPatientId: input.targetPatientId,
    username: input.username,
    password: input.password,
    reason: input.reason,
    supersededAccountId: input.supersededAccountId,
    markVerified: input.markVerified ?? true,
    actorUserId: session.userId,
  });

  if (!result.ok) {
    return { ok: false, errorCode: result.errorCode };
  }

  await auditPortalEvent({
    tenantId: session.tenantId,
    branchId: patient.registrationBranchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    entityType: "PatientPortalAccount",
    entityId: result.supersededAccountId,
    event: "PORTAL_ACCOUNT_USERNAME_RELEASED",
    changeData: {
      reason: input.reason.trim(),
      archivedUsername: result.archivedUsername,
      releasedUsername: result.username,
      targetPatientId: patient.id,
      targetPatientNumber: patient.patientNumber,
    },
  });

  await auditPortalEvent({
    tenantId: session.tenantId,
    branchId: patient.registrationBranchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "INSERT",
    entityType: "PatientPortalAccount",
    entityId: result.newAccountId,
    event: "PORTAL_ACCOUNT_REASSIGNED",
    changeData: {
      reason: input.reason.trim(),
      username: result.username,
      targetPatientId: patient.id,
      targetPatientNumber: patient.patientNumber,
      supersededAccountId: result.supersededAccountId,
    },
  });

  revalidatePath("/settings/patient-portal");
  return { ok: true, accountId: result.newAccountId, username: result.username };
}

export async function setPortalAccountSuspensionAction(input: {
  accountId: string;
  suspend: boolean;
  reason: string;
}): Promise<PortalAdminActionResult> {
  await requireTenantPermission("/settings/patient-portal/accounts", "canApprove");
  const session = await requireTenantSession();

  const reason = input.reason?.trim();
  if (!reason) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_DELEGATION_REASON_REQUIRED };
  }

  const account = await prisma.patientPortalAccount.findFirst({
    where: { id: input.accountId, tenantId: session.tenantId },
    select: { id: true, patient: { select: { registrationBranchId: true } } },
  });
  if (!account) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_PATIENT_NOT_FOUND };
  }

  await prisma.$transaction(async (tx) => {
    await tx.patientPortalAccount.update({
      where: { id: account.id },
      data: {
        isSuspended: input.suspend,
        suspendedAt: input.suspend ? new Date() : null,
        suspendReason: input.suspend ? reason : null,
        failedAttemptCount: input.suspend ? undefined : 0,
        updatedById: session.userId,
      },
    });
    if (input.suspend) {
      await tx.patientPortalSession.updateMany({
        where: { accountId: account.id, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      });
    }
  });

  await auditPortalEvent({
    tenantId: session.tenantId,
    branchId: account.patient.registrationBranchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    entityType: "PatientPortalAccount",
    entityId: account.id,
    event: input.suspend ? "PORTAL_ACCOUNT_SUSPENDED" : "PORTAL_ACCOUNT_REINSTATED",
    changeData: { reason },
  });

  revalidatePath("/settings/patient-portal");
  return { ok: true, accountId: account.id };
}

/**
 * Grants one portal account read access to another patient's released reports. Required for
 * guardian access because the pilot never infers portal rights from demographic guardian
 * fields; a staff user must record the relationship and the consent reference.
 */
export async function createPortalDelegationAction(input: {
  grantorPatientId: string;
  granteeAccountId: string;
  relationship: string;
  accessLevel: string;
  consentReference: string;
}): Promise<PortalAdminActionResult> {
  await requireTenantPermission("/settings/patient-portal/delegation", "canApprove");
  const session = await requireTenantSession();

  const consentReference = input.consentReference?.trim();
  const relationship = input.relationship?.trim();
  if (!consentReference || !relationship) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_DELEGATION_REASON_REQUIRED };
  }

  const [patient, account] = await Promise.all([
    prisma.patient.findFirst({
      where: { id: input.grantorPatientId, tenantId: session.tenantId },
      select: { id: true, registrationBranchId: true },
    }),
    prisma.patientPortalAccount.findFirst({
      where: { id: input.granteeAccountId, tenantId: session.tenantId },
      select: { id: true, patientId: true },
    }),
  ]);

  if (!patient || !account) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_PATIENT_NOT_FOUND };
  }
  if (account.patientId === patient.id) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_DELEGATION_SELF };
  }

  const existing = await prisma.patientPortalDelegation.findFirst({
    where: {
      tenantId: session.tenantId,
      grantorPatientId: patient.id,
      granteeAccountId: account.id,
    },
    select: { id: true, isActive: true },
  });
  if (existing?.isActive) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_DELEGATION_EXISTS };
  }

  const delegation = existing
    ? await prisma.patientPortalDelegation.update({
        where: { id: existing.id },
        data: {
          relationship,
          accessLevel: input.accessLevel,
          consentReference,
          isActive: true,
          revokedAt: null,
          revokedById: null,
        },
      })
    : await prisma.patientPortalDelegation.create({
        data: {
          tenantId: session.tenantId,
          grantorPatientId: patient.id,
          granteeAccountId: account.id,
          relationship,
          accessLevel: input.accessLevel,
          consentReference,
          createdById: session.userId,
        },
      });

  await auditPortalEvent({
    tenantId: session.tenantId,
    branchId: patient.registrationBranchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: existing ? "UPDATE" : "INSERT",
    entityType: "PatientPortalDelegation",
    entityId: delegation.id,
    event: "PORTAL_DELEGATION_GRANTED",
    changeData: {
      grantorPatientId: patient.id,
      granteeAccountId: account.id,
      relationship,
      accessLevel: input.accessLevel,
      consentReference,
    },
  });

  revalidatePath("/settings/patient-portal");
  return { ok: true, accountId: account.id };
}

export async function revokePortalDelegationAction(input: {
  delegationId: string;
  reason: string;
}): Promise<PortalAdminActionResult> {
  await requireTenantPermission("/settings/patient-portal/delegation", "canApprove");
  const session = await requireTenantSession();

  const reason = input.reason?.trim();
  if (!reason) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_DELEGATION_REASON_REQUIRED };
  }

  const delegation = await prisma.patientPortalDelegation.findFirst({
    where: { id: input.delegationId, tenantId: session.tenantId },
    select: { id: true, grantorPatient: { select: { registrationBranchId: true } } },
  });
  if (!delegation) {
    return { ok: false, errorCode: PORTAL_ERROR_CODES.PORTAL_PATIENT_NOT_FOUND };
  }

  await prisma.patientPortalDelegation.update({
    where: { id: delegation.id },
    data: { isActive: false, revokedAt: new Date(), revokedById: session.userId },
  });

  await auditPortalEvent({
    tenantId: session.tenantId,
    branchId: delegation.grantorPatient.registrationBranchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    entityType: "PatientPortalDelegation",
    entityId: delegation.id,
    event: "PORTAL_DELEGATION_REVOKED",
    changeData: { reason },
  });

  revalidatePath("/settings/patient-portal");
  return { ok: true };
}

export async function listPortalAccountsAction() {
  const session = await requireTenantPermission("/settings/patient-portal/accounts");
  return prisma.patientPortalAccount.findMany({
    where: { tenantId: session.tenantId },
    include: {
      patient: { select: { patientNumber: true, fullName: true } },
      delegations: {
        where: { isActive: true },
        include: { grantorPatient: { select: { patientNumber: true, fullName: true } } },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 200,
  });
}
