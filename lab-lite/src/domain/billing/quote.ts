import { formatMinor, parseMoneyToMinor, type MinorUnits } from "./money";

export type DiscountType = "NONE" | "PERCENTAGE" | "FIXED_AMOUNT";
export type QuoteLineInput = { testId: string; testCode: string; testName: string; unitPrice: string; quantity?: number; discountAllowed?: boolean };
export type HistoricalLineSnapshot = { testId: string; testCode: string; testName: string; unitPrice: string; quantity: number; gross: string; discount: string; net: string };
export type QuoteSnapshot = { operationId: string; tenantId: string; branchId: string; currencyCode: string; quotedAt: string; gross: string; discount: string; net: string; lines: HistoricalLineSnapshot[] };

export function calculateQuote(input: { operationId: string; tenantId: string; branchId: string; currencyCode: string; lines: QuoteLineInput[]; discountType?: DiscountType; discountValue?: string }): QuoteSnapshot {
  if (!input.lines.length) throw new Error("At least one line is required");
  const gross = input.lines.map((line) => parseMoneyToMinor(line.unitPrice) * Math.max(1, Math.trunc(line.quantity ?? 1)));
  const discountable = gross.reduce((sum, value, index) => sum + (input.lines[index].discountAllowed === false ? 0 : value), 0);
  let discount: MinorUnits = 0;
  if (input.discountType === "PERCENTAGE") discount = Math.round(discountable * Number(input.discountValue ?? 0) / 100);
  if (input.discountType === "FIXED_AMOUNT") discount = parseMoneyToMinor(input.discountValue ?? "0");
  discount = Math.max(0, Math.min(discountable, discount));
  let allocated = 0;
  const eligible = input.lines.map((line, index) => line.discountAllowed === false ? -1 : index).filter((index) => index >= 0);
  const allocations = gross.map(() => 0);
  eligible.forEach((index, position) => {
    const share = position === eligible.length - 1 ? discount - allocated : Math.floor(gross[index] * discount / Math.max(1, discountable));
    allocations[index] = share; allocated += share;
  });
  return {
    operationId: input.operationId, tenantId: input.tenantId, branchId: input.branchId, currencyCode: input.currencyCode,
    quotedAt: new Date().toISOString(), gross: formatMinor(gross.reduce((a, b) => a + b, 0)), discount: formatMinor(discount), net: formatMinor(gross.reduce((a, b) => a + b, 0) - discount),
    lines: input.lines.map((line, index) => ({ testId: line.testId, testCode: line.testCode, testName: line.testName, unitPrice: formatMinor(parseMoneyToMinor(line.unitPrice)), quantity: Math.max(1, Math.trunc(line.quantity ?? 1)), gross: formatMinor(gross[index]), discount: formatMinor(allocations[index]), net: formatMinor(gross[index] - allocations[index]) })),
  };
}

