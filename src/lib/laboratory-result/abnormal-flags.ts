import type { AbnormalFlag, ResultType } from "@/generated/prisma/client";

export type FlagComputationInput = {
  resultType: ResultType;
  numericValue: number | null;
  textValue: string | null;
  choiceValue: string | null;
  booleanValue: boolean | null;
  lowerBound: number | null;
  upperBound: number | null;
  criticalLow: number | null;
  criticalHigh: number | null;
  unitSnapshot: string | null;
  parameterUnit: string | null;
  rangeUnit: string | null;
};

export function computeAbnormalFlag(input: FlagComputationInput): { flag: AbnormalFlag; isCritical: boolean } {
  const numericTypes: ResultType[] = ["NUMERIC", "CALCULATED"];
  if (!numericTypes.includes(input.resultType)) {
    if (input.resultType === "BOOLEAN" || input.resultType === "OPTION_LIST" || input.resultType === "TEXT") {
      return { flag: "NOT_APPLICABLE", isCritical: false };
    }
    if (input.textValue?.trim()) return { flag: "NOT_APPLICABLE", isCritical: false };
    return { flag: "UNDETERMINED", isCritical: false };
  }

  if (input.numericValue == null) return { flag: "UNDETERMINED", isCritical: false };

  if (
    input.rangeUnit &&
    input.parameterUnit &&
    input.rangeUnit.trim().toLowerCase() !== input.parameterUnit.trim().toLowerCase()
  ) {
    return { flag: "UNDETERMINED", isCritical: false };
  }

  const value = input.numericValue;
  if (input.criticalLow != null && value < input.criticalLow) {
    return { flag: "CRITICAL_LOW", isCritical: true };
  }
  if (input.criticalHigh != null && value > input.criticalHigh) {
    return { flag: "CRITICAL_HIGH", isCritical: true };
  }
  if (input.lowerBound != null && value < input.lowerBound) {
    return { flag: "LOW", isCritical: false };
  }
  if (input.upperBound != null && value > input.upperBound) {
    return { flag: "HIGH", isCritical: false };
  }
  if (input.lowerBound != null || input.upperBound != null) {
    return { flag: "NORMAL", isCritical: false };
  }
  return { flag: "UNDETERMINED", isCritical: false };
}
