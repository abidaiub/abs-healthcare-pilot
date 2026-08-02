"use server";

import { revalidatePath } from "next/cache";
import type {
  InvoiceDiscountType,
  InvoicePaymentMethod,
  Prisma,
} from "@/generated/prisma/client";
import { requireTenantSession } from "@/lib/auth";
import { acceptsPayment, isInvoiceCancellable } from "@/lib/billing/constants";
import { BILLING_ERROR_CODES } from "@/lib/billing/errors";
import { formatMinorForDb, parseMoneyToMinor } from "@/lib/billing/money";
import { allocateInvoiceNumber, allocateReceiptNumber } from "@/lib/billing/number";
import {
  assertTenantOwnsInvoice,
  findInvoiceByLabOrder,
  invoiceInclude,
  listInvoices,
  recomputeInvoiceTotals,
  resolveServicePrice,
  searchBillableDoctorPrescriptions,
  searchBillableLabOrders,
} from "@/lib/billing/queries";
import { assertReconciled, computeInvoiceTotals } from "@/lib/billing/totals";
import { validateDiscountInput, validatePaymentAmount } from "@/lib/billing/validation";
import { prisma } from "@/lib/db";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { writeAuditLog, writeStatusHistory } from "@/lib/saas/audit";
import { createLabOrderFromPrescriptionAction } from "@/app/actions/tenant-lab-orders";

export type BillingActionResult =
  | {
      ok: true;
      invoiceId?: string;
      invoiceNumber?: string;
      paymentId?: string;
      receiptNumber?: string;
      alreadyApplied?: boolean;
    }
  | { ok: false; errorCode: string };

const INVOICE_ENTITY = "Invoice";
const PAYMENT_ENTITY = "InvoicePayment";

async function auditBillingEvent(input: {
  tenantId: string;
  branchId?: string | null;
  userId: string;
  actorName: string;
  actionType: "INSERT" | "UPDATE" | "DELETE" | "PRINT";
  event: string;
  entityType: string;
  entityId: string;
  changeData?: Record<string, unknown>;
}) {
  await writeAuditLog({
    tenantId: input.tenantId,
    branchId: input.branchId ?? null,
    userId: input.userId,
    actionType: input.actionType,
    entityType: input.entityType,
    entityId: input.entityId,
    changeData: { event: input.event, ...(input.changeData ?? {}) },
    createdBy: input.actorName,
  });
}

function revalidateBillingPaths(invoiceId?: string) {
  revalidatePath("/diagnostic/billing");
  if (invoiceId) {
    revalidatePath(`/diagnostic/billing/${invoiceId}`);
    revalidatePath(`/diagnostic/billing/${invoiceId}/receipt`);
  }
}

export async function listBillableLabOrdersAction(term?: string) {
  const session = await requireTenantPermission("/diagnostic/billing");
  if (!session.branchId) return [];
  return searchBillableLabOrders(session.tenantId, session.branchId, term);
}

export async function listBillableDoctorPrescriptionsAction(term?: string) {
  const session = await requireTenantPermission("/diagnostic/billing");
  if (!session.branchId) return [];
  return searchBillableDoctorPrescriptions(session.tenantId, session.branchId, term);
}

/**
 * Loads a finalized doctor investigation prescription into a lab order, then
 * creates the invoice from catalog-priced lines. Billing must not re-type tests.
 */
export async function createInvoiceFromPrescriptionAction(
  prescriptionId: string,
): Promise<BillingActionResult> {
  await requireTenantPermission("/diagnostic/billing/invoice", "canCreate");

  const session = await requireTenantSession();
  const prescription = await prisma.prescription.findFirst({
    where: {
      id: prescriptionId,
      tenantId: session.tenantId,
      status: "FINALIZED",
      isCurrentVersion: true,
    },
    include: {
      investigations: {
        where: { isActive: true },
        select: { id: true },
        orderBy: { sequence: "asc" },
      },
    },
  });
  if (!prescription || !prescription.investigations.length) {
    return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_LAB_ORDER_INVALID };
  }

  const orderResult = await createLabOrderFromPrescriptionAction(
    prescription.id,
    prescription.investigations.map((row) => row.id),
  );
  if (!orderResult.ok || !orderResult.labOrderId) {
    return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_LAB_ORDER_INVALID };
  }

  return createInvoiceFromLabOrderAction(orderResult.labOrderId);
}

