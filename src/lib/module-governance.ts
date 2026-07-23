import {
  MODULE_REGISTRY,
  type ModuleRegistryEntry,
} from "@/lib/saas-foundation-data";

export function getModuleRegistryEntry(
  moduleCode: string,
): ModuleRegistryEntry | undefined {
  return MODULE_REGISTRY.find((entry) => entry.moduleCode === moduleCode);
}

export function getModuleGovernance(moduleCode: string): ModuleRegistryEntry | undefined {
  const entry = getModuleRegistryEntry(moduleCode);
  if (!entry?.implementationStatus) return undefined;
  return entry;
}
