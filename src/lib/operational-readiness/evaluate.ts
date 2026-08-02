import {
  REQUIRED_OPERATING_DEPARTMENTS,
  REQUIRED_OPERATIONAL_ROLES,
} from "@/lib/operational-readiness/constants";
import type {
  OperationalReadinessReport,
  ReadinessCheckItem,
  ReadinessTone,
} from "@/lib/operational-readiness/types";

export type ReadinessSnapshotInput = {
  tenant: {
    tenantName: string;
    contactMobile: string;
    contactEmail: string;
    address: string | null;
    website: string | null;
    logoUrl: string | null;
    reportHeaderLogoUrl: string | null;
    reportFooterText: string | null;
    invoiceFooterText: string | null;
    headerBrandingText: string | null;
    footerBrandingText: string | null;
    readyForFirstPatientAt: Date | null;
    readyForFirstPatientById: string | null;
  };
  branchCount: number;
  departments: Array<{ deptCode: string; name: string; isActive: boolean }>;
  users: Array<{
    isActive: boolean;
    userStatus: string;
    roleNames: string[];
    roleCodes: string[];
  }>;
  doctors: Array<{
    isActive: boolean;
    isVerifying: boolean;
    isPathologist: boolean;
    hasPublishedSchedule: boolean;
  }>;
  services: Array<{
    isActive: boolean;
    price: number;
    hasDepartment: boolean;
    hasSampleType: boolean;
    hasContainer: boolean;
    hasAnalyzerMapping: boolean;
    hasReferenceRange: boolean;
  }>;
  referenceRanges: Array<{
    gender: string | null;
    ageFromDays: number | null;
    ageToDays: number | null;
    unit: string | null;
    hasNormal: boolean;
    hasCritical: boolean;
  }>;
  analyzers: Array<{
    isActive: boolean;
    mappingCount: number;
    lisConnectionStatus: string;
    lisEndpoint: string | null;
    lisLastCommunicationAt: Date | null;
  }>;
  portalSettings: {
    portalEnabled: boolean;
    selfRegistration: boolean;
    downloadPdfEnabled: boolean;
    qrVerificationEnabled: boolean;
    notificationEnabled: boolean;
    passwordMinLength: number;
  } | null;
  notificationTemplateCount: number;
  readyDeclaredByName: string | null;
};

function toneScore(tone: ReadinessTone): number {
  if (tone === "green") return 1;
  if (tone === "yellow") return 0.5;
  return 0;
}

function companyProfileCheck(input: ReadinessSnapshotInput): ReadinessCheckItem {
  const missing: string[] = [];
  if (!input.tenant.tenantName.trim()) missing.push("Company name");
  if (!input.tenant.address?.trim()) missing.push("Address");
  if (!input.tenant.contactMobile.trim()) missing.push("Phone");
  if (!input.tenant.contactEmail.trim()) missing.push("Email");
  if (!input.tenant.reportFooterText?.trim() && !input.tenant.footerBrandingText?.trim()) {
    missing.push("Report/footer branding");
  }
  if (!input.tenant.invoiceFooterText?.trim()) missing.push("Invoice footer");
  if (
    !input.tenant.logoUrl?.trim() &&
    !input.tenant.reportHeaderLogoUrl?.trim() &&
    !input.tenant.headerBrandingText?.trim()
  ) {
    missing.push("Header branding / logo");
  }

  const tone: ReadinessTone =
    missing.length === 0 ? "green" : missing.length <= 2 ? "yellow" : "red";

  return {
    id: "companyProfile",
    label: "Company Profile",
    tone: missing.length === 0 ? "green" : tone,
    detail:
      missing.length === 0
        ? "Company profile and branding are complete"
        : `Missing: ${missing.join(", ")}`,
    href: "/settings/readiness/company",
    blocking: true,
    missing,
  };
}

function departmentsCheck(input: ReadinessSnapshotInput): ReadinessCheckItem {
  const active = input.departments.filter((d) => d.isActive);
  const missing = REQUIRED_OPERATING_DEPARTMENTS.filter(
    (req) =>
      !active.some(
        (d) => req.match.test(d.name) || req.match.test(d.deptCode),
      ),
  ).map((d) => d.label);

  return {
    id: "departments",
    label: "Departments",
    tone: missing.length === 0 ? "green" : "red",
    detail:
      missing.length === 0
        ? `${active.length} active departments cover all required areas`
        : `Missing departments: ${missing.join(", ")}`,
    href: "/settings/readiness/departments",
    blocking: true,
    missing,
  };
}

function usersCheck(input: ReadinessSnapshotInput): ReadinessCheckItem {
  const active = input.users.filter(
    (u) => u.isActive && u.userStatus === "ACTIVE",
  );
  const missing = REQUIRED_OPERATIONAL_ROLES.filter((req) => {
    return !active.some((u) =>
      [...u.roleNames, ...u.roleCodes].some((value) => req.match.test(value)),
    );
  }).map((r) => r.label);

  return {
    id: "users",
    label: "Operational Users",
    tone: missing.length === 0 ? "green" : "red",
    detail:
      missing.length === 0
        ? `${active.length} active users cover required roles`
        : `Missing roles: ${missing.join(", ")}`,
    href: "/settings/readiness/users",
    blocking: true,
    missing,
  };
}

