/**
 * Idempotent Doctors Point Diagnostic Center UAT seed.
 *
 * Sets up everything the end-to-end walkthrough needs *before* the first clinical action:
 * tenant, subscription, branch, departments, roles, users, doctors, published schedules,
 * priced catalog, analyzers with test-code mappings, and the three patient records.
 * The clinical and financial transactions themselves are performed through the UI during
 * UAT so that every state transition passes the real authorization and audit paths.
 */

import type { PrismaClient } from "../../../src/generated/prisma/client";
import {
  BillingCycle,
  ModuleStatus,
  OnboardingStatus,
  SubscriptionStatus,
  TenantStatus,
  TenantType,
  UserStatus,
} from "../../../src/generated/prisma/client";
import { hashPassword } from "../../../src/lib/password";
import {
  TENANT_PERMISSION_RESOURCES,
  type PermissionAction,
} from "../../../src/lib/rbac/permission-catalog";
import { importHostServicesByCode } from "../../../src/lib/diagnostic/host-service-import";
import { buildFullName, normalizeMobile } from "../../../src/lib/patient/normalize";
import {
  DOCTORS_POINT,
  DOCTORS_POINT_ANALYZERS,
  DOCTORS_POINT_BRANCH,
  DOCTORS_POINT_CATALOG_GAPS,
  DOCTORS_POINT_DEPARTMENTS,
  DOCTORS_POINT_DOCTORS,
  DOCTORS_POINT_GUARDIAN_PATIENT,
  DOCTORS_POINT_PATIENTS,
  DOCTORS_POINT_PORTAL_ACCOUNTS,
  DOCTORS_POINT_PORTAL_DELEGATIONS,
  DOCTORS_POINT_PRICE_LIST,
  DOCTORS_POINT_ROLES,
  DOCTORS_POINT_USERS,
  type UatPatientSeed,
  type UatRoleSeed,
} from "./doctors-point-data";
import { seedDoctorsPointReferenceRanges } from "./doctors-point-reference-ranges";

const ACTOR = "seed.doctors-point-uat";

/** Shared UAT password. Development only — never used for a production tenant. */
export const UAT_PASSWORD = "DoctorsPoint@2026!";
export const UAT_PORTAL_PASSWORD = "Portal@2026!";

const ALL_ACTIONS: PermissionAction[] = [
  "canView",
  "canCreate",
  "canEdit",
  "canDelete",
  "canApprove",
  "canPrint",
];

const ENABLED_MODULES = new Set([
  "MOD-01",
  "MOD-02",
  "MOD-03",
  "MOD-04",
  "MOD-05",
  "MOD-06",
  "MOD-07",
  "MOD-08",
  "MOD-10",
  "MOD-11",
  "MOD-15",
  "MOD-16",
  "MOD-17",
  "MOD-18",
  "MOD-19",
  "MOD-21",
  "MOD-22",
  "MOD-23",
  "MOD-24",
  "MOD-30",
]);

export type DoctorsPointSeedSummary = {
  tenantId: string;
  branchId: string;
  departments: number;
  roles: number;
  users: number;
  doctors: number;
  publishedShifts: number;
  services: number;
  analyzerMappings: number;
  referenceRanges: number;
  referenceRangeGaps: number;
  patients: number;
  portalAccounts: number;
  portalDelegations: number;
  catalogGaps: typeof DOCTORS_POINT_CATALOG_GAPS;
};

