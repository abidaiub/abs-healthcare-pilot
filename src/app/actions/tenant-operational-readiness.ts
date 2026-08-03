"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  MOD00_SOFTWARE_VERSION,
  READINESS_RESOURCE,
  SUGGESTED_DEPARTMENTS,
} from "@/lib/operational-readiness/constants";
import { loadOperationalReadiness } from "@/lib/operational-readiness/queries";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { writeAuditLog } from "@/lib/saas/audit";
import { isTenantAdminRoleCode } from "@/lib/saas/tenant-admin-access";

export type Mod00ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function revalidateReadiness() {
  revalidatePath("/settings/readiness");
  revalidatePath("/settings/readiness/company");
  revalidatePath("/settings/readiness/departments");
  revalidatePath("/settings/readiness/users");
  revalidatePath("/settings/readiness/doctors");
  revalidatePath("/settings/readiness/catalog");
  revalidatePath("/settings/readiness/reference-ranges");
  revalidatePath("/settings/readiness/analyzers");
  revalidatePath("/settings/readiness/lis");
  revalidatePath("/settings/readiness/portal");
  revalidatePath("/settings/departments");
  revalidatePath("/settings/audit");
}

async function actor(action: "canView" | "canEdit" | "canApprove" | "canCreate" = "canEdit") {
  const session = await requireTenantPermission(READINESS_RESOURCE, action);
  return {
    session,
    tenantId: session.tenantId,
    branchId: session.branchId,
    userId: session.userId,
    username: session.user.name,
    roleCode: session.user.roleCode,
  };
}

export async function saveCompanyProfileAction(input: {
  tenantName: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  reportHeaderLogoUrl?: string;
  reportFooterText?: string;
  invoiceFooterText?: string;
  headerBrandingText?: string;
  footerBrandingText?: string;
  barcodePrefix?: string;
}): Promise<Mod00ActionResult> {
  try {
    const a = await actor("canEdit");
    const tenantName = input.tenantName.trim();
    const address = input.address.trim();
    const phone = input.phone.trim();
    const email = input.email.trim().toLowerCase();

    if (!tenantName || !address || !phone || !email) {
      return { ok: false, error: "Company name, address, phone, and email are required." };
    }

    const updated = await prisma.tenant.update({
      where: { id: a.tenantId },
      data: {
        tenantName,
        address,
        contactMobile: phone,
        contactEmail: email,
        website: input.website?.trim() || null,
        logoUrl: input.logoUrl?.trim() || null,
        reportHeaderLogoUrl: input.reportHeaderLogoUrl?.trim() || null,
        reportFooterText: input.reportFooterText?.trim() || null,
        invoiceFooterText: input.invoiceFooterText?.trim() || null,
        headerBrandingText: input.headerBrandingText?.trim() || null,
        footerBrandingText: input.footerBrandingText?.trim() || null,
        barcodePrefix: input.barcodePrefix?.trim() || null,
        updatedBy: a.username,
      },
    });

    await writeAuditLog({
      tenantId: a.tenantId,
      branchId: a.branchId,
      userId: a.userId,
      actionType: "UPDATE",
      entityType: "TenantCompanyProfile",
      entityId: updated.id,
      changeData: {
        event: "COMPANY_PROFILE_UPDATED",
        tenantName,
        website: updated.website,
      },
      createdBy: a.username,
    });

    revalidateReadiness();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to save company profile.",
    };
  }
}

