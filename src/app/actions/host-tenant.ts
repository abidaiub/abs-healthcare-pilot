"use server";

import { revalidatePath } from "next/cache";
import type {
  BillingCycle,
  EntityStatus,
  ModuleStatus,
  OnboardingStatus,
  TenantStatus,
  TenantType,
} from "@/generated/prisma/client";
import { requireHostSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { writeAuditLog, writeStatusHistory } from "@/lib/saas/audit";
import {
  parseBillingCycle,
  parseOnboardingStatus,
  parseTenantStatus,
  parseTenantType,
} from "@/lib/saas/format";
import { evaluateTenantOnboarding } from "@/lib/saas/onboarding";
import {
  assertHostCanAccessTenant,
  assertTenantOwnsBranch,
  getTenantDetailById,
} from "@/lib/saas/queries";
import {
  mapLocaleToLegacyLanguage,
  parseTenantLocaleProfileFromForm,
} from "@/lib/locale/validation";

export type HostActionResult =
  | { ok: true; tenantId?: string; branchId?: string }
  | { ok: false; error: string };

function parseDateInput(value: string): Date | null {
  if (!value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function actorLabel(username: string, loginKind: "host" | "tenant"): string {
  return loginKind === "host" ? `${username} (Host)` : username;
}

async function getHostActor() {
  const session = await requireHostSession();
  return {
    session,
    userId: session.userId,
    username: session.user.name,
    label: actorLabel(session.user.name, "host"),
  };
}

async function revalidateTenantPaths(tenantId: string) {
  revalidatePath("/host/tenants");
  revalidatePath("/host/dashboard");
  revalidatePath(`/host/tenants/${tenantId}`);
  revalidatePath(`/host/tenants/${tenantId}/edit`);
  revalidatePath(`/host/tenants/${tenantId}/branches`);
  revalidatePath("/host/audit");
}

function tenantLocaleDataFromForm(formData: FormData) {
  const parsed = parseTenantLocaleProfileFromForm(formData);
  if (!parsed.ok) {
    return parsed;
  }

  return {
    ok: true as const,
    profile: parsed.profile,
    data: {
      country: parsed.profile.countryName,
      countryCode: parsed.profile.countryCode,
      defaultLocale: parsed.profile.defaultLocale,
      supportedLocales: parsed.profile.supportedLocales,
      timezone: parsed.profile.timezone,
      currencyCode: parsed.profile.currencyCode,
      dateFormat: parsed.profile.dateFormat,
      numberFormat: parsed.profile.numberFormat,
      textDirection: parsed.profile.textDirection,
      defaultLanguage: mapLocaleToLegacyLanguage(parsed.profile.defaultLocale),
    },
  };
}

export async function createTenantAction(
  formData: FormData,
): Promise<HostActionResult> {
  const actor = await getHostActor();

  const tenantCode = String(formData.get("tenantCode") ?? "")
    .trim()
    .toUpperCase();
  const tenantName = String(formData.get("tenantName") ?? "").trim();
  const contactPerson = String(formData.get("contactPerson") ?? "").trim();
  const contactMobile = String(formData.get("contactMobile") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const packageId = String(formData.get("packageId") ?? "").trim();
  const tenantTypeRaw = String(formData.get("tenantType") ?? "").trim();
  const billingCycleRaw = String(formData.get("billingCycle") ?? "MONTHLY").trim();

  if (!tenantCode || !tenantName || !contactPerson || !contactMobile || !contactEmail) {
    return { ok: false, error: "Required tenant profile fields are missing." };
  }

  if (!packageId) {
    return { ok: false, error: "Subscription package is required." };
  }

  const tenantType = parseTenantType(tenantTypeRaw) ?? ("MIXED" as TenantType);
  const billingCycle =
    parseBillingCycle(billingCycleRaw) ?? ("MONTHLY" as BillingCycle);

  const existingCode = await prisma.tenant.findUnique({
    where: { tenantCode },
    select: { id: true },
  });
  if (existingCode) {
    return { ok: false, error: "Tenant code already exists." };
  }

  const pkg = await prisma.subscriptionPackage.findFirst({
    where: { id: packageId, isActive: true },
  });
  if (!pkg) {
    return { ok: false, error: "Selected subscription package is invalid." };
  }

  const subscriptionStart =
    parseDateInput(String(formData.get("subscriptionStart") ?? "")) ?? new Date();
  const subscriptionEnd =
    parseDateInput(String(formData.get("subscriptionEnd") ?? "")) ??
    new Date(subscriptionStart.getTime() + 365 * 24 * 60 * 60 * 1000);

  const adminName = String(formData.get("adminName") ?? "").trim();
  const adminEmail = String(formData.get("adminEmail") ?? "").trim();
  const adminPassword =
    String(formData.get("adminPassword") ?? "").trim() || "Tenant@2026!";
  const adminUsername =
    String(formData.get("adminUsername") ?? "").trim() ||
    adminEmail.split("@")[0]?.toLowerCase() ||
    `${tenantCode.toLowerCase()}.admin`;

  if (!adminName || !adminEmail) {
    return { ok: false, error: "Primary tenant admin name and email are required." };
  }

  const localeResult = tenantLocaleDataFromForm(formData);
  if (!localeResult.ok) {
    return { ok: false, error: localeResult.error };
  }

  const tenant = await prisma.$transaction(async (tx) => {
    const created = await tx.tenant.create({
      data: {
        tenantCode,
        tenantName,
        shortCode: tenantCode,
        legalName: String(formData.get("legalName") ?? "").trim() || null,
        tradeLicenseNo: String(formData.get("tradeLicenseNo") ?? "").trim() || null,
        taxBinNo: String(formData.get("taxBinNo") ?? "").trim() || null,
        contactPerson,
        contactMobile,
        contactEmail,
        address: String(formData.get("address") ?? "").trim() || null,
        city: String(formData.get("city") ?? "").trim() || null,
        district: String(formData.get("district") ?? "").trim() || null,
        ...localeResult.data,
        tenantType,
        tenantStatus: "TRIAL",
        onboardingStatus: "SETUP_PENDING",
        logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
        reportHeaderLogoUrl:
          String(formData.get("reportHeaderLogoUrl") ?? "").trim() || null,
        reportFooterText:
          String(formData.get("reportFooterText") ?? "").trim() || null,
        createdBy: actor.username,
      },
    });

    await tx.tenantSubscription.create({
      data: {
        tenantId: created.id,
        packageId: pkg.id,
        subscriptionStart,
        subscriptionEnd,
        billingCycle,
        subscriptionStatus: "TRIAL",
        nextBillingDate: subscriptionEnd,
        gracePeriodDays: Number(formData.get("gracePeriodDays") ?? 7),
        autoRenew: String(formData.get("autoRenew") ?? "true") === "true",
        createdBy: actor.username,
      },
    });

    await tx.tenantUsageLimit.create({
      data: {
        tenantId: created.id,
        maxBranches: pkg.includedBranches,
        maxUsers: pkg.includedUsers,
        maxPatientsPerMonth: pkg.includedPatientsPerMonth,
        maxOrdersPerMonth: pkg.includedOrdersPerMonth,
        maxReportsPerMonth: pkg.includedOrdersPerMonth,
        maxStorageGb: pkg.includedStorageGb,
        maxSmsPerMonth: 500,
        maxWhatsappPerMonth: 200,
        maxApiCallsPerMonth: 5000,
        allowCustomDomain: false,
        allowApiAccess: false,
        allowPatientPortal: false,
        allowMultiBranch: pkg.includedBranches > 1,
        allowReportBranding: true,
        createdBy: actor.username,
      },
    });

    const modules = await tx.moduleRegistry.findMany({
      where: { isActive: true },
    });

    for (const mod of modules) {
      await tx.tenantModule.create({
        data: {
          tenantId: created.id,
          moduleId: mod.id,
          isEnabled: mod.isCore,
          enabledFrom: new Date(),
          moduleStatus: mod.isCore ? "ACTIVE" : "DISABLED",
          createdBy: actor.username,
        },
      });
    }

    const tenantRole = await tx.role.create({
      data: {
        tenantId: created.id,
        roleCode: "TENANT_ADMIN",
        roleName: "Primary Tenant Admin",
        description: "Primary tenant administrator",
        createdBy: actor.username,
      },
    });

    const adminUser = await tx.user.create({
      data: {
        tenantId: created.id,
        username: adminUsername,
        email: adminEmail,
        phone: String(formData.get("adminMobile") ?? "").trim() || null,
        passwordHash: hashPassword(adminPassword),
        isHostAdmin: false,
        createdBy: actor.username,
      },
    });

    await tx.userRole.create({
      data: {
        tenantId: created.id,
        userId: adminUser.id,
        roleId: tenantRole.id,
        isPrimary: true,
        createdBy: actor.username,
      },
    });

    await tx.statusHistory.create({
      data: {
        tenantId: created.id,
        entityType: "Tenant",
        entityId: created.id,
        oldStatus: "—",
        newStatus: "TRIAL",
        remarks: "Tenant created",
        changedBy: actor.label,
        changedAt: new Date(),
        createdBy: actor.username,
      },
    });

    return created;
  });

  await writeAuditLog({
    tenantId: tenant.id,
    userId: actor.userId,
    actionType: "INSERT",
    entityType: "Tenant",
    entityId: tenant.id,
    changeData: {
      newValue: `${tenant.tenantCode} — ${tenant.tenantName}`,
      onboardingStatus: tenant.onboardingStatus,
    },
    createdBy: actor.username,
  });

  await revalidateTenantPaths(tenant.id);
  return { ok: true, tenantId: tenant.id };
}

export async function updateTenantAction(
  tenantId: string,
  formData: FormData,
): Promise<HostActionResult> {
  const actor = await getHostActor();
  await assertHostCanAccessTenant(tenantId);

  const existing = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!existing) return { ok: false, error: "Tenant not found." };

  const tenantName = String(formData.get("tenantName") ?? "").trim();
  const contactPerson = String(formData.get("contactPerson") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactMobile = String(formData.get("contactMobile") ?? "").trim();

  if (!tenantName || !contactPerson || !contactEmail || !contactMobile) {
    return { ok: false, error: "Required tenant profile fields are missing." };
  }

  const localeResult = tenantLocaleDataFromForm(formData);
  if (!localeResult.ok) {
    return { ok: false, error: localeResult.error };
  }

  const tenantType =
    parseTenantType(String(formData.get("tenantType") ?? "")) ?? existing.tenantType;
  const tenantStatus =
    parseTenantStatus(String(formData.get("tenantStatus") ?? "")) ??
    existing.tenantStatus;
  const onboardingStatus =
    parseOnboardingStatus(String(formData.get("onboardingStatus") ?? "")) ??
    existing.onboardingStatus;

  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      tenantName,
      legalName: String(formData.get("legalName") ?? "").trim() || null,
      tradeLicenseNo: String(formData.get("tradeLicenseNo") ?? "").trim() || null,
      taxBinNo: String(formData.get("taxBinNo") ?? "").trim() || null,
      contactPerson,
      contactMobile,
      contactEmail,
      address: String(formData.get("address") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
      district: String(formData.get("district") ?? "").trim() || null,
      ...localeResult.data,
      tenantType,
      tenantStatus,
      onboardingStatus,
      logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
      reportHeaderLogoUrl:
        String(formData.get("reportHeaderLogoUrl") ?? "").trim() || null,
      reportFooterText:
        String(formData.get("reportFooterText") ?? "").trim() || null,
      updatedBy: actor.username,
    },
  });

  const packageId = String(formData.get("packageId") ?? "").trim();
  if (packageId) {
    const pkg = await prisma.subscriptionPackage.findFirst({
      where: { id: packageId, isActive: true },
    });
    if (pkg) {
      const billingCycle =
        parseBillingCycle(String(formData.get("billingCycle") ?? "")) ??
        ("MONTHLY" as BillingCycle);
      const subscriptionStart = parseDateInput(
        String(formData.get("subscriptionStart") ?? ""),
      );
      const subscriptionEnd = parseDateInput(
        String(formData.get("subscriptionEnd") ?? ""),
      );

      const currentSub = await prisma.tenantSubscription.findFirst({
        where: { tenantId, isActive: true },
        orderBy: { createdAt: "desc" },
      });

      if (currentSub) {
        await prisma.tenantSubscription.update({
          where: { id: currentSub.id },
          data: {
            packageId: pkg.id,
            billingCycle,
            subscriptionStart: subscriptionStart ?? currentSub.subscriptionStart,
            subscriptionEnd: subscriptionEnd ?? currentSub.subscriptionEnd,
            gracePeriodDays: Number(
              formData.get("gracePeriodDays") ?? currentSub.gracePeriodDays,
            ),
            autoRenew: String(formData.get("autoRenew") ?? String(currentSub.autoRenew)) === "true",
            updatedBy: actor.username,
          },
        });
      } else {
        await prisma.tenantSubscription.create({
          data: {
            tenantId,
            packageId: pkg.id,
            subscriptionStart: subscriptionStart ?? new Date(),
            subscriptionEnd:
              subscriptionEnd ??
              new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            billingCycle,
            subscriptionStatus: "TRIAL",
            gracePeriodDays: Number(formData.get("gracePeriodDays") ?? 7),
            autoRenew: String(formData.get("autoRenew") ?? "true") === "true",
            createdBy: actor.username,
          },
        });
      }
    }
  }

  await writeAuditLog({
    tenantId,
    userId: actor.userId,
    actionType: "UPDATE",
    entityType: "Tenant",
    entityId: tenantId,
    changeData: {
      oldValue: existing.tenantName,
      newValue: updated.tenantName,
    },
    createdBy: actor.username,
  });

  await revalidateTenantPaths(tenantId);
  return { ok: true, tenantId };
}

export async function changeTenantStatusAction(input: {
  tenantId: string;
  action: "suspend" | "reactivate" | "archive" | "activate";
  reason?: string;
}): Promise<HostActionResult> {
  const actor = await getHostActor();
  await assertHostCanAccessTenant(input.tenantId);

  const tenant = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
  });
  if (!tenant) return { ok: false, error: "Tenant not found." };

  let newStatus: TenantStatus = tenant.tenantStatus;
  let newOnboarding: OnboardingStatus = tenant.onboardingStatus;

  switch (input.action) {
    case "suspend": {
      if (!input.reason?.trim()) {
        return { ok: false, error: "Suspension reason is required." };
      }
      newStatus = "SUSPENDED";
      break;
    }
    case "reactivate": {
      newStatus = "ACTIVE";
      break;
    }
    case "archive": {
      if (!input.reason?.trim()) {
        return { ok: false, error: "Archive reason is required." };
      }
      newStatus = "ARCHIVED";
      newOnboarding = "BLOCKED";
      break;
    }
    case "activate": {
      const detail = await getTenantDetailById(input.tenantId);
      if (!detail) return { ok: false, error: "Tenant not found." };
      const onboarding = evaluateTenantOnboarding(detail);
      if (!onboarding.canActivate) {
        return {
          ok: false,
          error: `Activation blocked: ${onboarding.blockers.join("; ")}`,
        };
      }
      newStatus = "ACTIVE";
      newOnboarding = "ACTIVE";
      break;
    }
  }

  if (newStatus === tenant.tenantStatus && newOnboarding === tenant.onboardingStatus) {
    return { ok: false, error: "No status change required." };
  }

  await prisma.tenant.update({
    where: { id: input.tenantId },
    data: {
      tenantStatus: newStatus,
      onboardingStatus: newOnboarding,
      updatedBy: actor.username,
    },
  });

  await writeStatusHistory({
    tenantId: input.tenantId,
    entityType: "Tenant",
    entityId: input.tenantId,
    oldStatus: tenant.tenantStatus,
    newStatus,
    remarks: input.reason ?? `Tenant ${input.action}`,
    changedBy: actor.label,
  });

  await writeAuditLog({
    tenantId: input.tenantId,
    userId: actor.userId,
    actionType: "UPDATE",
    entityType: "TenantStatus",
    entityId: input.tenantId,
    changeData: {
      oldValue: tenant.tenantStatus,
      newValue: newStatus,
      reason: input.reason ?? null,
      action: input.action,
    },
    createdBy: actor.username,
  });

  await revalidateTenantPaths(input.tenantId);
  return { ok: true, tenantId: input.tenantId };
}

