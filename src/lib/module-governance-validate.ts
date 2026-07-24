import fs from "node:fs";
import path from "node:path";
import { MOD06_PRIMARY_LOCALES } from "@/lib/i18n/constants";
import { getModuleRegistryEntry } from "@/lib/module-governance";
import { MODULE_REGISTRY } from "@/lib/saas-foundation-data";

const KNOWN_DEPENDENCY_IDS = new Set([
  ...MODULE_REGISTRY.map((entry) => entry.moduleCode),
  "MOD-01A",
  "MOD-03",
]);

export function validateMod06RegistryCompliance(): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const mod06 = getModuleRegistryEntry("MOD-06");

  if (!mod06) {
    errors.push("MOD-06 entry missing from MODULE_REGISTRY");
    return { ok: false, errors };
  }

  const duplicateCodes = MODULE_REGISTRY.filter((entry) => entry.moduleCode === "MOD-06");
  if (duplicateCodes.length !== 1) {
    errors.push("MOD-06 module ID must be unique in MODULE_REGISTRY");
  }

  if (mod06.moduleName !== "Localization Engine") {
    errors.push("MOD-06 moduleName must be Localization Engine");
  }

  if (mod06.displayName !== "Localization") {
    errors.push("MOD-06 displayName must be Localization");
  }

  if (mod06.moduleGroup !== "Foundation") {
    errors.push("MOD-06 must be categorized as Foundation");
  }

  if (mod06.implementationStatus !== "Implemented") {
    errors.push("MOD-06 implementationStatus must be Implemented");
  }

  if (!mod06.dependencies?.includes("MOD-01")) {
    errors.push("MOD-06 must depend on MOD-01");
  }

  if (!mod06.dependencies?.includes("MOD-01A")) {
    errors.push("MOD-06 must depend on MOD-01A");
  }

  for (const dependency of mod06.dependencies ?? []) {
    if (!KNOWN_DEPENDENCY_IDS.has(dependency)) {
      errors.push(`MOD-06 dependency ${dependency} is not recognized`);
    }
  }

  if (!mod06.verifyCommand?.includes("verify:mod06")) {
    errors.push("MOD-06 verifyCommand must reference verify:mod06");
  }

  for (const filePath of [
    mod06.docPath,
    mod06.aiQcReportPath,
    mod06.manualQcGuidePath,
    mod06.manualQcResultTemplatePath,
  ]) {
    if (!filePath || !fs.existsSync(path.join(process.cwd(), filePath))) {
      errors.push(`MOD-06 documentation path missing: ${filePath ?? "(unset)"}`);
    }
  }

  if (mod06.automatedQcStatus !== "PASS") {
    errors.push("MOD-06 automatedQcStatus must be PASS");
  }

  if (mod06.manualQcStatus !== "NOT TESTED") {
    errors.push("MOD-06 manualQcStatus must remain NOT TESTED");
  }

  if (mod06.browserUatStatus !== "NOT TESTED") {
    errors.push("MOD-06 browserUatStatus must remain NOT TESTED");
  }

  if (mod06.productionApprovalStatus !== "Pending Manual QC") {
    errors.push("MOD-06 must not claim production approval");
  }

  if (mod06.implementationCommit !== "a8ee1fc") {
    errors.push("MOD-06 implementationCommit must reference a8ee1fc");
  }

  const supported = mod06.supportedLocales ?? [];
  if (supported.length !== MOD06_PRIMARY_LOCALES.length) {
    errors.push("MOD-06 supportedLocales must list all MOD-06 primary locales");
  }

  for (const locale of MOD06_PRIMARY_LOCALES) {
    if (!supported.includes(locale)) {
      errors.push(`MOD-06 supportedLocales missing ${locale}`);
    }
  }

  const requiredCapabilities = [
    "Tenant-aware locale resolution",
    "Language switcher",
    "RTL rendering",
    "English fallback",
  ];

  for (const capability of requiredCapabilities) {
    if (!mod06.capabilities?.includes(capability)) {
      errors.push(`MOD-06 capabilities missing: ${capability}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateMod07RegistryCompliance(): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const mod07 = getModuleRegistryEntry("MOD-07");

  if (!mod07) {
    errors.push("MOD-07 entry missing from MODULE_REGISTRY");
    return { ok: false, errors };
  }

  if (MODULE_REGISTRY.filter((entry) => entry.moduleCode === "MOD-07").length !== 1) {
    errors.push("MOD-07 module ID must be unique in MODULE_REGISTRY");
  }

  if (mod07.displayName !== "Branch Management") {
    errors.push("MOD-07 displayName must be Branch Management");
  }

  if (mod07.implementationStatus !== "Implemented") {
    errors.push("MOD-07 implementationStatus must be Implemented");
  }

  for (const dependency of ["MOD-01", "MOD-01A", "MOD-02", "MOD-03", "MOD-04", "MOD-06"]) {
    if (!mod07.dependencies?.includes(dependency)) {
      errors.push(`MOD-07 must depend on ${dependency}`);
    }
  }

  if (!mod07.verifyCommand?.includes("verify:mod07")) {
    errors.push("MOD-07 verifyCommand must reference verify:mod07");
  }

  for (const filePath of [
    mod07.docPath,
    mod07.aiQcReportPath,
    mod07.manualQcGuidePath,
    mod07.manualQcResultTemplatePath,
  ]) {
    if (!filePath || !fs.existsSync(path.join(process.cwd(), filePath))) {
      errors.push(`MOD-07 documentation path missing: ${filePath ?? "(unset)"}`);
    }
  }

  if (mod07.manualQcStatus !== "NOT TESTED" || mod07.browserUatStatus !== "NOT TESTED") {
    errors.push("MOD-07 QC statuses must remain NOT TESTED until manual UAT");
  }

  if (mod07.productionApprovalStatus !== "Pending Manual QC") {
    errors.push("MOD-07 must not claim production approval");
  }

  const requiredCapabilities = [
    "Tenant-isolated branch management",
    "Branch switching",
    "Localization",
    "RTL support",
  ];

  for (const capability of requiredCapabilities) {
    if (!mod07.capabilities?.includes(capability)) {
      errors.push(`MOD-07 capabilities missing: ${capability}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateMod15RegistryCompliance(): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const mod15 = getModuleRegistryEntry("MOD-15");

  if (!mod15) {
    errors.push("MOD-15 entry missing from MODULE_REGISTRY");
    return { ok: false, errors };
  }

  if (MODULE_REGISTRY.filter((entry) => entry.moduleCode === "MOD-15").length !== 1) {
    errors.push("MOD-15 module ID must be unique in MODULE_REGISTRY");
  }

  if (mod15.displayName !== "Patient Registration") {
    errors.push("MOD-15 displayName must be Patient Registration");
  }

  if (mod15.implementationStatus !== "Implemented") {
    errors.push("MOD-15 implementationStatus must be Implemented");
  }

  for (const dependency of [
    "MOD-01",
    "MOD-01A",
    "MOD-02",
    "MOD-03",
    "MOD-04",
    "MOD-06",
    "MOD-07",
  ]) {
    if (!mod15.dependencies?.includes(dependency)) {
      errors.push(`MOD-15 must depend on ${dependency}`);
    }
  }

  if (!mod15.verifyCommand?.includes("verify:mod15")) {
    errors.push("MOD-15 verifyCommand must reference verify:mod15");
  }

  for (const filePath of [
    mod15.docPath,
    mod15.aiQcReportPath,
    mod15.manualQcGuidePath,
    mod15.manualQcResultTemplatePath,
  ]) {
    if (!filePath || !fs.existsSync(path.join(process.cwd(), filePath))) {
      errors.push(`MOD-15 documentation path missing: ${filePath ?? "(unset)"}`);
    }
  }

  if (mod15.manualQcStatus !== "NOT TESTED" || mod15.browserUatStatus !== "NOT TESTED") {
    errors.push("MOD-15 QC statuses must remain NOT TESTED until manual UAT");
  }

  if (mod15.productionApprovalStatus !== "Pending Manual QC") {
    errors.push("MOD-15 must not claim production approval");
  }

  const requiredCapabilities = [
    "Tenant-isolated Patient Master",
    "Branch-aware registration",
    "Duplicate-patient detection",
    "Localization",
    "RTL support",
  ];

  for (const capability of requiredCapabilities) {
    if (!mod15.capabilities?.includes(capability)) {
      errors.push(`MOD-15 capabilities missing: ${capability}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateMod17RegistryCompliance(): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const mod17 = getModuleRegistryEntry("MOD-17");

  if (!mod17) {
    errors.push("MOD-17 entry missing from MODULE_REGISTRY");
    return { ok: false, errors };
  }

  if (MODULE_REGISTRY.filter((entry) => entry.moduleCode === "MOD-17").length !== 1) {
    errors.push("MOD-17 module ID must be unique in MODULE_REGISTRY");
  }

  if (mod17.displayName !== "Appointment & Queue") {
    errors.push("MOD-17 displayName must be Appointment & Queue");
  }

  if (mod17.implementationStatus !== "Implemented") {
    errors.push("MOD-17 implementationStatus must be Implemented");
  }

  for (const dependency of [
    "MOD-01",
    "MOD-01A",
    "MOD-02",
    "MOD-03",
    "MOD-04",
    "MOD-06",
    "MOD-07",
    "MOD-15",
  ]) {
    if (!mod17.dependencies?.includes(dependency)) {
      errors.push(`MOD-17 must depend on ${dependency}`);
    }
  }

  if (!mod17.verifyCommand?.includes("verify:mod17")) {
    errors.push("MOD-17 verifyCommand must reference verify:mod17");
  }

  for (const filePath of [
    mod17.docPath,
    mod17.aiQcReportPath,
    mod17.manualQcGuidePath,
    mod17.manualQcResultTemplatePath,
  ]) {
    if (!filePath || !fs.existsSync(path.join(process.cwd(), filePath))) {
      errors.push(`MOD-17 documentation path missing: ${filePath ?? "(unset)"}`);
    }
  }

  if (mod17.manualQcStatus !== "NOT TESTED" || mod17.browserUatStatus !== "NOT TESTED") {
    errors.push("MOD-17 QC statuses must remain NOT TESTED until manual UAT");
  }

  if (mod17.productionApprovalStatus !== "Pending Manual QC") {
    errors.push("MOD-17 must not claim production approval");
  }

  const requiredCapabilities = [
    "Tenant-isolated appointments",
    "Branch-aware scheduling",
    "Walk-in and scheduled booking",
    "Appointment number generation",
    "Doctor-wise daily queue tokens",
    "Queue call/skip/recall/complete",
    "Duplicate slot prevention",
    "Patient master integration",
    "Localization",
    "RTL support",
  ];

  for (const capability of requiredCapabilities) {
    if (!mod17.capabilities?.includes(capability)) {
      errors.push(`MOD-17 capabilities missing: ${capability}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateMod18RegistryCompliance(): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const mod18 = getModuleRegistryEntry("MOD-18");

  if (!mod18) {
    errors.push("MOD-18 entry missing from MODULE_REGISTRY");
    return { ok: false, errors };
  }

  if (MODULE_REGISTRY.filter((entry) => entry.moduleCode === "MOD-18").length !== 1) {
    errors.push("MOD-18 module ID must be unique in MODULE_REGISTRY");
  }

  if (mod18.displayName !== "Doctor Consultation") {
    errors.push("MOD-18 displayName must be Doctor Consultation");
  }

  if (mod18.implementationStatus !== "Implemented") {
    errors.push("MOD-18 implementationStatus must be Implemented");
  }

  for (const dependency of [
    "MOD-01",
    "MOD-01A",
    "MOD-02",
    "MOD-03",
    "MOD-04",
    "MOD-06",
    "MOD-07",
    "MOD-15",
    "MOD-17",
  ]) {
    if (!mod18.dependencies?.includes(dependency)) {
      errors.push(`MOD-18 must depend on ${dependency}`);
    }
  }

  if (!mod18.verifyCommand?.includes("verify:mod18")) {
    errors.push("MOD-18 verifyCommand must reference verify:mod18");
  }

  for (const filePath of [
    mod18.docPath,
    mod18.aiQcReportPath,
    mod18.manualQcGuidePath,
    mod18.manualQcResultTemplatePath,
  ]) {
    if (!filePath || !fs.existsSync(path.join(process.cwd(), filePath))) {
      errors.push(`MOD-18 documentation path missing: ${filePath ?? "(unset)"}`);
    }
  }

  if (mod18.manualQcStatus !== "NOT TESTED" || mod18.browserUatStatus !== "NOT TESTED") {
    errors.push("MOD-18 QC statuses must remain NOT TESTED until manual UAT");
  }

  if (mod18.productionApprovalStatus !== "Pending Manual QC") {
    errors.push("MOD-18 must not claim production approval");
  }

  const requiredCapabilities = [
    "Clinical encounter lifecycle",
    "Appointment-linked consultation start",
    "Tenant-isolated encounters",
    "Vitals capture",
    "Diagnosis recording",
    "Medicine advice",
    "Investigation advice",
    "Duplicate encounter prevention",
    "Localization",
    "RTL support",
  ];

  for (const capability of requiredCapabilities) {
    if (!mod18.capabilities?.includes(capability)) {
      errors.push(`MOD-18 capabilities missing: ${capability}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateMod19RegistryCompliance(): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const mod19 = getModuleRegistryEntry("MOD-19");

  if (!mod19) {
    errors.push("MOD-19 entry missing from MODULE_REGISTRY");
    return { ok: false, errors };
  }

  if (MODULE_REGISTRY.filter((entry) => entry.moduleCode === "MOD-19").length !== 1) {
    errors.push("MOD-19 module ID must be unique in MODULE_REGISTRY");
  }

  if (mod19.displayName !== "Prescription Management") {
    errors.push("MOD-19 displayName must be Prescription Management");
  }

  if (mod19.implementationStatus !== "Implemented") {
    errors.push("MOD-19 implementationStatus must be Implemented");
  }

  for (const dependency of [
    "MOD-01",
    "MOD-01A",
    "MOD-02",
    "MOD-03",
    "MOD-04",
    "MOD-06",
    "MOD-07",
    "MOD-15",
    "MOD-17",
    "MOD-18",
  ]) {
    if (!mod19.dependencies?.includes(dependency)) {
      errors.push(`MOD-19 must depend on ${dependency}`);
    }
  }

  if (!mod19.verifyCommand?.includes("verify:mod19")) {
    errors.push("MOD-19 verifyCommand must reference verify:mod19");
  }

  for (const filePath of [
    mod19.docPath,
    mod19.aiQcReportPath,
    mod19.manualQcGuidePath,
    mod19.manualQcResultTemplatePath,
  ]) {
    if (!filePath || !fs.existsSync(path.join(process.cwd(), filePath))) {
      errors.push(`MOD-19 documentation path missing: ${filePath ?? "(unset)"}`);
    }
  }

  if (mod19.manualQcStatus !== "NOT TESTED" || mod19.browserUatStatus !== "NOT TESTED") {
    errors.push("MOD-19 QC statuses must remain NOT TESTED until manual UAT");
  }

  if (mod19.productionApprovalStatus !== "Pending Manual QC") {
    errors.push("MOD-19 must not claim production approval");
  }

  const requiredCapabilities = [
    "Encounter-linked prescription creation",
    "Tenant-isolated prescriptions",
    "Structured medicine lines",
    "Draft edit and finalize lifecycle",
    "Prescription cancellation",
    "Revision versioning",
    "Print and reprint audit",
    "Version history",
    "Localization",
    "RTL support",
  ];

  for (const capability of requiredCapabilities) {
    if (!mod19.capabilities?.includes(capability)) {
      errors.push(`MOD-19 capabilities missing: ${capability}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateMod20RegistryCompliance(): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const mod20 = getModuleRegistryEntry("MOD-20");

  if (!mod20) {
    errors.push("MOD-20 entry missing from MODULE_REGISTRY");
    return { ok: false, errors };
  }

  if (MODULE_REGISTRY.filter((entry) => entry.moduleCode === "MOD-20").length !== 1) {
    errors.push("MOD-20 module ID must be unique in MODULE_REGISTRY");
  }

  if (mod20.displayName !== "Pharmacy & Medication Catalog") {
    errors.push("MOD-20 displayName must be Pharmacy & Medication Catalog");
  }

  if (mod20.implementationStatus !== "Implemented") {
    errors.push("MOD-20 implementationStatus must be Implemented");
  }

  for (const dependency of [
    "MOD-01",
    "MOD-01A",
    "MOD-02",
    "MOD-03",
    "MOD-04",
    "MOD-06",
    "MOD-07",
    "MOD-18",
    "MOD-19",
  ]) {
    if (!mod20.dependencies?.includes(dependency)) {
      errors.push(`MOD-20 must depend on ${dependency}`);
    }
  }

  if (!mod20.verifyCommand?.includes("verify:mod20")) {
    errors.push("MOD-20 verifyCommand must reference verify:mod20");
  }

  for (const filePath of [
    mod20.docPath,
    mod20.aiQcReportPath,
    mod20.manualQcGuidePath,
    mod20.manualQcResultTemplatePath,
  ]) {
    if (!filePath || !fs.existsSync(path.join(process.cwd(), filePath))) {
      errors.push(`MOD-20 documentation path missing: ${filePath ?? "(unset)"}`);
    }
  }

  if (mod20.manualQcStatus !== "NOT TESTED" || mod20.browserUatStatus !== "NOT TESTED") {
    errors.push("MOD-20 QC statuses must remain NOT TESTED until manual UAT");
  }

  if (mod20.productionApprovalStatus !== "Pending Manual QC") {
    errors.push("MOD-20 must not claim production approval");
  }

  const requiredCapabilities = [
    "Tenant medication catalog",
    "Generic and brand distinction",
    "Prescription catalog lookup",
    "Branch availability mapping",
    "Localization",
    "RTL support",
  ];

  for (const capability of requiredCapabilities) {
    if (!mod20.capabilities?.includes(capability)) {
      errors.push(`MOD-20 capabilities missing: ${capability}`);
    }
  }

  return { ok: errors.length === 0, errors };
}