export async function listInvoicesAction() {
  const session = await requireTenantPermission("/diagnostic/billing");
  return listInvoices(session.tenantId, session.branchId);
}

export async function getInvoiceAction(invoiceId: string) {
  const session = await requireTenantPermission("/diagnostic/billing");
  const invoice = await assertTenantOwnsInvoice(session.tenantId, invoiceId);
  if (!invoice) return null;
  if (session.branchId && invoice.branchId !== session.branchId) return null;
  return invoice;
}

/**
 * Builds a draft invoice from a confirmed lab order, snapshotting the effective catalog
 * price onto every line. Re-invoking for the same lab order returns the existing invoice
 * so a double submit cannot create a second bill.
 */
export async function createInvoiceFromLabOrderAction(
  labOrderId: string,
): Promise<BillingActionResult> {
  await requireTenantPermission("/diagnostic/billing/invoice", "canCreate");
  const session = await requireTenantSession();
  if (!session.branchId) {
    return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_BRANCH_ACCESS_DENIED };
  }

  const labOrder = await prisma.labOrder.findFirst({
    where: { id: labOrderId, tenantId: session.tenantId },
    include: { tests: { orderBy: { sequence: "asc" } } },
  });
  if (!labOrder || labOrder.status === "CANCELLED") {
    return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_LAB_ORDER_INVALID };
  }
  if (labOrder.branchId !== session.branchId) {
    return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_BRANCH_ACCESS_DENIED };
  }

  const existing = await findInvoiceByLabOrder(session.tenantId, labOrder.id);
  if (existing) {
    return {
      ok: true,
      invoiceId: existing.id,
      invoiceNumber: existing.invoiceNumber,
      alreadyApplied: true,
    };
  }

  if (!labOrder.tests.length) {
    return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_EMPTY };
  }

  const lines: Array<{
    labOrderTestId: string;
    tenantServiceId: string | null;
    testCode: string | null;
    testName: string;
    departmentId: string | null;
    unitPriceMinor: number;
    priceSource: string | null;
    discountAllowed: boolean;
  }> = [];

  for (const test of labOrder.tests) {
    if (!test.tenantServiceId) {
      return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_PRICE_UNAVAILABLE };
    }
    const price = await resolveServicePrice(
      session.tenantId,
      session.branchId,
      test.tenantServiceId,
    );
    if (!price) {
      return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_SERVICE_UNAVAILABLE };
    }
    lines.push({
      labOrderTestId: test.id,
      tenantServiceId: price.tenantServiceId,
      testCode: test.testCode ?? price.testCode,
      testName: test.testName,
      departmentId: test.departmentId ?? price.departmentId,
      unitPriceMinor: price.unitPriceMinor,
      priceSource: price.priceSource,
      discountAllowed: price.discountAllowed,
    });
  }

  const totals = computeInvoiceTotals({
    lines: lines.map((line) => ({
      unitPriceMinor: line.unitPriceMinor,
      quantity: 1,
      discountAllowed: line.discountAllowed,
    })),
    discountType: "NONE",
    discountValue: 0,
    paidMinor: 0,
  });
  assertReconciled(totals);

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: session.tenantId },
    select: { currencyCode: true },
  });

  try {
    const invoice = await prisma.$transaction(async (tx) => {
      const invoiceNumber = await allocateInvoiceNumber(tx, session.tenantId);
      return tx.invoice.create({
        data: {
          tenantId: session.tenantId,
          branchId: labOrder.branchId,
          patientId: labOrder.patientId,
          labOrderId: labOrder.id,
          invoiceNumber,
          status: "DRAFT",
          currencyCode: tenant.currencyCode,
          grossAmount: formatMinorForDb(totals.grossMinor),
          discountType: "NONE",
          discountValue: formatMinorForDb(0),
          discountAmount: formatMinorForDb(0),
          netAmount: formatMinorForDb(totals.netMinor),
          paidAmount: formatMinorForDb(0),
          dueAmount: formatMinorForDb(totals.dueMinor),
          createdById: session.userId,
          updatedById: session.userId,
          items: {
            create: lines.map((line, index) => ({
              tenantId: session.tenantId,
              labOrderTestId: line.labOrderTestId,
              tenantServiceId: line.tenantServiceId,
              testCode: line.testCode,
              testName: line.testName,
              departmentId: line.departmentId,
              unitPrice: formatMinorForDb(line.unitPriceMinor),
              quantity: 1,
              lineGrossAmount: formatMinorForDb(totals.lines[index].lineGrossMinor),
              lineDiscountAmount: formatMinorForDb(totals.lines[index].lineDiscountMinor),
              lineNetAmount: formatMinorForDb(totals.lines[index].lineNetMinor),
              priceSource: line.priceSource,
              discountAllowedSnapshot: line.discountAllowed,
              sequence: index,
            })),
          },
        },
      });
    });

    await auditBillingEvent({
      tenantId: session.tenantId,
      branchId: invoice.branchId,
      userId: session.userId,
      actorName: session.user.name,
      actionType: "INSERT",
      event: "INVOICE_CREATED",
      entityType: INVOICE_ENTITY,
      entityId: invoice.id,
      changeData: {
        invoiceNumber: invoice.invoiceNumber,
        labOrderId: labOrder.id,
        labOrderNumber: labOrder.orderNumber,
        grossAmount: invoice.grossAmount.toString(),
        lineCount: lines.length,
      },
    });

    revalidateBillingPaths(invoice.id);
    return { ok: true, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as Prisma.PrismaClientKnownRequestError).code === "P2002"
    ) {
      const raced = await findInvoiceByLabOrder(session.tenantId, labOrder.id);
      if (raced) {
        return {
          ok: true,
          invoiceId: raced.id,
          invoiceNumber: raced.invoiceNumber,
          alreadyApplied: true,
        };
      }
      return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_ALREADY_EXISTS };
    }
    throw error;
  }
}