async function seedTenantAndSubscription(prisma: PrismaClient) {
  const tenantProfile = {
    tenantName: DOCTORS_POINT.tenantName,
    shortCode: DOCTORS_POINT.shortCode,
    legalName: DOCTORS_POINT.legalName,
    contactPerson: DOCTORS_POINT.contactPerson,
    contactMobile: DOCTORS_POINT.contactMobile,
    contactEmail: DOCTORS_POINT.contactEmail,
    address: DOCTORS_POINT.address,
    city: DOCTORS_POINT.city,
    district: DOCTORS_POINT.district,
    country: DOCTORS_POINT.country,
    countryCode: DOCTORS_POINT.countryCode,
    timezone: DOCTORS_POINT.timezone,
    defaultLocale: DOCTORS_POINT.defaultLocale,
    defaultLanguage: "BN",
    supportedLocales: [...DOCTORS_POINT.supportedLocales],
    currencyCode: DOCTORS_POINT.currencyCode,
    tenantType: TenantType.DIAGNOSTIC,
    tenantStatus: TenantStatus.ACTIVE,
    onboardingStatus: OnboardingStatus.ACTIVE,
    reportFooterText: DOCTORS_POINT.reportFooterText,
    // Case 3 exercises the billing hold and critical-acknowledgement blockers.
    labReportReleaseEnforceBillingClearance: true,
    labReportReleaseEnforceQualityClearance: true,
    labReportReleaseEnforceCriticalAck: true,
    isActive: true,
  };

  const tenant = await prisma.tenant.upsert({
    where: { tenantCode: DOCTORS_POINT.tenantCode },
    update: tenantProfile,
    create: { tenantCode: DOCTORS_POINT.tenantCode, ...tenantProfile },
  });

  const pkg = await prisma.subscriptionPackage.findUnique({ where: { packageCode: "PKG-PRO" } });
  if (pkg) {
    const existing = await prisma.tenantSubscription.findFirst({
      where: { tenantId: tenant.id, isActive: true },
    });
    if (!existing) {
      await prisma.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          packageId: pkg.id,
          subscriptionStart: new Date("2026-01-01T00:00:00.000Z"),
          subscriptionEnd: new Date("2026-12-31T23:59:59.000Z"),
          billingCycle: BillingCycle.MONTHLY,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          nextBillingDate: new Date("2026-08-01T00:00:00.000Z"),
          gracePeriodDays: 7,
          autoRenew: true,
        },
      });
    }
  }

  const usageLimits = {
    maxBranches: 5,
    maxUsers: 50,
    maxPatientsPerMonth: 5000,
    maxOrdersPerMonth: 10000,
    maxReportsPerMonth: 8000,
    maxStorageGb: 50,
    maxSmsPerMonth: 2000,
    maxWhatsappPerMonth: 1000,
    maxApiCallsPerMonth: 50000,
    allowCustomDomain: false,
    allowApiAccess: true,
    allowPatientPortal: true,
    allowMultiBranch: true,
    allowReportBranding: true,
  };

  await prisma.tenantUsageLimit.upsert({
    where: { tenantId: tenant.id },
    update: usageLimits,
    create: { tenantId: tenant.id, ...usageLimits },
  });

  const modules = await prisma.moduleRegistry.findMany({ where: { isActive: true } });
  for (const mod of modules) {
    const enabled = ENABLED_MODULES.has(mod.moduleCode);
    await prisma.tenantModule.upsert({
      where: { tenantId_moduleId: { tenantId: tenant.id, moduleId: mod.id } },
      update: {
        isEnabled: enabled,
        moduleStatus: enabled ? ModuleStatus.ACTIVE : ModuleStatus.DISABLED,
      },
      create: {
        tenantId: tenant.id,
        moduleId: mod.id,
        isEnabled: enabled,
        enabledFrom: new Date("2026-01-01T00:00:00.000Z"),
        moduleStatus: enabled ? ModuleStatus.ACTIVE : ModuleStatus.DISABLED,
      },
    });
  }

  return tenant;
}

async function seedBranch(prisma: PrismaClient, tenantId: string) {
  const branchProfile = {
    name: DOCTORS_POINT_BRANCH.name,
    branchType: DOCTORS_POINT_BRANCH.branchType,
    address: DOCTORS_POINT_BRANCH.addressLine1,
    addressLine1: DOCTORS_POINT_BRANCH.addressLine1,
    city: DOCTORS_POINT_BRANCH.city,
    district: DOCTORS_POINT_BRANCH.district,
    phone: DOCTORS_POINT_BRANCH.phone,
    email: DOCTORS_POINT_BRANCH.email,
    timezone: DOCTORS_POINT.timezone,
    countryCode: DOCTORS_POINT.countryCode,
    isDefault: true,
    isActive: true,
    status: "ACTIVE" as const,
  };

  return prisma.branch.upsert({
    where: { tenantId_code: { tenantId, code: DOCTORS_POINT_BRANCH.code } },
    update: branchProfile,
    create: { tenantId, code: DOCTORS_POINT_BRANCH.code, ...branchProfile },
  });
}