function doctorsCheck(input: ReadinessSnapshotInput): ReadinessCheckItem {
  const active = input.doctors.filter((d) => d.isActive);
  const verifying = active.filter((d) => d.isVerifying || d.isPathologist);
  const published = active.filter((d) => d.hasPublishedSchedule);

  const missing: string[] = [];
  if (active.length === 0) missing.push("Doctor");
  if (verifying.length === 0) missing.push("Verification doctor");
  if (published.length === 0) missing.push("Published schedule");

  return {
    id: "doctors",
    label: "Doctors & Schedules",
    tone: missing.length === 0 ? "green" : "red",
    detail:
      missing.length === 0
        ? `${active.length} doctors, ${verifying.length} verifying, ${published.length} with published schedules`
        : `Missing: ${missing.join(", ")}`,
    href: "/settings/readiness/doctors",
    blocking: true,
    missing,
  };
}

function catalogCheck(input: ReadinessSnapshotInput): ReadinessCheckItem {
  const active = input.services.filter((s) => s.isActive);
  if (active.length === 0) {
    return {
      id: "catalog",
      label: "Catalog & Prices",
      tone: "red",
      detail: "No active priced services",
      href: "/settings/readiness/catalog",
      blocking: true,
      missing: ["Active services"],
    };
  }

  const missingCore = active.filter((s) => !s.hasDepartment || !(s.price > 0));
  const missingSample = active.filter((s) => !s.hasSampleType || !s.hasContainer);
  const mapped = active.filter((s) => s.hasAnalyzerMapping);
  const ranged = active.filter((s) => s.hasReferenceRange);
  const sampleReadyRatio = (active.length - missingSample.length) / active.length;

  const missing: string[] = [];
  if (missingCore.length > 0) {
    missing.push(`${missingCore.length} services missing department or price`);
  }
  if (sampleReadyRatio < 0.8) {
    missing.push(`${missingSample.length} services missing sample type/tube`);
  }
  if (mapped.length === 0) missing.push("Analyzer mapping");
  if (ranged.length === 0) missing.push("Reference range coverage");

  const tone: ReadinessTone =
    missing.length === 0
      ? "green"
      : missingCore.length === 0 && mapped.length > 0
        ? "yellow"
        : "red";

  return {
    id: "catalog",
    label: "Catalog & Prices",
    tone,
    detail:
      missing.length === 0
        ? `${active.length} services ready (dept, price, sample/tube ≥80%, mapping, ranges)`
        : missing.join("; "),
    href: "/settings/readiness/catalog",
    blocking: true,
    missing,
  };
}

function referenceRangeCheck(input: ReadinessSnapshotInput): ReadinessCheckItem {
  const ranges = input.referenceRanges;
  if (ranges.length === 0) {
    return {
      id: "referenceRanges",
      label: "Reference Ranges",
      tone: "red",
      detail: "No reference ranges configured",
      href: "/settings/readiness/reference-ranges",
      blocking: true,
      missing: ["Reference ranges"],
    };
  }

  const hasMale = ranges.some((r) => /male|^m$/i.test(r.gender ?? ""));
  const hasFemale = ranges.some((r) => /female|^f$/i.test(r.gender ?? ""));
  const hasPaediatric = ranges.some(
    (r) =>
      (r.ageToDays != null && r.ageToDays < 18 * 365) ||
      /paed|ped|child|infant/i.test(r.gender ?? ""),
  );
  const withUnit = ranges.filter((r) => r.unit?.trim());
  const withNormal = ranges.filter((r) => r.hasNormal);
  const withCritical = ranges.filter((r) => r.hasCritical);

  const missing: string[] = [];
  if (!hasMale) missing.push("Male");
  if (!hasFemale) missing.push("Female");
  if (!hasPaediatric) missing.push("Paediatric");
  if (withUnit.length === 0) missing.push("Unit");
  if (withNormal.length === 0) missing.push("Normal range");
  if (withCritical.length === 0) missing.push("Critical range");

  return {
    id: "referenceRanges",
    label: "Reference Ranges",
    tone: missing.length === 0 ? "green" : missing.length <= 2 ? "yellow" : "red",
    detail:
      missing.length === 0
        ? `${ranges.length} ranges cover male/female/paediatric with unit/normal/critical`
        : `Missing coverage: ${missing.join(", ")}`,
    href: "/settings/readiness/reference-ranges",
    blocking: true,
    missing,
  };
}

