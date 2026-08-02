import type { InvoiceDiscountType, InvoiceStatus } from "@/generated/prisma/client";
import {
  applyPercentageToMinor,
  clampMinor,
  parseMoneyToMinor,
  sumMinor,
  type MinorUnits,
} from "@/lib/billing/money";

export type InvoiceTotalsLineInput = {
  unitPriceMinor: MinorUnits;
  quantity: number;
  discountAllowed: boolean;
};

export type InvoiceTotalsLine = {
  lineGrossMinor: MinorUnits;
  lineDiscountMinor: MinorUnits;
  lineNetMinor: MinorUnits;
};

export type InvoiceTotalsInput = {
  lines: InvoiceTotalsLineInput[];
  discountType: InvoiceDiscountType;
  discountValue: string | number | { toString(): string };
  paidMinor: MinorUnits;
};

export type InvoiceTotals = {
  grossMinor: MinorUnits;
  discountMinor: MinorUnits;
  netMinor: MinorUnits;
  paidMinor: MinorUnits;
  dueMinor: MinorUnits;
  discountableGrossMinor: MinorUnits;
  lines: InvoiceTotalsLine[];
};

function lineGross(line: InvoiceTotalsLineInput): MinorUnits {
  const quantity = Math.max(1, Math.trunc(line.quantity || 1));
  return Math.trunc(line.unitPriceMinor) * quantity;
}

/**
 * Computes the invoice-level discount before allocation.
 * A percentage discount applies only to lines the catalog marks as discountable.
 */
function computeDiscountMinor(
  input: InvoiceTotalsInput,
  grossMinor: MinorUnits,
  discountableGrossMinor: MinorUnits,
): MinorUnits {
  if (input.discountType === "NONE") return 0;
  if (input.discountType === "PERCENTAGE") {
    return clampMinor(
      applyPercentageToMinor(discountableGrossMinor, input.discountValue),
      0,
      discountableGrossMinor,
    );
  }
  return clampMinor(parseMoneyToMinor(input.discountValue), 0, discountableGrossMinor);
}

/**
 * Allocates the invoice discount across discountable lines proportionally to line
 * gross value. Any rounding remainder lands on the last discountable line so that
 * the sum of line discounts always equals the invoice discount exactly.
 */
function allocateDiscount(
  lines: InvoiceTotalsLineInput[],
  grossPerLine: MinorUnits[],
  discountableGrossMinor: MinorUnits,
  discountMinor: MinorUnits,
): MinorUnits[] {
  const allocation = lines.map(() => 0);
  if (discountMinor <= 0 || discountableGrossMinor <= 0) return allocation;

  const discountableIndexes = lines
    .map((line, index) => ({ line, index }))
    .filter((entry) => entry.line.discountAllowed && grossPerLine[entry.index] > 0)
    .map((entry) => entry.index);

  if (!discountableIndexes.length) return allocation;

  let allocated = 0;
  for (let position = 0; position < discountableIndexes.length - 1; position += 1) {
    const index = discountableIndexes[position];
    const share = Math.floor((grossPerLine[index] * discountMinor) / discountableGrossMinor);
    allocation[index] = share;
    allocated += share;
  }

  const lastIndex = discountableIndexes[discountableIndexes.length - 1];
  allocation[lastIndex] = discountMinor - allocated;

  return allocation;
}

export function computeInvoiceTotals(input: InvoiceTotalsInput): InvoiceTotals {
  const grossPerLine = input.lines.map(lineGross);
  const grossMinor = sumMinor(grossPerLine);
  const discountableGrossMinor = sumMinor(
    grossPerLine.map((gross, index) => (input.lines[index].discountAllowed ? gross : 0)),
  );

  const discountMinor = computeDiscountMinor(input, grossMinor, discountableGrossMinor);
  const allocation = allocateDiscount(
    input.lines,
    grossPerLine,
    discountableGrossMinor,
    discountMinor,
  );

  const netMinor = grossMinor - discountMinor;
  const paidMinor = Math.max(0, Math.trunc(input.paidMinor));
  const dueMinor = netMinor - paidMinor;

  return {
    grossMinor,
    discountMinor,
    netMinor,
    paidMinor,
    dueMinor,
    discountableGrossMinor,
    lines: grossPerLine.map((gross, index) => ({
      lineGrossMinor: gross,
      lineDiscountMinor: allocation[index],
      lineNetMinor: gross - allocation[index],
    })),
  };
}

export function deriveInvoiceStatus(
  currentStatus: InvoiceStatus,
  netMinor: MinorUnits,
  paidMinor: MinorUnits,
): InvoiceStatus {
  if (currentStatus === "DRAFT" || currentStatus === "CANCELLED") return currentStatus;
  if (paidMinor <= 0) return "ISSUED";
  if (paidMinor < netMinor) return "PARTIALLY_PAID";
  return "PAID";
}

/** Guards the approved reconciliation equation before any invoice write is persisted. */
export function assertReconciled(totals: InvoiceTotals): void {
  if (totals.grossMinor - totals.discountMinor !== totals.netMinor) {
    throw new Error("Invoice reconciliation failed: gross - discount !== net");
  }
  if (totals.netMinor - totals.paidMinor !== totals.dueMinor) {
    throw new Error("Invoice reconciliation failed: net - paid !== due");
  }
  const lineDiscountTotal = sumMinor(totals.lines.map((line) => line.lineDiscountMinor));
  if (lineDiscountTotal !== totals.discountMinor) {
    throw new Error("Invoice reconciliation failed: line discounts !== invoice discount");
  }
  const lineGrossTotal = sumMinor(totals.lines.map((line) => line.lineGrossMinor));
  if (lineGrossTotal !== totals.grossMinor) {
    throw new Error("Invoice reconciliation failed: line gross !== invoice gross");
  }
}