async function seedDepartments(prisma: PrismaClient, tenantId: string) {
  const byCode = new Map<string, string>();

  for (const dept of DOCTORS_POINT_DEPARTMENTS) {
    const row = await prisma.department.upsert({
      where: { tenantId_deptCode: { tenantId, deptCode: dept.deptCode } },
      update: { name: dept.name, deptType: dept.deptType, isActive: true, updatedBy: ACTOR },
      create: {
        tenantId,
        deptCode: dept.deptCode,
        name: dept.name,
        deptType: dept.deptType,
        createdBy: ACTOR,
        updatedBy: ACTOR,
      },
    });
    byCode.set(dept.deptCode, row.id);
  }

  return byCode;
}

function buildPermissions(tenantId: string, roleId: string, seed: UatRoleSeed) {
  const actions = seed.actions ?? ALL_ACTIONS;
  const resources = seed.fullAccess
    ? TENANT_PERMISSION_RESOURCES
    : TENANT_PERMISSION_RESOURCES.filter((r) => seed.resourceKeys?.includes(r.resourceKey));

  return resources.map((resource) => {
    const denied = seed.denyActions?.[resource.resourceKey] ?? [];
    const granted = (action: PermissionAction) =>
      actions.includes(action) && !denied.includes(action);

    return {
      tenantId,
      roleId,
      permissionCode: resource.permissionCode,
      moduleCode: resource.moduleCode,
      resourceKey: resource.resourceKey,
      canView: granted("canView"),
      canCreate: granted("canCreate"),
      canEdit: granted("canEdit"),
      canDelete: granted("canDelete"),
      canApprove: granted("canApprove"),
      canPrint: granted("canPrint"),
      createdBy: ACTOR,
      updatedBy: ACTOR,
    };
  });
}

async function seedRoles(prisma: PrismaClient, tenantId: string) {
  const roleIds = new Map<string, string>();

  for (const seed of DOCTORS_POINT_ROLES) {
    const role = await prisma.role.upsert({
      where: { tenantId_roleCode: { tenantId, roleCode: seed.roleCode } },
      update: { roleName: seed.roleName, description: seed.description, isActive: true },
      create: {
        tenantId,
        roleCode: seed.roleCode,
        roleName: seed.roleName,
        description: seed.description,
        createdBy: ACTOR,
        updatedBy: ACTOR,
      },
    });
    roleIds.set(seed.roleCode, role.id);

    for (const permission of buildPermissions(tenantId, role.id, seed)) {
      await prisma.permission.upsert({
        where: { roleId_resourceKey: { roleId: role.id, resourceKey: permission.resourceKey } },
        update: { ...permission, isActive: true },
        create: permission,
      });
    }
  }

  return roleIds;
}

async function seedUsers(
  prisma: PrismaClient,
  tenantId: string,
  branchId: string,
  roleIds: Map<string, string>,
) {
  const passwordHash = hashPassword(UAT_PASSWORD);
  const userIds = new Map<string, string>();

  for (const seed of DOCTORS_POINT_USERS) {
    const roleId = roleIds.get(seed.roleCode);
    if (!roleId) continue;

    const profile = {
      email: `${seed.username}@doctorspoint.test`,
      phone: seed.phone,
      passwordHash,
      tenantId,
      isHostAdmin: false,
      userStatus: UserStatus.ACTIVE,
      isActive: true,
    };

    const user = await prisma.user.upsert({
      where: { username: seed.username },
      update: profile,
      create: { username: seed.username, ...profile, createdBy: ACTOR, updatedBy: ACTOR },
    });
    userIds.set(seed.username, user.id);

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      update: { tenantId, isPrimary: true, isActive: true },
      create: { tenantId, userId: user.id, roleId, isPrimary: true, createdBy: ACTOR, updatedBy: ACTOR },
    });

    await prisma.userBranch.upsert({
      where: { userId_branchId: { userId: user.id, branchId } },
      update: { tenantId, isPrimary: true, isActive: true },
      create: { tenantId, userId: user.id, branchId, isPrimary: true, createdBy: ACTOR, updatedBy: ACTOR },
    });
  }

  return userIds;
}