export async function createDepartmentAction(input: {
  deptCode: string;
  name: string;
  deptType: string;
}): Promise<Mod00ActionResult<{ id: string }>> {
  try {
    const a = await actor("canCreate");
    const deptCode = input.deptCode.trim().toUpperCase();
    const name = input.name.trim();
    const deptType = input.deptType.trim() || "Clinical";

    if (!deptCode || !name) {
      return { ok: false, error: "Department code and name are required." };
    }

    const existing = await prisma.department.findFirst({
      where: {
        deptCode,
        OR: [{ tenantId: a.tenantId }, { tenantId: null }],
      },
    });
    if (existing) {
      return { ok: false, error: "Department code already exists." };
    }

    const created = await prisma.department.create({
      data: {
        tenantId: a.tenantId,
        deptCode,
        name,
        deptType,
        createdBy: a.username,
        updatedBy: a.username,
      },
    });

    await writeAuditLog({
      tenantId: a.tenantId,
      branchId: a.branchId,
      userId: a.userId,
      actionType: "INSERT",
      entityType: "Department",
      entityId: created.id,
      changeData: { event: "DEPARTMENT_CREATED", deptCode, name },
      createdBy: a.username,
    });

    revalidateReadiness();
    return { ok: true, data: { id: created.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create department.",
    };
  }
}

export async function setDepartmentActiveAction(
  departmentId: string,
  isActive: boolean,
): Promise<Mod00ActionResult> {
  try {
    const a = await actor("canEdit");
    const dept = await prisma.department.findFirst({
      where: { id: departmentId, tenantId: a.tenantId },
    });
    if (!dept) {
      return { ok: false, error: "Only tenant-owned departments can be enabled or disabled here." };
    }

    await prisma.department.update({
      where: { id: departmentId },
      data: { isActive, updatedBy: a.username },
    });

    await writeAuditLog({
      tenantId: a.tenantId,
      branchId: a.branchId,
      userId: a.userId,
      actionType: "UPDATE",
      entityType: "Department",
      entityId: departmentId,
      changeData: {
        event: isActive ? "DEPARTMENT_ENABLED" : "DEPARTMENT_DISABLED",
        deptCode: dept.deptCode,
      },
      createdBy: a.username,
    });

    revalidateReadiness();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update department.",
    };
  }
}

export async function ensureSuggestedDepartmentsAction(): Promise<
  Mod00ActionResult<{ created: number }>
> {
  try {
    const a = await actor("canCreate");
    let created = 0;

    for (const suggested of SUGGESTED_DEPARTMENTS) {
      const existing = await prisma.department.findFirst({
        where: {
          OR: [
            { tenantId: a.tenantId, deptCode: suggested.deptCode },
            { tenantId: null, deptCode: suggested.deptCode },
            {
              tenantId: a.tenantId,
              name: { equals: suggested.name, mode: "insensitive" },
            },
          ],
        },
      });
      if (existing) {
        if (!existing.isActive && existing.tenantId === a.tenantId) {
          await prisma.department.update({
            where: { id: existing.id },
            data: { isActive: true, updatedBy: a.username },
          });
        }
        continue;
      }

      const row = await prisma.department.create({
        data: {
          tenantId: a.tenantId,
          deptCode: suggested.deptCode,
          name: suggested.name,
          deptType: suggested.deptType,
          createdBy: a.username,
          updatedBy: a.username,
        },
      });
      created += 1;
      await writeAuditLog({
        tenantId: a.tenantId,
        branchId: a.branchId,
        userId: a.userId,
        actionType: "INSERT",
        entityType: "Department",
        entityId: row.id,
        changeData: {
          event: "DEPARTMENT_CREATED",
          deptCode: suggested.deptCode,
          name: suggested.name,
          source: "suggested",
        },
        createdBy: a.username,
      });
    }

    revalidateReadiness();
    return { ok: true, data: { created } };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to ensure suggested departments.",
    };
  }
}