/** Moves a draft invoice to ISSUED so it can accept payment. */
export async function issueInvoiceAction(
  invoiceId: string,
  expectedRecordVersion: number,
): Promise<BillingActionResult> {
  await requireTenantPermission("/diagnostic/billing/invoice", "canEdit");
  const session = await requireTenantSession();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId: session.tenantId },
  });
  if (!invoice) return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_NOT_FOUND };
  if (session.branchId && invoice.branchId !== session.branchId) {
    return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_BRANCH_ACCESS_DENIED };
  }
  if (invoice.status !== "DRAFT") {
    return invoice.status === "ISSUED"
      ? { ok: true, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, alreadyApplied: true }
      : { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_INVALID_STATUS };
  }
  if (invoice.recordVersion !== expectedRecordVersion) {
    return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_STATE_CHANGED };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.invoice.updateMany({
      where: { id: invoice.id, tenantId: session.tenantId, recordVersion: expectedRecordVersion },
      data: {
        status: "ISSUED",
        issuedAt: new Date(),
        recordVersion: { increment: 1 },
        updatedById: session.userId,
      },
    });
    if (result.count === 0) return null;
    return tx.invoice.findFirstOrThrow({ where: { id: invoice.id, tenantId: session.tenantId } });
  });

  if (!updated) return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_STATE_CHANGED };

  await writeStatusHistory({
    tenantId: session.tenantId,
    branchId: updated.branchId,
    entityType: INVOICE_ENTITY,
    entityId: updated.id,
    oldStatus: "DRAFT",
    newStatus: "ISSUED",
    changedBy: session.user.name,
  });
  await auditBillingEvent({
    tenantId: session.tenantId,
    branchId: updated.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "INVOICE_ISSUED",
    entityType: INVOICE_ENTITY,
    entityId: updated.id,
    changeData: { invoiceNumber: updated.invoiceNumber, netAmount: updated.netAmount.toString() },
  });

  revalidateBillingPaths(updated.id);
  return { ok: true, invoiceId: updated.id, invoiceNumber: updated.invoiceNumber };
}

/**
 * Applies or changes an invoice discount. Requires explicit approve permission, always
 * records who authorized it and why, and writes an immutable discount event. Changing a
 * discount after payment is permitted only while the new net stays at or above the amount
 * already paid, and is flagged as a post-payment correction.
 */