async function seedDoctorsAndSchedules(
  prisma: PrismaClient,
  tenantId: string,
  branchId: string,
  departmentIds: Map<string, string>,
  userIds: Map<string, string>,
) {
  let publishedShifts = 0;

  for (const seed of DOCTORS_POINT_DOCTORS) {
    const departmentId = departmentIds.get(seed.deptCode) ?? null;
    const userId = seed.linkedUsername ? (userIds.get(seed.linkedUsername) ?? null) : null;

    const profile = {
      doctorName: seed.doctorName,
      degree: seed.degree,
      specialty: seed.specialty,
      departmentId,
      bmdcNo: seed.bmdcNo,
      phone: seed.phone,
      consultationFee: seed.consultationFee,
      userId,
      isConsultant: seed.isConsultant ?? false,
      isReporting: seed.isReporting ?? false,
      isVerifying: seed.isVerifying ?? false,
      isPathologist: seed.isPathologist ?? false,
      isActive: true,
      updatedBy: ACTOR,
    };

    const doctor = await prisma.doctor.upsert({
      where: { tenantId_doctorCode: { tenantId, doctorCode: seed.doctorCode } },
      update: profile,
      create: { tenantId, doctorCode: seed.doctorCode, ...profile, createdBy: ACTOR },
    });

    await prisma.doctorBranch.upsert({
      where: { tenantId_doctorId_branchId: { tenantId, doctorId: doctor.id, branchId } },
      update: { isPrimary: true, isActive: true, updatedBy: ACTOR },
      create: { tenantId, doctorId: doctor.id, branchId, isPrimary: true, createdBy: ACTOR, updatedBy: ACTOR },
    });

    if (departmentId) {
      await prisma.doctorDepartmentMapping.upsert({
        where: {
          tenantId_doctorId_departmentId: { tenantId, doctorId: doctor.id, departmentId },
        },
        update: {
          canReport: seed.isReporting ?? false,
          canVerify: seed.isVerifying ?? false,
          isActive: true,
          updatedBy: ACTOR,
        },
        create: {
          tenantId,
          doctorId: doctor.id,
          departmentId,
          canReport: seed.isReporting ?? false,
          canVerify: seed.isVerifying ?? false,
          createdBy: ACTOR,
          updatedBy: ACTOR,
        },
      });
    }

    for (const shift of seed.schedule ?? []) {
      const shiftData = {
        endTime: shift.endTime,
        slotDuration: shift.slotDuration,
        chamber: shift.chamber,
        isPublished: true,
        publishedAt: new Date(),
        publishedBy: ACTOR,
        isActive: true,
        updatedBy: ACTOR,
      };

      await prisma.doctorSchedule.upsert({
        where: {
          tenantId_branchId_doctorId_dayOfWeek_startTime: {
            tenantId,
            branchId,
            doctorId: doctor.id,
            dayOfWeek: shift.dayOfWeek,
            startTime: shift.startTime,
          },
        },
        update: shiftData,
        create: {
          tenantId,
          branchId,
          doctorId: doctor.id,
          dayOfWeek: shift.dayOfWeek,
          startTime: shift.startTime,
          ...shiftData,
          createdBy: ACTOR,
        },
      });
      publishedShifts += 1;
    }
  }

  return publishedShifts;
}

/**
 * Imports the approved host services and then applies the Doctors Point published rate at
 * both tenant and branch level. Historical charges are unaffected because invoices snapshot
 * the rate at billing time.
 *
 * Host import leaves services under the generic host "Laboratory" department. After import
 * we remap each priced service to the DPDC operating section from the price list (Haem,
 * Biochem, Hormone, Electrolyte, Clinical Pathology) so order/sample routing uses sections.
 */
