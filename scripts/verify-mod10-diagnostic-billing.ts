/**
 * MOD-10 verification — money arithmetic, invoice reconciliation, discount authorisation,
 * payment rules, numbering, RBAC, i18n and tenant isolation.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { BILLING_ERROR_CODES } from "../src/lib/billing/errors";
import {
  acceptsPayment,
  canTransitionInvoiceStatus,
  formatInvoiceNumber,
  formatReceiptNumber,
  isInvoiceCancellable,
  isInvoiceEditable,
  isValidInvoiceNumber,
  isValidReceiptNumber,
} from "../src/lib/billing/constants";
import {
  applyPercentageToMinor,
  formatMinorForDb,
  parseMoneyToMinor,
  sumMinor,
} from "../src/lib/billing/money";
import {
  assertReconciled,
  computeInvoiceTotals,
  deriveInvoiceStatus,
} from "../src/lib/billing/totals";
import { validateDiscountInput, validatePaymentAmount } from "../src/lib/billing/validation";
import { compareLocaleMessageStructure } from "../src/lib/i18n/completeness";
import { MOD06_PRIMARY_LOCALES } from "../src/lib/i18n/constants";
import { SCREENS } from "../src/lib/module-registry";
import { TENANT_PERMISSION_RESOURCES } from "../src/lib/rbac/permission-catalog";

const pool = new Pool({ connectionString: process.env.DB_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

let failures = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`PASS — ${message}`);
    return;
  }
  failures += 1;
  console.log(`FAIL — ${message}`);
}

function line(unitPriceMinor: number, quantity = 1, discountAllowed = true) {
  return { unitPriceMinor, quantity, discountAllowed };
}

async function main() {
  // ---- Money: decimal strings never touch binary floating point -------------------------
  assert(parseMoneyToMinor("500.00") === 50_000, "500.00 BDT parses to 50000 paisa");
  assert(parseMoneyToMinor("0.1") === 10, "0.1 BDT parses to 10 paisa");
  assert(parseMoneyToMinor("1234.565") === 123_457, "Half-up rounding at the third decimal");
  assert(parseMoneyToMinor("") === 0, "Empty money value is zero");
  assert(formatMinorForDb(123_457) === "1234.57", "Minor units render as a decimal string");
  assert(formatMinorForDb(-500) === "-5.00", "Negative minor units keep their sign");
  assert(
    sumMinor([10, 20, 30]) === 60 && 0.1 + 0.2 !== 0.3,
    "Integer paisa arithmetic avoids the float artefact that breaks 0.1 + 0.2",
  );
  assert(applyPercentageToMinor(50_000, "10") === 5_000, "10% of 500.00 is 50.00");
  assert(applyPercentageToMinor(50_000, "12.5") === 6_250, "12.5% of 500.00 is 62.50");
  assert(applyPercentageToMinor(50_000, "0") === 0, "Zero percent yields no discount");

  let rejected = false;
  try {
    parseMoneyToMinor("12.3.4");
  } catch {
    rejected = true;
  }
  assert(rejected, "Malformed money value is rejected instead of silently coerced");

  // ---- Reconciliation: Gross - Discount = Net, Net - Paid = Due -------------------------
  const cbcOnly = computeInvoiceTotals({
    lines: [line(50_000)],
    discountType: "NONE",
    discountValue: "0",
    paidMinor: 0,
  });
  assertReconciled(cbcOnly);
  assert(cbcOnly.grossMinor === 50_000 && cbcOnly.dueMinor === 50_000, "Single line, no payment");

  const partiallyPaid = computeInvoiceTotals({
    lines: [line(50_000), line(90_000), line(120_000)],
    discountType: "PERCENTAGE",
    discountValue: "10",
    paidMinor: 100_000,
  });
  assertReconciled(partiallyPaid);
  assert(partiallyPaid.grossMinor === 260_000, "Gross is the sum of line gross values");
  assert(partiallyPaid.discountMinor === 26_000, "10% discount on a 2600.00 gross");
  assert(partiallyPaid.netMinor === 234_000, "Net equals gross minus discount");
  assert(partiallyPaid.dueMinor === 134_000, "Due equals net minus paid");

  const settled = computeInvoiceTotals({
    lines: [line(50_000), line(90_000), line(120_000)],
    discountType: "PERCENTAGE",
    discountValue: "10",
    paidMinor: 234_000,
  });
  assertReconciled(settled);
  assert(settled.dueMinor === 0, "Full settlement leaves zero due");

  // A discount that cannot divide evenly must still reconcile to the last paisa.
  const uneven = computeInvoiceTotals({
    lines: [line(33_333), line(33_333), line(33_334)],
    discountType: "PERCENTAGE",
    discountValue: "7.5",
    paidMinor: 0,
  });
  assertReconciled(uneven);
  assert(
    sumMinor(uneven.lines.map((row) => row.lineDiscountMinor)) === uneven.discountMinor,
    "Rounding remainder is absorbed so line discounts sum to the invoice discount",
  );

  // Non-discountable services must be excluded from the discount base.
  const mixed = computeInvoiceTotals({
    lines: [line(50_000, 1, true), line(120_000, 1, false)],
    discountType: "PERCENTAGE",
    discountValue: "10",
    paidMinor: 0,
  });
  assertReconciled(mixed);
  assert(mixed.discountableGrossMinor === 50_000, "Discount base excludes protected services");
  assert(mixed.discountMinor === 5_000, "Percentage applies only to discountable lines");
  assert(mixed.lines[1].lineDiscountMinor === 0, "Protected line carries no discount");

  const overshoot = computeInvoiceTotals({
    lines: [line(50_000)],
    discountType: "FIXED_AMOUNT",
    discountValue: "900",
    paidMinor: 0,
  });
  assertReconciled(overshoot);
  assert(overshoot.discountMinor === 50_000, "Fixed discount is clamped to the discountable gross");
  assert(overshoot.netMinor === 0 && overshoot.dueMinor === 0, "Net can never go negative");

  const quantity = computeInvoiceTotals({
    lines: [line(30_000, 3)],
    discountType: "NONE",
    discountValue: "0",
    paidMinor: 0,
  });
  assert(quantity.grossMinor === 90_000, "Line gross multiplies unit price by quantity");

  // ---- Invoice status derivation and transitions ----------------------------------------
  assert(deriveInvoiceStatus("ISSUED", 234_000, 0) === "ISSUED", "No payment stays ISSUED");
  assert(
    deriveInvoiceStatus("ISSUED", 234_000, 100_000) === "PARTIALLY_PAID",
    "Part payment moves to PARTIALLY_PAID",
  );
  assert(deriveInvoiceStatus("PARTIALLY_PAID", 234_000, 234_000) === "PAID", "Settlement marks PAID");
  assert(deriveInvoiceStatus("DRAFT", 234_000, 0) === "DRAFT", "Draft is not auto-advanced");
  assert(deriveInvoiceStatus("CANCELLED", 0, 0) === "CANCELLED", "Cancelled is terminal");

  assert(canTransitionInvoiceStatus("DRAFT", "ISSUED"), "DRAFT to ISSUED allowed");
  assert(canTransitionInvoiceStatus("ISSUED", "PARTIALLY_PAID"), "ISSUED to PARTIALLY_PAID allowed");
  assert(!canTransitionInvoiceStatus("PAID", "ISSUED"), "PAID cannot be reopened");
  assert(!canTransitionInvoiceStatus("CANCELLED", "ISSUED"), "CANCELLED cannot be reopened");
  assert(isInvoiceEditable("DRAFT") && !isInvoiceEditable("ISSUED"), "Only drafts are editable");
  assert(isInvoiceCancellable("ISSUED") && !isInvoiceCancellable("PAID"), "Paid invoices stand");
  assert(
    acceptsPayment("ISSUED") && acceptsPayment("PARTIALLY_PAID") && !acceptsPayment("DRAFT"),
    "Payment is accepted only against an issued invoice",
  );

  // ---- Discount authorisation rules ------------------------------------------------------
  const discountBase = {
    discountableGrossMinor: 50_000,
    resultingDiscountMinor: 5_000,
    resultingNetMinor: 45_000,
    paidMinor: 0,
  };

  assert(
    validateDiscountInput({
      ...discountBase,
      discountType: "PERCENTAGE",
      discountValue: "10",
      reason: "Regular patient concession approved by branch administrator",
    }) === null,
    "Percentage discount with a recorded reason is accepted",
  );
  assert(
    validateDiscountInput({
      ...discountBase,
      discountType: "PERCENTAGE",
      discountValue: "10",
      reason: "   ",
    }) === BILLING_ERROR_CODES.DISCOUNT_REASON_REQUIRED,
    "Discount without a reason is rejected",
  );
  assert(
    validateDiscountInput({
      ...discountBase,
      discountType: "PERCENTAGE",
      discountValue: "120",
      reason: "Too generous",
    }) === BILLING_ERROR_CODES.DISCOUNT_INVALID_PERCENTAGE,
    "Discount above 100% is rejected",
  );
  assert(
    validateDiscountInput({
      ...discountBase,
      discountType: "FIXED_AMOUNT",
      discountValue: "900",
      reason: "Exceeds bill",
      resultingDiscountMinor: 90_000,
    }) === BILLING_ERROR_CODES.DISCOUNT_EXCEEDS_GROSS,
    "Fixed discount larger than the discountable gross is rejected",
  );
  assert(
    validateDiscountInput({
      ...discountBase,
      discountType: "PERCENTAGE",
      discountValue: "50",
      reason: "Applied after collection",
      resultingDiscountMinor: 25_000,
      resultingNetMinor: 25_000,
      paidMinor: 40_000,
    }) === BILLING_ERROR_CODES.DISCOUNT_BELOW_PAID_AMOUNT,
    "Discount cannot push net below the amount already collected",
  );
  assert(
    validateDiscountInput({
      ...discountBase,
      discountType: "PERCENTAGE",
      discountValue: "10",
      reason: "No discountable service",
      discountableGrossMinor: 0,
    }) === BILLING_ERROR_CODES.DISCOUNT_SERVICE_NOT_DISCOUNTABLE,
    "Discount on a wholly protected invoice is rejected",
  );
  assert(
    validateDiscountInput({
      ...discountBase,
      discountType: "NONE",
      discountValue: "10",
      reason: "Contradictory",
    }) === BILLING_ERROR_CODES.DISCOUNT_INVALID_VALUE,
    "Discount type NONE with a non-zero value is rejected",
  );

  // ---- Payment rules ---------------------------------------------------------------------
  assert(
    validatePaymentAmount({ amountMinor: 100_000, dueMinor: 234_000 }) === null,
    "Partial payment within the due amount is accepted",
  );
  assert(
    validatePaymentAmount({ amountMinor: 234_001, dueMinor: 234_000 }) ===
      BILLING_ERROR_CODES.PAYMENT_EXCEEDS_DUE,
    "Overpayment is rejected",
  );
  assert(
    validatePaymentAmount({ amountMinor: 0, dueMinor: 234_000 }) ===
      BILLING_ERROR_CODES.PAYMENT_INVALID_AMOUNT,
    "Zero payment is rejected",
  );
  assert(
    validatePaymentAmount({ amountMinor: -100, dueMinor: 234_000 }) ===
      BILLING_ERROR_CODES.PAYMENT_INVALID_AMOUNT,
    "Negative payment is rejected",
  );

  // ---- Numbering -------------------------------------------------------------------------
  assert(formatInvoiceNumber(1) === "INV-000001", "Invoice number format INV-000001");
  assert(formatReceiptNumber(42) === "RCP-000042", "Receipt number format RCP-000042");
  assert(isValidInvoiceNumber("INV-000001") && !isValidInvoiceNumber("INV-1"), "Invoice number guard");
  assert(isValidReceiptNumber("RCP-000042") && !isValidReceiptNumber("RCP42"), "Receipt number guard");

  // ---- RBAC, registry and i18n -----------------------------------------------------------
  const billingRoutes = [
    "/diagnostic/billing",
    "/diagnostic/billing/invoice",
    "/diagnostic/billing/discount",
    "/diagnostic/billing/payment",
    "/diagnostic/billing/payment-reversal",
    "/diagnostic/billing/receipt",
  ];
  for (const route of billingRoutes) {
    const resource = TENANT_PERMISSION_RESOURCES.find((entry) => entry.route === route);
    assert(Boolean(resource), `RBAC resource registered for ${route}`);
  }
  assert(
    billingRoutes
      .slice(1)
      .every(
        (route) =>
          TENANT_PERMISSION_RESOURCES.find((entry) => entry.route === route)?.moduleCode ===
          "MOD-10",
      ),
    "Billing sub-resources are mapped to MOD-10",
  );
  assert(
    TENANT_PERMISSION_RESOURCES.find((entry) => entry.route === "/diagnostic/billing/discount")
      ?.resourceKey !==
      TENANT_PERMISSION_RESOURCES.find((entry) => entry.route === "/diagnostic/billing/payment")
        ?.resourceKey,
    "Discount authorisation and payment collection are separately grantable",
  );

  assert(Boolean(SCREENS.diagnosticInvoice), "diagnosticInvoice screen registered");
  assert(Boolean(SCREENS.diagnosticCashMemo), "diagnosticCashMemo screen registered");

  for (const locale of MOD06_PRIMARY_LOCALES) {
    assert(
      fs.existsSync(path.join(process.cwd(), "src/messages", locale, "billing.json")),
      `billing.json present for ${locale}`,
    );
  }
  assert(compareLocaleMessageStructure().ok, "Locale message structure parity holds");

  // ---- Schema and isolation --------------------------------------------------------------
  const tenant = await prisma.tenant.findUnique({ where: { tenantCode: "ABMG" } });
  assert(Boolean(tenant), "ABMG tenant exists");
  if (!tenant) return;

  await prisma.invoice.findFirst({ where: { tenantId: tenant.id } });
  await prisma.invoiceItem.findFirst({ where: { tenantId: tenant.id } });
  await prisma.invoicePayment.findFirst({ where: { tenantId: tenant.id } });
  console.log("PASS — Invoice, item and payment schema queries work");

  const invoice = await prisma.invoice.findFirst({ select: { id: true, tenantId: true } });
  const otherTenant = invoice
    ? await prisma.tenant.findFirst({ where: { NOT: { id: invoice.tenantId } } })
    : null;
  if (invoice && otherTenant) {
    const crossTenant = await prisma.invoice.findFirst({
      where: { id: invoice.id, tenantId: otherTenant.id },
    });
    assert(crossTenant === null, "Cross-tenant invoice lookup returns nothing");
  } else {
    console.log("PASS — Cross-tenant invoice check skipped (no invoice rows yet)");
  }

  // Every persisted invoice must satisfy the approved reconciliation equation.
  const persisted = await prisma.invoice.findMany({
    select: {
      invoiceNumber: true,
      grossAmount: true,
      discountAmount: true,
      netAmount: true,
      paidAmount: true,
      dueAmount: true,
    },
  });
  const unreconciled = persisted.filter((row) => {
    const gross = parseMoneyToMinor(row.grossAmount);
    const discount = parseMoneyToMinor(row.discountAmount);
    const net = parseMoneyToMinor(row.netAmount);
    const paid = parseMoneyToMinor(row.paidAmount);
    const due = parseMoneyToMinor(row.dueAmount);
    return gross - discount !== net || net - paid !== due;
  });
  assert(
    unreconciled.length === 0,
    `All ${persisted.length} persisted invoice(s) reconcile (${unreconciled
      .map((row) => row.invoiceNumber)
      .join(", ")})`,
  );

  console.log(
    failures === 0
      ? "\nMOD-10 verification complete."
      : `\nMOD-10 verification finished with ${failures} failure(s).`,
  );
  if (failures > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
