export const ENTITY_MODULE_MAP: Record<string, string> = {
  Tenant: "MOD-01",
  TenantStatus: "MOD-01",
  TenantModule: "MOD-01",
  TenantSettings: "MOD-01",
  Branch: "MOD-01",
  User: "MOD-02",
  HostSession: "MOD-02",
  TenantSession: "MOD-02",
  Role: "MOD-03",
  PermissionMatrix: "MOD-03",
  AuditLog: "MOD-04",
};

export const MODULE_LABELS: Record<string, string> = {
  "MOD-01": "Company / Tenant",
  "MOD-02": "User Management",
  "MOD-03": "Role & Permission",
  "MOD-04": "Audit Center",
};

export function resolveModuleCode(entityType: string): string {
  return ENTITY_MODULE_MAP[entityType] ?? "MOD-04";
}

export function entityTypesForModule(moduleCode: string): string[] {
  return Object.entries(ENTITY_MODULE_MAP)
    .filter(([, code]) => code === moduleCode)
    .map(([entityType]) => entityType);
}

export function formatChangeSummary(changeData: Record<string, unknown> | null): {
  oldValue: string;
  newValue: string;
} {
  if (!changeData) {
    return { oldValue: "—", newValue: "—" };
  }

  const oldRaw = changeData.oldValue;
  const newRaw = changeData.newValue;

  return {
    oldValue: formatChangeValue(oldRaw),
    newValue: formatChangeValue(newRaw ?? changeData),
  };
}

export function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function flattenChangeRows(
  changeData: Record<string, unknown> | null,
): Array<{ field: string; oldValue: string; newValue: string }> {
  if (!changeData) return [];

  const oldObj =
    changeData.oldValue && typeof changeData.oldValue === "object"
      ? (changeData.oldValue as Record<string, unknown>)
      : null;
  const newObj =
    changeData.newValue && typeof changeData.newValue === "object"
      ? (changeData.newValue as Record<string, unknown>)
      : null;

  if (oldObj || newObj) {
    const keys = new Set([
      ...Object.keys(oldObj ?? {}),
      ...Object.keys(newObj ?? {}),
    ]);

    return [...keys].map((field) => ({
      field,
      oldValue: formatChangeValue(oldObj?.[field]),
      newValue: formatChangeValue(newObj?.[field]),
    }));
  }

  return [
    {
      field: "summary",
      oldValue: formatChangeValue(changeData.oldValue),
      newValue: formatChangeValue(changeData.newValue ?? changeData),
    },
  ];
}