async function seedPricedCatalog(
  prisma: PrismaClient,
  tenantId: string,
  branchId: string,
  departmentIds: Map<string, string>,
) {
  const serviceCodes = DOCTORS_POINT_PRICE_LIST.map((entry) => entry.hostServiceCode);
  await importHostServicesByCode(prisma, {
    tenantId,
    serviceCodes,
    branchIds: [branchId],
    createdBy: ACTOR,
  });

  const tenantServiceIdByHostCode = new Map<string, string>();

  for (const entry of DOCTORS_POINT_PRICE_LIST) {
    const tenantService = await prisma.tenantService.findFirst({
      where: { tenantId, hostService: { serviceCode: entry.hostServiceCode } },
      select: { id: true },
    });
    if (!tenantService) continue;

    const sectionDepartmentId = departmentIds.get(entry.deptCode) ?? null;

    await prisma.tenantService.update({
      where: { id: tenantService.id },
      data: {
        localName: entry.displayName,
        price: entry.price,
        discountAllowed: true,
        isActive: true,
        ...(sectionDepartmentId ? { departmentId: sectionDepartmentId } : {}),
        updatedBy: ACTOR,
      },
    });

    await prisma.tenantServiceBranch.upsert({
      where: {
        tenantId_branchId_tenantServiceId: { tenantId, branchId, tenantServiceId: tenantService.id },
      },
      update: {
        isAvailable: true,
        isActive: true,
        branchPrice: entry.price,
        branchDiscountAllowed: true,
        updatedBy: ACTOR,
      },
      create: {
        tenantId,
        branchId,
        tenantServiceId: tenantService.id,
        isAvailable: true,
        branchPrice: entry.price,
        branchDiscountAllowed: true,
        createdBy: ACTOR,
        updatedBy: ACTOR,
      },
    });

    tenantServiceIdByHostCode.set(entry.hostServiceCode, tenantService.id);
  }

  return tenantServiceIdByHostCode;
}

async function seedAnalyzers(
  prisma: PrismaClient,
  tenantId: string,
  branchId: string,
  departmentIds: Map<string, string>,
  tenantServiceIdByHostCode: Map<string, string>,
) {
  let mappingCount = 0;

  for (const seed of DOCTORS_POINT_ANALYZERS) {
    const departmentId = departmentIds.get(seed.deptCode);
    if (!departmentId) continue;

    const analyzerProfile = {
      departmentId,
      machineName: seed.machineName,
      model: seed.model,
      manufacturer: seed.manufacturer,
      interfaceType: seed.interfaceType,
      protocol: seed.protocol,
      isActive: true,
      updatedBy: ACTOR,
    };

    const analyzer = await prisma.analyzer.upsert({
      where: {
        tenantId_branchId_analyzerCode: { tenantId, branchId, analyzerCode: seed.analyzerCode },
      },
      update: analyzerProfile,
      create: {
        tenantId,
        branchId,
        analyzerCode: seed.analyzerCode,
        ...analyzerProfile,
        createdBy: ACTOR,
      },
    });

    for (const mapping of seed.mappings) {
      const tenantServiceId = tenantServiceIdByHostCode.get(mapping.hostServiceCode);
      if (!tenantServiceId) continue;

      const parameterCode = mapping.parameterCode ?? null;
      // The unique key includes a nullable column, so match explicitly rather than upsert.
      const existing = await prisma.analyzerMapping.findFirst({
        where: {
          tenantId,
          analyzerId: analyzer.id,
          machineTestCode: mapping.machineTestCode,
          parameterCode,
        },
        select: { id: true },
      });

      if (existing) {
        await prisma.analyzerMapping.update({
          where: { id: existing.id },
          data: { tenantServiceId, isActive: true },
        });
      } else {
        await prisma.analyzerMapping.create({
          data: {
            tenantId,
            analyzerId: analyzer.id,
            machineTestCode: mapping.machineTestCode,
            parameterCode,
            tenantServiceId,
          },
        });
      }
      mappingCount += 1;
    }
  }

  return mappingCount;
}