function analyzerCheck(input: ReadinessSnapshotInput): ReadinessCheckItem {
  const active = input.analyzers.filter((a) => a.isActive);
  const mapped = active.filter((a) => a.mappingCount > 0);
  if (active.length === 0) {
    return {
      id: "analyzers",
      label: "Analyzers",
      tone: "red",
      detail: "No active analyzers",
      href: "/settings/readiness/analyzers",
      blocking: true,
      missing: ["Analyzer"],
    };
  }
  if (mapped.length === 0) {
    return {
      id: "analyzers",
      label: "Analyzers",
      tone: "yellow",
      detail: `${active.length} analyzers but none have LIS mappings`,
      href: "/settings/readiness/analyzers",
      blocking: true,
      missing: ["LIS mapping"],
    };
  }
  return {
    id: "analyzers",
    label: "Analyzers",
    tone: "green",
    detail: `${active.length} analyzers, ${mapped.length} with mappings`,
    href: "/settings/readiness/analyzers",
    blocking: true,
  };
}

function lisCheck(input: ReadinessSnapshotInput): ReadinessCheckItem {
  const connected = input.analyzers.filter(
    (a) =>
      a.isActive &&
      (a.lisConnectionStatus === "CONNECTED" ||
        a.lisConnectionStatus === "SIMULATED_CONNECTED"),
  );
  const configured = input.analyzers.filter(
    (a) => a.isActive && Boolean(a.lisEndpoint?.trim()),
  );

  if (connected.length === 0) {
    return {
      id: "lis",
      label: "LIS Connection",
      tone: configured.length > 0 ? "yellow" : "red",
      detail:
        configured.length > 0
          ? "Endpoint configured but connection test not completed"
          : "No analyzer LIS connection configured or tested",
      href: "/settings/readiness/lis",
      blocking: true,
      missing: ["LIS connection test"],
    };
  }

  return {
    id: "lis",
    label: "LIS Connection",
    tone: "green",
    detail: `${connected.length} analyzer(s) connected (simulation allowed)`,
    href: "/settings/readiness/lis",
    blocking: true,
  };
}

function portalCheck(input: ReadinessSnapshotInput): ReadinessCheckItem {
  if (!input.portalSettings) {
    return {
      id: "portal",
      label: "Patient Portal",
      tone: "red",
      detail: "Portal settings not configured",
      href: "/settings/readiness/portal",
      blocking: false,
      missing: ["Portal settings"],
    };
  }
  if (!input.portalSettings.portalEnabled) {
    return {
      id: "portal",
      label: "Patient Portal",
      tone: "yellow",
      detail: "Portal disabled",
      href: "/settings/readiness/portal",
      blocking: false,
      missing: ["Portal enabled"],
    };
  }
  return {
    id: "portal",
    label: "Patient Portal",
    tone: "green",
    detail: `Portal enabled · PDF ${input.portalSettings.downloadPdfEnabled ? "on" : "off"} · QR ${input.portalSettings.qrVerificationEnabled ? "on" : "off"} · notify ${input.portalSettings.notificationEnabled ? "on" : "off"}`,
    href: "/settings/readiness/portal",
    blocking: false,
  };
}

function notificationsCheck(input: ReadinessSnapshotInput): ReadinessCheckItem {
  const portalNotify = input.portalSettings?.notificationEnabled ?? false;
  if (portalNotify || input.notificationTemplateCount > 0) {
    return {
      id: "notifications",
      label: "Notifications",
      tone: "green",
      detail: portalNotify
        ? "Portal notification policy enabled"
        : `${input.notificationTemplateCount} notification template(s)`,
      href: "/settings/readiness/portal",
      blocking: false,
    };
  }
  return {
    id: "notifications",
    label: "Notifications",
    tone: "yellow",
    detail: "No notification templates or portal notification policy",
    href: "/settings/readiness/portal",
    blocking: false,
    missing: ["Notification policy"],
  };
}

export function evaluateOperationalReadiness(
  input: ReadinessSnapshotInput,
): OperationalReadinessReport {
  const branchItem: ReadinessCheckItem = {
    id: "branch",
    label: "Branch",
    tone: input.branchCount > 0 ? "green" : "red",
    detail:
      input.branchCount > 0
        ? `${input.branchCount} branch(es) configured`
        : "At least one branch is required",
    href: "/settings/branches",
    blocking: true,
    missing: input.branchCount > 0 ? [] : ["Branch"],
  };

  const items: ReadinessCheckItem[] = [
    companyProfileCheck(input),
    branchItem,
    departmentsCheck(input),
    usersCheck(input),
    doctorsCheck(input),
    catalogCheck(input),
    referenceRangeCheck(input),
    analyzerCheck(input),
    lisCheck(input),
    portalCheck(input),
    notificationsCheck(input),
  ];

  const scorePercent = Math.round(
    (items.reduce((sum, item) => sum + toneScore(item.tone), 0) / items.length) *
      100,
  );

  const blockers = items
    .filter((item) => item.blocking && item.tone !== "green")
    .map((item) => item.label);

  const canDeclareReady = blockers.length === 0;
  const declaredReady = Boolean(input.tenant.readyForFirstPatientAt);

  return {
    scorePercent,
    readyStatus: canDeclareReady
      ? "READY_FOR_FIRST_PATIENT"
      : "NOT_READY",
    canDeclareReady,
    declaredReady,
    declaredReadyAt: input.tenant.readyForFirstPatientAt?.toISOString() ?? null,
    declaredReadyBy: input.readyDeclaredByName,
    items,
    blockers,
  };
}