export async function applyInvoiceDiscountAction(input: {
  invoiceId: string;
  expectedRecordVersion: number;
  discountType: InvoiceDiscountType;
  discountValue: string;
  reason?: string | null;
}): Promise<BillingActionResult> {
  await requireTenantPermission("/diagnostic/billing/discount", "canApprove");
  const session = await requireTenantSession();

  const invoice = await prisma.invoice.findFirst({
    where: { id: input.invoiceId, tenantId: session.tenantId },
    include: { items: true, payments: { where: { status: "RECEIVED" } } },
  });
  if (!invoice) return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_NOT_FOUND };
  if (session.branchId && invoice.branchId !== session.branchId) {
    return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_BRANCH_ACCESS_DENIED };
  }
  if (invoice.status === "CANCELLED") {
    return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_CANCELLED };
  }
  if (invoice.recordVersion !== input.expectedRecordVersion) {
    return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_STATE_CHANGED };
  }

  const paidMinor = invoice.payments.reduce(
    (total, payment) => total + parseMoneyToMinor(payment.amount),
    0,
  );

  let totals;
  try {
    totals = computeInvoiceTotals({
      lines: invoice.items.map((item) => ({
        unitPriceMinor: parseMoneyToMinor(item.unitPrice),
        quantity: item.quantity,
        discountAllowed: item.discountAllowedSnapshot,
      })),
      discountType: input.discountType,
      discountValue: input.discountValue,
      paidMinor,
    });
  } catch {
    return { ok: false, errorCode: BILLING_ERROR_CODES.DISCOUNT_INVALID_VALUE };
  }

  const validationError = validateDiscountInput({
    discountType: input.discountType,
    discountValue: input.discountValue,
    reason: input.reason,
    discountableGrossMinor: totals.discountableGrossMinor,
    resultingDiscountMinor: totals.discountMinor,
    resultingNetMinor: totals.netMinor,
    paidMinor,
  });
  if (validationError) return { ok: false, errorCode: validationError };

  assertReconciled(totals);

  const previousDiscountType = invoice.discountType;
  const previousDiscountAmount = invoice.discountAmount;
  const appliedAfterPayment = paidMinor > 0;

  const updated = await prisma.$transaction(async (tx) => {
    const guard = await tx.invoice.updateMany({
      where: {
        id: invoice.id,
        tenantId: session.tenantId,
        recordVersion: input.expectedRecordVersion,
      },
      data: {
        discountType: input.discountType,
        discountValue: formatMinorForDb(parseMoneyToMinor(input.discountValue)),
        discountReason: input.reason?.trim() ?? null,
        discountApprovedById: session.userId,
        discountApprovedByName: session.user.name,
        discountApprovedAt: new Date(),
        recordVersion: { increment: 1 },
        updatedById: session.userId,
      },
    });
    if (guard.count === 0) return null;

    await tx.invoiceDiscountEvent.create({
      data: {
        tenantId: session.tenantId,
        invoiceId: invoice.id,
        eventType:
          input.discountType === "NONE"
            ? "REMOVED"
            : previousDiscountType === "NONE"
              ? "APPLIED"
              : "MODIFIED",
        previousDiscountType,
        previousDiscountAmount,
        newDiscountType: input.discountType,
        newDiscountValue: formatMinorForDb(parseMoneyToMinor(input.discountValue)),
        newDiscountAmount: formatMinorForDb(totals.discountMinor),
        reason: input.reason?.trim() ?? null,
        appliedAfterPayment,
        authorizedById: session.userId,
        authorizedByName: session.user.name,
      },
    });

    await recomputeInvoiceTotals(tx, session.tenantId, invoice.id);
    return tx.invoice.findFirstOrThrow({
      where: { id: invoice.id, tenantId: session.tenantId },
      include: invoiceInclude,
    });
  });

  if (!updated) return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_STATE_CHANGED };

  await auditBillingEvent({
    tenantId: session.tenantId,
    branchId: updated.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: appliedAfterPayment ? "INVOICE_DISCOUNT_CORRECTED" : "INVOICE_DISCOUNT_APPLIED",
    entityType: INVOICE_ENTITY,
    entityId: updated.id,
    changeData: {
      invoiceNumber: updated.invoiceNumber,
      previousDiscountType,
      previousDiscountAmount: previousDiscountAmount.toString(),
      discountType: updated.discountType,
      discountValue: updated.discountValue.toString(),
      discountAmount: updated.discountAmount.toString(),
      netAmount: updated.netAmount.toString(),
      dueAmount: updated.dueAmount.toString(),
      reason: updated.discountReason,
      appliedAfterPayment,
    },
  });

  revalidateBillingPaths(updated.id);
  return { ok: true, invoiceId: updated.id, invoiceNumber: updated.invoiceNumber };
}