export async function createBranchAction(
  tenantId: string,
  formData: FormData,
): Promise<HostActionResult> {
  const actor = await getHostActor();
  await assertHostCanAccessTenant(tenantId);

  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const name = String(formData.get("name") ?? "").trim();

  if (!code || !name) {
    return { ok: false, error: "Branch code and name are required." };
  }

  const duplicate = await prisma.branch.findFirst({
    where: { tenantId, code },
  });
  if (duplicate) {
    return { ok: false, error: "Branch code must be unique within the tenant." };
  }

  const branch = await prisma.branch.create({
    data: {
      tenantId,
      code,
      name,
      address: String(formData.get("address") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
      district: String(formData.get("district") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      status: "ACTIVE",
      createdBy: actor.username,
    },
  });

  await writeAuditLog({
    tenantId,
    branchId: branch.id,
    userId: actor.userId,
    actionType: "INSERT",
    entityType: "Branch",
    entityId: branch.id,
    changeData: { newValue: `${branch.code} — ${branch.name}` },
    createdBy: actor.username,
  });

  await revalidateTenantPaths(tenantId);
  return { ok: true, tenantId, branchId: branch.id };
}

export async function updateBranchAction(
  tenantId: string,
  branchId: string,
  formData: FormData,
): Promise<HostActionResult> {
  const actor = await getHostActor();
  await assertHostCanAccessTenant(tenantId);
  const existing = await assertTenantOwnsBranch(tenantId, branchId);

  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const name = String(formData.get("name") ?? "").trim();

  if (!code || !name) {
    return { ok: false, error: "Branch code and name are required." };
  }

  const duplicate = await prisma.branch.findFirst({
    where: { tenantId, code, NOT: { id: branchId } },
  });
  if (duplicate) {
    return { ok: false, error: "Branch code must be unique within the tenant." };
  }

  const statusRaw = String(formData.get("status") ?? "ACTIVE").trim().toUpperCase();
  const status: EntityStatus =
    statusRaw === "INACTIVE" || statusRaw === "ARCHIVED"
      ? (statusRaw as EntityStatus)
      : "ACTIVE";

  const branch = await prisma.branch.update({
    where: { id: branchId },
    data: {
      code,
      name,
      address: String(formData.get("address") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
      district: String(formData.get("district") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      status,
      isActive: status === "ACTIVE",
      updatedBy: actor.username,
    },
  });

  await writeAuditLog({
    tenantId,
    branchId: branch.id,
    userId: actor.userId,
    actionType: "UPDATE",
    entityType: "Branch",
    entityId: branch.id,
    changeData: {
      oldValue: `${existing.code} — ${existing.name}`,
      newValue: `${branch.code} — ${branch.name}`,
    },
    createdBy: actor.username,
  });

  await revalidateTenantPaths(tenantId);
  return { ok: true, tenantId, branchId };
}

export async function updateTenantModuleAction(input: {
  tenantId: string;
  tenantModuleId: string;
  isEnabled: boolean;
}): Promise<HostActionResult> {
  const actor = await getHostActor();
  await assertHostCanAccessTenant(input.tenantId);

  const entry = await prisma.tenantModule.findFirst({
    where: { id: input.tenantModuleId, tenantId: input.tenantId, isActive: true },
    include: { module: true },
  });
  if (!entry) return { ok: false, error: "Module assignment not found." };

  const moduleStatus: ModuleStatus = input.isEnabled ? "ACTIVE" : "DISABLED";

  await prisma.tenantModule.update({
    where: { id: entry.id },
    data: {
      isEnabled: input.isEnabled,
      moduleStatus,
      updatedBy: actor.username,
    },
  });

  await writeAuditLog({
    tenantId: input.tenantId,
    userId: actor.userId,
    actionType: "UPDATE",
    entityType: "TenantModule",
    entityId: entry.id,
    changeData: {
      oldValue: `${entry.module.moduleCode}: ${entry.isEnabled ? "Enabled" : "Disabled"}`,
      newValue: `${entry.module.moduleCode}: ${input.isEnabled ? "Enabled" : "Disabled"}`,
    },
    createdBy: actor.username,
  });

  await revalidateTenantPaths(input.tenantId);
  return { ok: true, tenantId: input.tenantId };
}

export async function updateTenantSettingsAction(
  tenantId: string,
  formData: FormData,
): Promise<HostActionResult> {
  const actor = await getHostActor();
  await assertHostCanAccessTenant(tenantId);

  const existing = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!existing) return { ok: false, error: "Tenant not found." };

  const localeResult = tenantLocaleDataFromForm(formData);
  if (!localeResult.ok) {
    return { ok: false, error: localeResult.error };
  }

  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
      reportHeaderLogoUrl:
        String(formData.get("reportHeaderLogoUrl") ?? "").trim() || null,
      reportFooterText:
        String(formData.get("reportFooterText") ?? "").trim() || null,
      ...localeResult.data,
      contactPerson: String(formData.get("contactPerson") ?? existing.contactPerson).trim(),
      contactMobile: String(formData.get("contactMobile") ?? existing.contactMobile).trim(),
      contactEmail: String(formData.get("contactEmail") ?? existing.contactEmail).trim(),
      address: String(formData.get("address") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
      district: String(formData.get("district") ?? "").trim() || null,
      updatedBy: actor.username,
    },
  });

  await writeAuditLog({
    tenantId,
    userId: actor.userId,
    actionType: "UPDATE",
    entityType: "TenantSettings",
    entityId: tenantId,
    changeData: {
      oldValue: existing.reportFooterText ?? "—",
      newValue: updated.reportFooterText ?? "—",
    },
    createdBy: actor.username,
  });

  await revalidateTenantPaths(tenantId);
  revalidatePath(`/api/v1/companies/${tenantId}/settings`);
  return { ok: true, tenantId };
}
