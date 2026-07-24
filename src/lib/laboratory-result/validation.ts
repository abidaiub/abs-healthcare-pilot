import type { ResultType } from "@/generated/prisma/client";
import { LAB_RESULT_ERROR_CODES } from "@/lib/laboratory-result/errors";

export type ResultValueInput = {
  resultType: ResultType;
  numericValue?: number | null;
  textValue?: string | null;
  choiceValue?: string | null;
  booleanValue?: boolean | null;
  decimalPlaces?: number;
  isRequired?: boolean;
};

export function hasResultValue(input: ResultValueInput): boolean {
  switch (input.resultType) {
    case "NUMERIC":
    case "CALCULATED":
      return input.numericValue != null && !Number.isNaN(input.numericValue);
    case "BOOLEAN":
      return input.booleanValue != null;
    case "OPTION_LIST":
      return Boolean(input.choiceValue?.trim());
    case "TEXT":
    case "LONG_TEXT":
    case "NARRATIVE":
    case "CULTURE":
      return Boolean(input.textValue?.trim());
    default:
      return Boolean(input.textValue?.trim() || input.numericValue != null);
  }
}

export function validateResultValue(input: ResultValueInput): { ok: true } | { ok: false; errorCode: string } {
  if (input.isRequired && !hasResultValue(input)) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_PARAMETER_REQUIRED };
  }

  if (input.resultType === "NUMERIC" || input.resultType === "CALCULATED") {
    if (input.numericValue == null) {
      return input.isRequired
        ? { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_NUMERIC_REQUIRED }
        : { ok: true };
    }
    if (Number.isNaN(input.numericValue)) {
      return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_VALUE_INVALID };
    }
    const places = input.decimalPlaces ?? 2;
    const factor = 10 ** places;
    const rounded = Math.round(input.numericValue * factor) / factor;
    if (Math.abs(rounded - input.numericValue) > 1 / factor / 10) {
      return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_VALUE_INVALID };
    }
  }

  if (
    (input.resultType === "TEXT" ||
      input.resultType === "LONG_TEXT" ||
      input.resultType === "NARRATIVE" ||
      input.resultType === "CULTURE") &&
    input.isRequired &&
    !input.textValue?.trim()
  ) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_TEXT_REQUIRED };
  }

  if (input.resultType === "OPTION_LIST" && input.isRequired && !input.choiceValue?.trim()) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_CHOICE_INVALID };
  }

  return { ok: true };
}