/** Deterministic DOB so age/sex range resolution is stable across UAT runs (365 d/y). */
function dateOfBirthFromEstimatedAge(estimatedAge: number, asOf: Date): Date {
  const dob = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()));
  dob.setUTCFullYear(dob.getUTCFullYear() - estimatedAge);
  return dob;
}

async function upsertPatient(
  prisma: PrismaClient,
  tenantId: string,
  branchId: string,
  seed: UatPatientSeed,
) {
  const ageAsOfDate = new Date();
  ageAsOfDate.setHours(0, 0, 0, 0);
  const dateOfBirth = dateOfBirthFromEstimatedAge(seed.estimatedAge, ageAsOfDate);

  const profile = {
    firstName: seed.firstName,
    middleName: seed.middleName ?? null,
    lastName: seed.lastName ?? null,
    fullName: buildFullName(seed.firstName, seed.middleName ?? null, seed.lastName ?? null),
    gender: seed.gender,
    dateOfBirth,
    estimatedAge: seed.estimatedAge,
    ageAsOfDate,
    mobile: seed.mobile ?? null,
    mobileNormalized: seed.mobile ? normalizeMobile(seed.mobile) : null,
    addressLine1: seed.addressLine1,
    city: seed.city,
    district: seed.district,
    countryCode: DOCTORS_POINT.countryCode,
    guardianName: seed.guardianName ?? null,
    guardianRelation: seed.guardianRelation ?? null,
    guardianMobile: seed.guardianMobile ?? null,
    guardianMobileNormalized: seed.guardianMobile ? normalizeMobile(seed.guardianMobile) : null,
    notes: seed.caseNote,
    registrationBranchId: branchId,
    isActive: true,
    updatedBy: ACTOR,
  };

  return prisma.patient.upsert({
    where: { tenantId_patientNumber: { tenantId, patientNumber: seed.patientNumber } },
    update: profile,
    create: { tenantId, patientNumber: seed.patientNumber, ...profile, createdBy: ACTOR },
  });
}

async function seedPatients(prisma: PrismaClient, tenantId: string, branchId: string) {
  for (const seed of DOCTORS_POINT_PATIENTS) {
    await upsertPatient(prisma, tenantId, branchId, seed);
  }
  // Guardian holds the Case 3 portal account; rights to the minor require an explicit delegation.
  await upsertPatient(prisma, tenantId, branchId, DOCTORS_POINT_GUARDIAN_PATIENT);

  // Keep the tenant counter ahead of the seeded numbers so UI registration does not collide.
  const latest = await prisma.patient.findFirst({
    where: { tenantId },
    orderBy: { patientNumber: "desc" },
    select: { patientNumber: true },
  });
  const lastNumber = Number.parseInt((latest?.patientNumber ?? "").replace(/\D/g, ""), 10);
  const counter = Number.isNaN(lastNumber) ? 0 : lastNumber;

  await prisma.tenantPatientCounter.upsert({
    where: { tenantId },
    update: { lastNumber: counter },
    create: { tenantId, lastNumber: counter },
  });

  return DOCTORS_POINT_PATIENTS.length + 1;
}