export async function createOperationalUserAction(input: {
  username: string;
  email: string;
  phone?: string;
  password: string;
  roleId: string;
  branchId: string;
  departmentId?: string;
}): Promise<Mod00ActionResult<{ userId: string }>> {
  try {
    const a = await actor("canCreate");
    const username = input.username.trim().toLowerCase();
    const email = input.email.trim().toLowerCase();
    const password = input.password.trim();

    if (!username || !email || !password || !input.roleId || !input.branchId) {
      return {
        ok: false,
        error: "Username, email, password, role, and branch are required.",
      };
    }

    const { hashPassword } = await import("@/lib/password");

    const [existingUsername, existingEmail, role, branch, department] =
      await Promise.all([
        prisma.user.findUnique({ where: { username }, select: { id: true } }),
        prisma.user.findUnique({ where: { email }, select: { id: true } }),
        prisma.role.findFirst({
          where: { id: input.roleId, tenantId: a.tenantId, isActive: true },
        }),
        prisma.branch.findFirst({
          where: { id: input.branchId, tenantId: a.tenantId, isActive: true },
        }),
        input.departmentId
          ? prisma.department.findFirst({
              where: {
                id: input.departmentId,
                OR: [{ tenantId: a.tenantId }, { tenantId: null }],
              },
            })
          : Promise.resolve(null),
      ]);

    if (existingUsername) return { ok: false, error: "Username already exists." };
    if (existingEmail) return { ok: false, error: "Email already exists." };
    if (!role) return { ok: false, error: "Selected role is invalid." };
    if (!branch) return { ok: false, error: "Selected branch is invalid." };
    if (input.departmentId && !department) {
      return { ok: false, error: "Selected department is invalid." };
    }
    if (isTenantAdminRoleCode(a.roleCode) && isTenantAdminRoleCode(role.roleCode)) {
      return {
        ok: false,
        error: "Tenant Administrators cannot create or assign another administrative role.",
      };
    }

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          tenantId: a.tenantId,
          username,
          email,
          phone: input.phone?.trim() || null,
          departmentId: department?.id ?? null,
          passwordHash: hashPassword(password),
          forcePasswordChange: true,
          createdBy: a.username,
          updatedBy: a.username,
        },
      });

      await tx.userRole.create({
        data: {
          tenantId: a.tenantId,
          userId: created.id,
          roleId: role.id,
          isPrimary: true,
          createdBy: a.username,
          updatedBy: a.username,
        },
      });

      await tx.userBranch.create({
        data: {
          tenantId: a.tenantId,
          userId: created.id,
          branchId: branch.id,
          isPrimary: true,
          createdBy: a.username,
          updatedBy: a.username,
        },
      });

      return created;
    });

    await writeAuditLog({
      tenantId: a.tenantId,
      branchId: a.branchId,
      userId: a.userId,
      actionType: "INSERT",
      entityType: "User",
      entityId: user.id,
      changeData: {
        event: "OPERATIONAL_USER_CREATED",
        username,
        roleCode: role.roleCode,
        departmentId: department?.id ?? null,
      },
      createdBy: a.username,
    });

    revalidatePath("/settings/users");
    revalidateReadiness();
    return { ok: true, data: { userId: user.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create user.",
    };
  }
}

export async function savePortalReadinessSettingsAction(input: {
  portalEnabled: boolean;
  selfRegistration: boolean;
  downloadPdfEnabled: boolean;
  qrVerificationEnabled: boolean;
  notificationEnabled: boolean;
  passwordMinLength: number;
  passwordRequireMixed: boolean;
}): Promise<Mod00ActionResult> {
  try {
    const a = await actor("canEdit");
    const passwordMinLength = Math.min(
      32,
      Math.max(6, Math.floor(input.passwordMinLength || 8)),
    );

    const saved = await prisma.tenantPortalSettings.upsert({
      where: { tenantId: a.tenantId },
      create: {
        tenantId: a.tenantId,
        portalEnabled: input.portalEnabled,
        selfRegistration: input.selfRegistration,
        downloadPdfEnabled: input.downloadPdfEnabled,
        qrVerificationEnabled: input.qrVerificationEnabled,
        notificationEnabled: input.notificationEnabled,
        passwordMinLength,
        passwordRequireMixed: input.passwordRequireMixed,
        createdBy: a.username,
        updatedBy: a.username,
      },
      update: {
        portalEnabled: input.portalEnabled,
        selfRegistration: input.selfRegistration,
        downloadPdfEnabled: input.downloadPdfEnabled,
        qrVerificationEnabled: input.qrVerificationEnabled,
        notificationEnabled: input.notificationEnabled,
        passwordMinLength,
        passwordRequireMixed: input.passwordRequireMixed,
        updatedBy: a.username,
      },
    });

    await writeAuditLog({
      tenantId: a.tenantId,
      branchId: a.branchId,
      userId: a.userId,
      actionType: "UPDATE",
      entityType: "TenantPortalSettings",
      entityId: saved.id,
      changeData: {
        event: "PORTAL_READINESS_SETTINGS_UPDATED",
        ...input,
        passwordMinLength,
      },
      createdBy: a.username,
    });

    revalidatePath("/settings/patient-portal");
    revalidateReadiness();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to save portal settings.",
    };
  }
}