/**
 * Records a payment and issues a cash memo number. `idempotencyKey` must be supplied by
 * the caller so a refresh, double click or retried request cannot post the same money twice.
 */
export async function recordInvoicePaymentAction(input: {
  invoiceId: string;
  amount: string;
  paymentMethod: InvoicePaymentMethod;
  referenceNo?: string | null;
  note?: string | null;
  idempotencyKey: string;
}): Promise<BillingActionResult> {
  await requireTenantPermission("/diagnostic/billing/payment", "canCreate");
  const session = await requireTenantSession();

  if (!input.idempotencyKey?.trim()) {
    return { ok: false, errorCode: BILLING_ERROR_CODES.BILLING_VALIDATION };
  }

  const existingPayment = await prisma.invoicePayment.findFirst({
    where: { tenantId: session.tenantId, idempotencyKey: input.idempotencyKey },
  });
  if (existingPayment) {
    return {
      ok: true,
      invoiceId: existingPayment.invoiceId,
      paymentId: existingPayment.id,
      receiptNumber: existingPayment.receiptNumber,
      alreadyApplied: true,
    };
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: input.invoiceId, tenantId: session.tenantId },
  });
  if (!invoice) return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_NOT_FOUND };
  if (session.branchId && invoice.branchId !== session.branchId) {
    return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_BRANCH_ACCESS_DENIED };
  }
  if (!acceptsPayment(invoice.status)) {
    return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_INVALID_STATUS };
  }

  let amountMinor: number;
  try {
    amountMinor = parseMoneyToMinor(input.amount);
  } catch {
    return { ok: false, errorCode: BILLING_ERROR_CODES.PAYMENT_INVALID_AMOUNT };
  }

  const amountError = validatePaymentAmount({
    amountMinor,
    dueMinor: parseMoneyToMinor(invoice.dueAmount),
  });
  if (amountError) return { ok: false, errorCode: amountError };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const receiptNumber = await allocateReceiptNumber(tx, session.tenantId);
      const payment = await tx.invoicePayment.create({
        data: {
          tenantId: session.tenantId,
          branchId: invoice.branchId,
          invoiceId: invoice.id,
          receiptNumber,
          amount: formatMinorForDb(amountMinor),
          paymentMethod: input.paymentMethod,
          status: "RECEIVED",
          referenceNo: input.referenceNo?.trim() || null,
          note: input.note?.trim() || null,
          idempotencyKey: input.idempotencyKey,
          receivedById: session.userId,
          receivedByName: session.user.name,
        },
      });
      const totals = await recomputeInvoiceTotals(tx, session.tenantId, invoice.id);
      return { payment, totals };
    });

    await auditBillingEvent({
      tenantId: session.tenantId,
      branchId: invoice.branchId,
      userId: session.userId,
      actorName: session.user.name,
      actionType: "INSERT",
      event: "INVOICE_PAYMENT_RECEIVED",
      entityType: PAYMENT_ENTITY,
      entityId: result.payment.id,
      changeData: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        receiptNumber: result.payment.receiptNumber,
        amount: result.payment.amount.toString(),
        paymentMethod: result.payment.paymentMethod,
        paidAmount: formatMinorForDb(result.totals.paidMinor),
        dueAmount: formatMinorForDb(result.totals.dueMinor),
      },
    });

    revalidateBillingPaths(invoice.id);
    return {
      ok: true,
      invoiceId: invoice.id,
      paymentId: result.payment.id,
      receiptNumber: result.payment.receiptNumber,
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as Prisma.PrismaClientKnownRequestError).code === "P2002"
    ) {
      const raced = await prisma.invoicePayment.findFirst({
        where: { tenantId: session.tenantId, idempotencyKey: input.idempotencyKey },
      });
      if (raced) {
        return {
          ok: true,
          invoiceId: raced.invoiceId,
          paymentId: raced.id,
          receiptNumber: raced.receiptNumber,
          alreadyApplied: true,
        };
      }
    }
    throw error;
  }
}

