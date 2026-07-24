import { LAB_RESULT_ERROR_CODES } from "@/lib/laboratory-result/errors";
import { normalizePatientGender } from "@/lib/laboratory-result/age";

type DecimalLike = { toString(): string };

export type ReferenceRangeCandidate = {
  id: string;
  gender: string | null;
  ageFromDays: number | null;
  ageToDays: number | null;
  normalLow: DecimalLike | null;
  normalHigh: DecimalLike | null;
  criticalLow: DecimalLike | null;
  criticalHigh: DecimalLike | null;
  textRange: string | null;
  unit: string | null;
  priority: number;
};

export type SelectedReferenceRange = {
  id: string;
  snapshot: string;
  lowerBound: number | null;
  upperBound: number | null;
  criticalLow: number | null;
  criticalHigh: number | null;
  unit: string | null;
};

function decimalToNumber(value: DecimalLike | null): number | null {
  if (value == null) return null;
  return Number(value.toString());
}

function genderMatches(rangeGender: string | null, patientGender: string | null): boolean {
  if (!rangeGender) return true;
  const normalizedRange = normalizePatientGender(rangeGender);
  if (!normalizedRange) return true;
  if (!patientGender) return false;
  return normalizedRange === patientGender;
}

function ageMatches(range: ReferenceRangeCandidate, ageInDays: number): boolean {
  if (range.ageFromDays != null && ageInDays < range.ageFromDays) return false;
  if (range.ageToDays != null && ageInDays > range.ageToDays) return false;
  return true;
}

function unitMatches(rangeUnit: string | null, parameterUnit: string | null): boolean {
  if (!rangeUnit || !parameterUnit) return true;
  return rangeUnit.trim().toLowerCase() === parameterUnit.trim().toLowerCase();
}

export function formatReferenceRangeSnapshot(range: ReferenceRangeCandidate): string {
  if (range.textRange) return range.textRange;
  const low = decimalToNumber(range.normalLow);
  const high = decimalToNumber(range.normalHigh);
  if (low != null && high != null) return `${low} - ${high}`;
  if (low != null) return `>= ${low}`;
  if (high != null) return `<= ${high}`;
  return "—";
}

export function selectReferenceRange(
  ranges: ReferenceRangeCandidate[],
  input: {
    patientGender: string | null;
    ageInDays: number;
    parameterUnit: string | null;
  },
):
  | { ok: true; range: SelectedReferenceRange }
  | { ok: false; errorCode: typeof LAB_RESULT_ERROR_CODES.LAB_RESULT_RANGE_NOT_FOUND | typeof LAB_RESULT_ERROR_CODES.LAB_RESULT_RANGE_AMBIGUOUS } {
  const active = ranges.filter((range) => range);
  const patientGender = normalizePatientGender(input.patientGender);

  const matches = active.filter(
    (range) =>
      genderMatches(range.gender, patientGender) &&
      ageMatches(range, input.ageInDays) &&
      unitMatches(range.unit, input.parameterUnit),
  );

  if (!matches.length) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_RANGE_NOT_FOUND };
  }

  const topPriority = Math.max(...matches.map((range) => range.priority));
  const topMatches = matches.filter((range) => range.priority === topPriority);
  if (topMatches.length > 1) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_RANGE_AMBIGUOUS };
  }

  const selected = topMatches[0];
  return {
    ok: true,
    range: {
      id: selected.id,
      snapshot: formatReferenceRangeSnapshot(selected),
      lowerBound: decimalToNumber(selected.normalLow),
      upperBound: decimalToNumber(selected.normalHigh),
      criticalLow: decimalToNumber(selected.criticalLow),
      criticalHigh: decimalToNumber(selected.criticalHigh),
      unit: selected.unit ?? input.parameterUnit,
    },
  };
}

export function detectOverlappingRanges(ranges: ReferenceRangeCandidate[]): boolean {
  for (let i = 0; i < ranges.length; i += 1) {
    for (let j = i + 1; j < ranges.length; j += 1) {
      const a = ranges[i];
      const b = ranges[j];
      if (!genderMatches(a.gender, normalizePatientGender(b.gender)) && a.gender && b.gender) continue;
      const aFrom = a.ageFromDays ?? 0;
      const aTo = a.ageToDays ?? Number.MAX_SAFE_INTEGER;
      const bFrom = b.ageFromDays ?? 0;
      const bTo = b.ageToDays ?? Number.MAX_SAFE_INTEGER;
      if (aFrom <= bTo && bFrom <= aTo && a.priority === b.priority) return true;
    }
  }
  return false;
}
