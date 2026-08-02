import type { InvoiceDiscountType } from "@/generated/prisma/client";
import { BILLING_ERROR_CODES, type BillingErrorCode } from "@/lib/billing/errors";
import { parseMoneyToMinor, type MinorUnits } from "@/lib/billing/money";

export const MAX_DISCOUNT_PERCENTAGE_HUNDREDTHS = 10_000; // 100.00%

export type DiscountValidationInput = {
  discountType: InvoiceDiscountType;
  discountValue: string | number;
  reason?: string | null;
  discountableGrossMinor: MinorUnits;
  resultingDiscountMinor: MinorUnits;
  resultingNetMinor: MinorUnits;
  paidMinor: MinorUnits;
};

export function validateDiscountInput(
  input: DiscountValidationInput,
): BillingErrorCode | null {
  let requestedHundredths: number;
  try {
    requestedHundredths = parseMoneyToMinor(input.discountValue);
  } catch {
    return BILLING_ERROR_CODES.DISCOUNT_INVALID_VALUE;
  }

  if (requestedHundredths < 0) return BILLING_ERROR_CODES.DISCOUNT_INVALID_VALUE;

  if (input.discountType === "NONE") {
    return requestedHundredths === 0 ? null : BILLING_ERROR_CODES.DISCOUNT_INVALID_VALUE;
  }

  if (requestedHundredths === 0) return BILLING_ERROR_CODES.DISCOUNT_INVALID_VALUE;

  if (input.discountType === "PERCENTAGE" && requestedHundredths > MAX_DISCOUNT_PERCENTAGE_HUNDREDTHS) {
    return BILLING_ERROR_CODES.DISCOUNT_INVALID_PERCENTAGE;
  }

  if (input.discountableGrossMinor <= 0) {
    return BILLING_ERROR_CODES.DISCOUNT_SERVICE_NOT_DISCOUNTABLE;
  }

  if (input.discountType === "FIXED_AMOUNT" && requestedHundredths > input.discountableGrossMinor) {
    return BILLING_ERROR_CODES.DISCOUNT_EXCEEDS_GROSS;
  }

  if (input.resultingDiscountMinor > input.discountableGrossMinor) {
    return BILLING_ERROR_CODES.DISCOUNT_EXCEEDS_GROSS;
  }

  if (!input.reason || !input.reason.trim()) {
    return BILLING_ERROR_CODES.DISCOUNT_REASON_REQUIRED;
  }

  if (input.resultingNetMinor < input.paidMinor) {
    return BILLING_ERROR_CODES.DISCOUNT_BELOW_PAID_AMOUNT;
  }

  return null;
}

export function validatePaymentAmount(input: {
  amountMinor: MinorUnits;
  dueMinor: MinorUnits;
}): BillingErrorCode | null {
  if (!Number.isFinite(input.amountMinor) || input.amountMinor <= 0) {
    return BILLING_ERROR_CODES.PAYMENT_INVALID_AMOUNT;
  }
  if (input.amountMinor > input.dueMinor) {
    return BILLING_ERROR_CODES.PAYMENT_EXCEEDS_DUE;
  }
  return null;
}

export function parseMoneyInput(value: string | number): MinorUnits | null {
  try {
    const minor = parseMoneyToMinor(value);
    return minor < 0 ? null : minor;
  } catch {
    return null;
  }
}
