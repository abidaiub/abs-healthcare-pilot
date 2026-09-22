import { createHash } from "node:crypto";
import { formatMinor, parseMoneyToMinor } from "./money";

export const PAYMENT_METHODS = ["CASH", "BKASH", "NAGAD", "CARD", "BANK"] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a],[b]) => a.localeCompare(b)).map(([key,item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

export function requestHash(value: unknown) { return createHash("sha256").update(canonicalJson(value)).digest("hex"); }

export function requireOperationId(value: string) {
  if (!/^[A-Za-z0-9_-]{8,160}$/.test(value)) throw new Error("Invalid operation identity");
  return value;
}

export function requireNonNegativeMoney(value: string, label: string) {
  const minor = parseMoneyToMinor(value);
  if (minor < 0) throw new Error(`${label} cannot be negative`);
  return minor;
}

export function parsePercentageBps(value: string) {
  const minorPercent = requireNonNegativeMoney(value || "0", "Discount percentage");
  if (minorPercent > 10000) throw new Error("Discount percentage cannot exceed 100");
  return minorPercent;
}

export function allocateDiscount(gross: number[], totalDiscount: number) {
  const totalGross = gross.reduce((sum, amount) => sum + amount, 0);
  if (!Number.isSafeInteger(totalGross) || totalDiscount < 0 || totalDiscount > totalGross) throw new Error("Invalid discount allocation");
  let used = 0;
  return gross.map((amount, index) => {
    const allocation = index === gross.length - 1 ? totalDiscount - used : Math.floor(amount * totalDiscount / Math.max(1, totalGross));
    used += allocation;
    return allocation;
  });
}

export function calculateFinancialQuote(input: { prices: number[]; quantities: number[]; discountType?: "NONE"|"PERCENTAGE"|"FIXED_AMOUNT"; discountValue?: string }) {
  if (!input.prices.length || input.prices.length !== input.quantities.length) throw new Error("At least one valid line is required");
  const grossLines = input.prices.map((price,index) => {
    const quantity = input.quantities[index];
    if (!Number.isSafeInteger(price) || price < 0 || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error("Invalid price or quantity");
    const gross = price * quantity;
    if (!Number.isSafeInteger(gross)) throw new Error("Line amount exceeds safe range");
    return gross;
  });
  const gross = grossLines.reduce((sum,value)=>sum+value,0);
  let discount = 0;
  if (input.discountType === "PERCENTAGE") discount = Math.round(gross * parsePercentageBps(input.discountValue ?? "0") / 10000);
  if (input.discountType === "FIXED_AMOUNT") discount = requireNonNegativeMoney(input.discountValue ?? "0", "Discount");
  if (discount > gross) throw new Error("Discount exceeds gross amount");
  const discounts = allocateDiscount(grossLines, discount);
  return { gross, discount, net:gross-discount, lines:grossLines.map((line,index)=>({gross:line,discount:discounts[index],net:line-discounts[index]})), display:{gross:formatMinor(gross),discount:formatMinor(discount),net:formatMinor(gross-discount)} };
}
