import type {
  InvoiceDiscountType,
  InvoicePaymentMethod,
  InvoiceStatus,
} from "@/generated/prisma/client";

export const INVOICE_NUMBER_PREFIX = "INV";
export const RECEIPT_NUMBER_PREFIX = "RCP";
export const BILLING_CODE_PAD = 6;

export function formatInvoiceNumber(sequence: number): string {
  return `${INVOICE_NUMBER_PREFIX}-${String(sequence).padStart(BILLING_CODE_PAD, "0")}`;
}

export function formatReceiptNumber(sequence: number): string {
  return `${RECEIPT_NUMBER_PREFIX}-${String(sequence).padStart(BILLING_CODE_PAD, "0")}`;
}

export function isValidInvoiceNumber(value: string): boolean {
  return /^INV-\d{6}$/.test(value);
}

export function isValidReceiptNumber(value: string): boolean {
  return /^RCP-\d{6}$/.test(value);
}

export const INVOICE_STATUS_I18N: Record<InvoiceStatus, string> = {
  DRAFT: "billing.invoiceStatus.draft",
  ISSUED: "billing.invoiceStatus.issued",
  PARTIALLY_PAID: "billing.invoiceStatus.partiallyPaid",
  PAID: "billing.invoiceStatus.paid",
  CANCELLED: "billing.invoiceStatus.cancelled",
};

export const INVOICE_DISCOUNT_TYPE_I18N: Record<InvoiceDiscountType, string> = {
  NONE: "billing.discountType.none",
  PERCENTAGE: "billing.discountType.percentage",
  FIXED_AMOUNT: "billing.discountType.fixedAmount",
};

export const INVOICE_PAYMENT_METHOD_I18N: Record<InvoicePaymentMethod, string> = {
  CASH: "billing.paymentMethod.cash",
  CARD: "billing.paymentMethod.card",
  MOBILE_BANKING: "billing.paymentMethod.mobileBanking",
  BANK_TRANSFER: "billing.paymentMethod.bankTransfer",
  CHEQUE: "billing.paymentMethod.cheque",
};

const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ["ISSUED", "CANCELLED"],
  ISSUED: ["PARTIALLY_PAID", "PAID", "CANCELLED"],
  PARTIALLY_PAID: ["PAID", "CANCELLED"],
  PAID: [],
  CANCELLED: [],
};

export function canTransitionInvoiceStatus(
  from: InvoiceStatus,
  to: InvoiceStatus,
): boolean {
  if (from === to) return true;
  return INVOICE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isInvoiceEditable(status: InvoiceStatus): boolean {
  return status === "DRAFT";
}

export function isInvoiceCancellable(status: InvoiceStatus): boolean {
  return status === "DRAFT" || status === "ISSUED";
}

export function acceptsPayment(status: InvoiceStatus): boolean {
  return status === "ISSUED" || status === "PARTIALLY_PAID";
}

/** Price source recorded on each invoice line so pricing origin stays auditable. */
export const PRICE_SOURCE = {
  BRANCH_PRICE: "BRANCH_PRICE",
  TENANT_PRICE: "TENANT_PRICE",
} as const;

export type PriceSource = (typeof PRICE_SOURCE)[keyof typeof PRICE_SOURCE];