async function seedPortalAccounts(prisma: PrismaClient, tenantId: string) {
  const passwordHash = hashPassword(UAT_PORTAL_PASSWORD);
  let accounts = 0;

  for (const seed of DOCTORS_POINT_PORTAL_ACCOUNTS) {
    const patient = await prisma.patient.findUnique({
      where: { tenantId_patientNumber: { tenantId, patientNumber: seed.patientNumber } },
      select: {
        id: true,
        email: true,
        mobileNormalized: true,
        mobile: true,
      },
    });
    if (!patient) continue;

    const username = (
      seed.username?.trim().toLowerCase() ||
      patient.email?.trim().toLowerCase() ||
      patient.mobileNormalized ||
      (patient.mobile ? normalizeMobile(patient.mobile) : "") ||
      ""
    ).trim();
    if (!username) continue;

    const existing = await prisma.patientPortalAccount.findFirst({
      where: { tenantId, patientId: patient.id },
      select: { id: true },
    });

    if (existing) {
      await prisma.patientPortalAccount.update({
        where: { id: existing.id },
        data: {
          username,
          passwordHash,
          isVerified: true,
          isSuspended: false,
          isActive: true,
          suspendReason: null,
          suspendedAt: null,
          failedAttemptCount: 0,
          updatedById: null,
        },
      });
    } else {
      await prisma.patientPortalAccount.create({
        data: {
          tenantId,
          patientId: patient.id,
          username,
          passwordHash,
          isVerified: true,
          isActive: true,
        },
      });
    }
    accounts += 1;
  }

  let delegations = 0;
  for (const seed of DOCTORS_POINT_PORTAL_DELEGATIONS) {
    const [grantor, granteePatient] = await Promise.all([
      prisma.patient.findUnique({
        where: {
          tenantId_patientNumber: { tenantId, patientNumber: seed.grantorPatientNumber },
        },
        select: { id: true },
      }),
      prisma.patient.findUnique({
        where: {
          tenantId_patientNumber: { tenantId, patientNumber: seed.granteePatientNumber },
        },
        select: { id: true },
      }),
    ]);
    if (!grantor || !granteePatient) continue;

    const granteeAccount = await prisma.patientPortalAccount.findFirst({
      where: { tenantId, patientId: granteePatient.id },
      select: { id: true },
    });
    if (!granteeAccount) continue;

    const existing = await prisma.patientPortalDelegation.findFirst({
      where: {
        tenantId,
        grantorPatientId: grantor.id,
        granteeAccountId: granteeAccount.id,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.patientPortalDelegation.update({
        where: { id: existing.id },
        data: {
          relationship: seed.relationship,
          accessLevel: seed.accessLevel,
          consentReference: seed.consentReference,
          isActive: true,
          revokedAt: null,
          revokedById: null,
        },
      });
    } else {
      await prisma.patientPortalDelegation.create({
        data: {
          tenantId,
          grantorPatientId: grantor.id,
          granteeAccountId: granteeAccount.id,
          relationship: seed.relationship,
          accessLevel: seed.accessLevel,
          consentReference: seed.consentReference,
        },
      });
    }
    delegations += 1;
  }

  return { accounts, delegations };
}

export async function seedDoctorsPointUat(prisma: PrismaClient): Promise<DoctorsPointSeedSummary> {
  const tenant = await seedTenantAndSubscription(prisma);
  const branch = await seedBranch(prisma, tenant.id);
  const departmentIds = await seedDepartments(prisma, tenant.id);
  const roleIds = await seedRoles(prisma, tenant.id);
  const userIds = await seedUsers(prisma, tenant.id, branch.id, roleIds);
  const publishedShifts = await seedDoctorsAndSchedules(
    prisma,
    tenant.id,
    branch.id,
    departmentIds,
    userIds,
  );
  const tenantServiceIdByHostCode = await seedPricedCatalog(
    prisma,
    tenant.id,
    branch.id,
    departmentIds,
  );
  const analyzerMappings = await seedAnalyzers(
    prisma,
    tenant.id,
    branch.id,
    departmentIds,
    tenantServiceIdByHostCode,
  );
  const referenceRanges = await seedDoctorsPointReferenceRanges(prisma, tenant.id);
  const patients = await seedPatients(prisma, tenant.id, branch.id);
  const portal = await seedPortalAccounts(prisma, tenant.id);

  return {
    tenantId: tenant.id,
    branchId: branch.id,
    departments: departmentIds.size,
    roles: roleIds.size,
    users: userIds.size,
    doctors: DOCTORS_POINT_DOCTORS.length,
    publishedShifts,
    services: tenantServiceIdByHostCode.size,
    analyzerMappings,
    referenceRanges: referenceRanges.createdOrUpdated,
    referenceRangeGaps: referenceRanges.gaps,
    patients,
    portalAccounts: portal.accounts,
    portalDelegations: portal.delegations,
    catalogGaps: DOCTORS_POINT_CATALOG_GAPS,
  };
}