export async function saveAnalyzerLisConfigAction(input: {
  analyzerId: string;
  lisEndpoint: string;
  isActive?: boolean;
}): Promise<Mod00ActionResult> {
  try {
    const a = await actor("canEdit");
    const analyzer = await prisma.analyzer.findFirst({
      where: { id: input.analyzerId, tenantId: a.tenantId },
    });
    if (!analyzer) return { ok: false, error: "Analyzer not found." };

    const updated = await prisma.analyzer.update({
      where: { id: analyzer.id },
      data: {
        lisEndpoint: input.lisEndpoint.trim() || null,
        lisConnectionStatus: input.lisEndpoint.trim()
          ? analyzer.lisConnectionStatus === "NOT_CONFIGURED"
            ? "CONFIGURED"
            : analyzer.lisConnectionStatus
          : "NOT_CONFIGURED",
        isActive: input.isActive ?? analyzer.isActive,
        updatedBy: a.username,
      },
    });

    await writeAuditLog({
      tenantId: a.tenantId,
      branchId: a.branchId,
      userId: a.userId,
      actionType: "UPDATE",
      entityType: "Analyzer",
      entityId: updated.id,
      changeData: {
        event: "ANALYZER_LIS_CONFIG_UPDATED",
        lisEndpoint: updated.lisEndpoint,
        lisConnectionStatus: updated.lisConnectionStatus,
      },
      createdBy: a.username,
    });

    revalidatePath("/settings/analyzers");
    revalidateReadiness();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to save LIS config.",
    };
  }
}

export async function testAnalyzerLisConnectionAction(
  analyzerId: string,
): Promise<Mod00ActionResult<{ status: string; at: string }>> {
  try {
    const a = await actor("canEdit");
    const analyzer = await prisma.analyzer.findFirst({
      where: { id: analyzerId, tenantId: a.tenantId },
      include: {
        mappings: { where: { isActive: true }, select: { id: true } },
      },
    });
    if (!analyzer) return { ok: false, error: "Analyzer not found." };
    if (!analyzer.lisEndpoint?.trim()) {
      return { ok: false, error: "Configure an LIS endpoint before testing." };
    }

    const now = new Date();
    const status = "SIMULATED_CONNECTED";
    await prisma.analyzer.update({
      where: { id: analyzer.id },
      data: {
        lisConnectionStatus: status,
        lisLastCommunicationAt: now,
        updatedBy: a.username,
      },
    });

    await writeAuditLog({
      tenantId: a.tenantId,
      branchId: a.branchId,
      userId: a.userId,
      actionType: "UPDATE",
      entityType: "Analyzer",
      entityId: analyzer.id,
      changeData: {
        event: "ANALYZER_LIS_CONNECTION_TESTED",
        status,
        mappedTests: analyzer.mappings.length,
        simulation: true,
      },
      createdBy: a.username,
    });

    revalidateReadiness();
    return {
      ok: true,
      data: { status, at: now.toISOString() },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "LIS connection test failed.",
    };
  }
}