/** Reverses a received payment as an auditable correction; the receipt row is preserved. */
export async function reverseInvoicePaymentAction(input: {
  paymentId: string;
  reason: string;
}): Promise<BillingActionResult> {
  await requireTenantPermission("/diagnostic/billing/payment-reversal", "canApprove");
  const session = await requireTenantSession();

  if (!input.reason?.trim()) {
    return { ok: false, errorCode: BILLING_ERROR_CODES.PAYMENT_REVERSAL_REASON_REQUIRED };
  }

  const payment = await prisma.invoicePayment.findFirst({
    where: { id: input.paymentId, tenantId: session.tenantId },
  });
  if (!payment) return { ok: false, errorCode: BILLING_ERROR_CODES.PAYMENT_NOT_FOUND };
  if (session.branchId && payment.branchId !== session.branchId) {
    return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_BRANCH_ACCESS_DENIED };
  }
  if (payment.status === "REVERSED") {
    return { ok: true, paymentId: payment.id, alreadyApplied: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.invoicePayment.update({
      where: { id: payment.id },
      data: {
        status: "REVERSED",
        reversedAt: new Date(),
        reversedById: session.userId,
        reversalReason: input.reason.trim(),
      },
    });
    await recomputeInvoiceTotals(tx, session.tenantId, payment.invoiceId);
  });

  await auditBillingEvent({
    tenantId: session.tenantId,
    branchId: payment.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "UPDATE",
    event: "INVOICE_PAYMENT_REVERSED",
    entityType: PAYMENT_ENTITY,
    entityId: payment.id,
    changeData: {
      invoiceId: payment.invoiceId,
      receiptNumber: payment.receiptNumber,
      amount: payment.amount.toString(),
      reason: input.reason.trim(),
    },
  });

  revalidateBillingPaths(payment.invoiceId);
  return { ok: true, invoiceId: payment.invoiceId, paymentId: payment.id };
}

export async function cancelInvoiceAction(input: {
  invoiceId: string;
  reason: string;
  expectedRecordVersion: number;
}): Promise<BillingActionResult> {
  await requireTenantPermission("/diagnostic/billing/invoice", "canDelete");
  const session = await requireTenantSession();

  if (!input.reason?.trim()) {
    return { ok: false, errorCode: BILLING_ERROR_CODES.BILLING_VALIDATION };
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: input.invoiceId, tenantId: session.tenantId },
    include: { payments: { where: { status: "RECEIVED" } } },
  });
  if (!invoice) return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_NOT_FOUND };
  if (session.branchId && invoice.branchId !== session.branchId) {
    return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_BRANCH_ACCESS_DENIED };
  }
  if (!isInvoiceCancellable(invoice.status) || invoice.payments.length > 0) {
    return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_INVALID_STATUS };
  }

  const guard = await prisma.invoice.updateMany({
    where: {
      id: invoice.id,
      tenantId: session.tenantId,
      recordVersion: input.expectedRecordVersion,
    },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: input.reason.trim(),
      recordVersion: { increment: 1 },
      updatedById: session.userId,
    },
  });
  if (guard.count === 0) {
    return { ok: false, errorCode: BILLING_ERROR_CODES.INVOICE_STATE_CHANGED };
  }

  await writeStatusHistory({
    tenantId: session.tenantId,
    branchId: invoice.branchId,
    entityType: INVOICE_ENTITY,
    entityId: invoice.id,
    oldStatus: invoice.status,
    newStatus: "CANCELLED",
    remarks: input.reason.trim(),
    changedBy: session.user.name,
  });
  await auditBillingEvent({
    tenantId: session.tenantId,
    branchId: invoice.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "DELETE",
    event: "INVOICE_CANCELLED",
    entityType: INVOICE_ENTITY,
    entityId: invoice.id,
    changeData: { invoiceNumber: invoice.invoiceNumber, reason: input.reason.trim() },
  });

  revalidateBillingPaths(invoice.id);
  return { ok: true, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber };
}

/** Loads an invoice for cash-memo printing and records the print in the audit trail. */
export async function getInvoiceForReceiptAction(invoiceId: string) {
  const session = await requireTenantPermission("/diagnostic/billing/receipt", "canPrint");
  const invoice = await assertTenantOwnsInvoice(session.tenantId, invoiceId);
  if (!invoice) return null;
  if (session.branchId && invoice.branchId !== session.branchId) return null;

  await auditBillingEvent({
    tenantId: session.tenantId,
    branchId: invoice.branchId,
    userId: session.userId,
    actorName: session.user.name,
    actionType: "PRINT",
    event: "INVOICE_RECEIPT_PRINTED",
    entityType: INVOICE_ENTITY,
    entityId: invoice.id,
    changeData: { invoiceNumber: invoice.invoiceNumber },
  });

  return invoice;
}
