export function parseAffectedParameterIds(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function serializeAffectedParameterIds(ids: string[]): string | null {
  if (!ids.length) return null;
  return JSON.stringify(ids);
}