export async function createAnalyzerForReadinessAction(input: {
  analyzerCode: string;
  machineName: string;
  departmentId: string;
  interfaceType: string;
  model?: string;
  manufacturer?: string;
  lisEndpoint?: string;
}): Promise<Mod00ActionResult<{ id: string }>> {
  try {
    const a = await actor("canCreate");
    const analyzerCode = input.analyzerCode.trim().toUpperCase();
    const machineName = input.machineName.trim();
    if (!analyzerCode || !machineName || !input.departmentId) {
      return { ok: false, error: "Code, name, and department are required." };
    }

    const existing = await prisma.analyzer.findFirst({
      where: {
        tenantId: a.tenantId,
        branchId: a.branchId,
        analyzerCode,
      },
    });
    if (existing) {
      return { ok: false, error: "Analyzer code already exists for this branch." };
    }

    const created = await prisma.analyzer.create({
      data: {
        tenantId: a.tenantId,
        branchId: a.branchId,
        departmentId: input.departmentId,
        analyzerCode,
        machineName,
        interfaceType: input.interfaceType.trim() || "SIMULATED",
        model: input.model?.trim() || null,
        manufacturer: input.manufacturer?.trim() || null,
        lisEndpoint: input.lisEndpoint?.trim() || null,
        lisConnectionStatus: input.lisEndpoint?.trim()
          ? "CONFIGURED"
          : "NOT_CONFIGURED",
        createdBy: a.username,
        updatedBy: a.username,
      },
    });

    await writeAuditLog({
      tenantId: a.tenantId,
      branchId: a.branchId,
      userId: a.userId,
      actionType: "INSERT",
      entityType: "Analyzer",
      entityId: created.id,
      changeData: {
        event: "ANALYZER_CREATED",
        analyzerCode,
        machineName,
      },
      createdBy: a.username,
    });

    revalidatePath("/settings/analyzers");
    revalidateReadiness();
    return { ok: true, data: { id: created.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create analyzer.",
    };
  }
}

export async function declareReadyForFirstPatientAction(): Promise<
  Mod00ActionResult<{ snapshotId: string; scorePercent: number }>
> {
  try {
    const a = await actor("canApprove");
    const report = await loadOperationalReadiness(a.tenantId);

    if (!report.canDeclareReady) {
      return {
        ok: false,
        error: `Not ready. Blocking items: ${report.blockers.join(", ") || "unknown"}`,
      };
    }

    const now = new Date();
    const snapshot = await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: a.tenantId },
        data: {
          readyForFirstPatientAt: now,
          readyForFirstPatientById: a.userId,
          onboardingStatus: "ACTIVE",
          updatedBy: a.username,
        },
      });

      return tx.operationalReadinessSnapshot.create({
        data: {
          tenantId: a.tenantId,
          branchId: a.branchId,
          scorePercent: report.scorePercent,
          readyStatus: "READY_FOR_FIRST_PATIENT",
          checklistJson: report.items,
          softwareVersion: MOD00_SOFTWARE_VERSION,
          declaredReady: true,
          createdById: a.userId,
          createdByName: a.username,
        },
      });
    });

    await writeAuditLog({
      tenantId: a.tenantId,
      branchId: a.branchId,
      userId: a.userId,
      actionType: "UPDATE",
      entityType: "OperationalReadinessSnapshot",
      entityId: snapshot.id,
      changeData: {
        event: "READY_FOR_FIRST_PATIENT_DECLARED",
        scorePercent: report.scorePercent,
        softwareVersion: MOD00_SOFTWARE_VERSION,
      },
      createdBy: a.username,
    });

    revalidateReadiness();
    revalidatePath("/dashboard");
    return {
      ok: true,
      data: { snapshotId: snapshot.id, scorePercent: report.scorePercent },
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to declare ready for first patient.",
    };
  }
}

export async function refreshReadinessSnapshotAction(): Promise<
  Mod00ActionResult<{ scorePercent: number }>
> {
  try {
    const a = await actor("canView");
    const report = await loadOperationalReadiness(a.tenantId);
    await prisma.operationalReadinessSnapshot.create({
      data: {
        tenantId: a.tenantId,
        branchId: a.branchId,
        scorePercent: report.scorePercent,
        readyStatus: report.readyStatus,
        checklistJson: report.items,
        softwareVersion: MOD00_SOFTWARE_VERSION,
        declaredReady: false,
        createdById: a.userId,
        createdByName: a.username,
      },
    });
    revalidateReadiness();
    return { ok: true, data: { scorePercent: report.scorePercent } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to refresh snapshot.",
    };
  }
}
