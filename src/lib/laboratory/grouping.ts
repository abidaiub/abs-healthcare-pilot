import type { LabOrderTest } from "@/generated/prisma/client";

export type SpecimenGroupKey = string;

export function buildSpecimenGroupKey(test: {
  sampleTypeId: string | null;
  sampleContainerId: string | null;
}): SpecimenGroupKey {
  return `${test.sampleTypeId ?? "none"}|${test.sampleContainerId ?? "none"}`;
}

export function groupTestsBySpecimen<T extends {
  id: string;
  sampleTypeId: string | null;
  sampleContainerId: string | null;
  status: string;
}>(tests: T[]): Array<{ key: SpecimenGroupKey; tests: T[] }> {
  const map = new Map<SpecimenGroupKey, T[]>();
  for (const test of tests) {
    if (test.status === "CANCELLED") continue;
    const key = buildSpecimenGroupKey(test);
    const group = map.get(key) ?? [];
    group.push(test);
    map.set(key, group);
  }
  return [...map.entries()].map(([key, grouped]) => ({ key, tests: grouped }));
}

export function canGroupTestsTogether(a: LabOrderTest, b: LabOrderTest): boolean {
  if (!a.sampleTypeId || !b.sampleTypeId) return false;
  if (a.sampleTypeId !== b.sampleTypeId) return false;
  if ((a.sampleContainerId ?? null) !== (b.sampleContainerId ?? null)) return false;
  return true;
}
