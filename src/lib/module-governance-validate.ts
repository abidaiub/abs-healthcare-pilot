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
