import type { Prisma } from "@/generated/prisma/client";
import { PRICE_SOURCE, type PriceSource } from "@/lib/billing/constants";
import { formatMinorForDb, parseMoneyToMinor, type MinorUnits } from "@/lib/billing/money";
import {
  assertReconciled,
  computeInvoiceTotals,
  deriveInvoiceStatus,
} from "@/lib/billing/totals";
import { prisma } from "@/lib/db";

export const invoiceInclude = {
  items: { orderBy: { sequence: "asc" } },
  payments: { orderBy: { receivedAt: "asc" } },
  discountEvents: { orderBy: { authorizedAt: "asc" } },
  patient: {
    select: {
      id: true,
      patientNumber: true,
      fullName: true,
      mobile: true,
      guardianName: true,
      guardianRelation: true,
    },
  },
  branch: { select: { id: true, code: true, name: true } },
  labOrder: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      doctorId: true,
      encounterId: true,
      prescriptionId: true,
    },
  },
} satisfies Prisma.InvoiceInclude;

export type InvoiceWithDetails = Prisma.InvoiceGetPayload<{ include: typeof invoiceInclude }>;

export async function assertTenantOwnsInvoice(tenantId: string, invoiceId: string) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId },
    include: invoiceInclude,
  });
}

export async function listInvoices(tenantId: string, branchId?: string) {
  return prisma.invoice.findMany({
    where: { tenantId, ...(branchId ? { branchId } : {}) },
    include: invoiceInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function findInvoiceByLabOrder(tenantId: string, labOrderId: string) {
  return prisma.invoice.findFirst({
    where: { tenantId, labOrderId },
    include: invoiceInclude,
  });
}

export async function findInvoiceByNumber(tenantId: string, invoiceNumber: string) {
  return prisma.invoice.findFirst({
    where: { tenantId, invoiceNumber },
    include: invoiceInclude,
  });
}

export type ResolvedServicePrice = {
  tenantServiceId: string;
  testCode: string | null;
  testName: string;
  departmentId: string | null;
  unitPriceMinor: MinorUnits;
  priceSource: PriceSource;
  discountAllowed: boolean;
};

/**
 * Resolves the effective catalog price for a service at a branch.
 * Branch overrides win; otherwise the tenant price applies. The caller snapshots
 * the returned value onto the invoice line so later catalog edits cannot alter history.
 */
export async function resolveServicePrice(
  tenantId: string,
  branchId: string,
  tenantServiceId: string,
  asOf: Date = new Date(),
): Promise<ResolvedServicePrice | null> {
  const service = await prisma.tenantService.findFirst({
    where: {
      id: tenantServiceId,
      tenantId,
      isActive: true,
      effectiveFrom: { lte: asOf },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: asOf } }],
    },
    include: {
      hostService: { select: { serviceCode: true } },
      tenantServiceBranches: { where: { branchId, isActive: true } },
    },
  });
  if (!service) return null;

  const branchOverride = service.tenantServiceBranches[0];
  if (branchOverride && !branchOverride.isAvailable) return null;

  const useBranchPrice = branchOverride?.branchPrice != null;
  const unitPriceMinor = parseMoneyToMinor(
    useBranchPrice ? branchOverride!.branchPrice! : service.price,
  );

  return {
    tenantServiceId: service.id,
    testCode: service.hostService?.serviceCode ?? null,
    testName: service.localName,
    departmentId: service.departmentId,
    unitPriceMinor,
    priceSource: useBranchPrice ? PRICE_SOURCE.BRANCH_PRICE : PRICE_SOURCE.TENANT_PRICE,
    discountAllowed:
      service.discountAllowed && (branchOverride?.branchDiscountAllowed ?? true),
  };
}

/** Lab orders in this tenant/branch that still need an invoice, plus already-billed ones. */
export async function searchBillableDoctorPrescriptions(
  tenantId: string,
  branchId: string,
  term?: string,
) {
  const trimmed = term?.trim();
  if (!trimmed) return [];

  return prisma.prescription.findMany({
    where: {
      tenantId,
      branchId,
      status: "FINALIZED",
      isCurrentVersion: true,
      investigations: { some: { isActive: true } },
      labOrders: { none: { status: { not: "CANCELLED" } } },
      OR: [
        { prescriptionNumber: { contains: trimmed, mode: "insensitive" } },
        { patient: { patientNumber: { contains: trimmed, mode: "insensitive" } } },
        { patient: { fullName: { contains: trimmed, mode: "insensitive" } } },
        { patient: { mobileNormalized: { contains: trimmed } } },
      ],
    },
    include: {
      patient: { select: { id: true, patientNumber: true, fullName: true, mobile: true } },
      doctor: { select: { id: true, doctorName: true } },
      investigations: {
        where: { isActive: true },
        select: {
          id: true,
          investigationText: true,
          priority: true,
          tenantServiceId: true,
        },
        orderBy: { sequence: "asc" },
      },
    },
    orderBy: { finalizedAt: "desc" },
    take: 20,
  });
}

export async function searchBillableLabOrders(
  tenantId: string,
  branchId: string,
  term?: string,
) {
  const trimmed = term?.trim();
  return prisma.labOrder.findMany({
    where: {
      tenantId,
      branchId,
      status: { notIn: ["CANCELLED"] },
      ...(trimmed
        ? {
            OR: [
              { orderNumber: { contains: trimmed, mode: "insensitive" } },
              { patient: { patientNumber: { contains: trimmed, mode: "insensitive" } } },
              { patient: { fullName: { contains: trimmed, mode: "insensitive" } } },
              { patient: { mobileNormalized: { contains: trimmed } } },
              { invoice: { invoiceNumber: { contains: trimmed, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      patient: { select: { id: true, patientNumber: true, fullName: true, mobile: true } },
      doctor: { select: { id: true, doctorName: true } },
      tests: {
        select: {
          id: true,
          testCode: true,
          testName: true,
          tenantServiceId: true,
          departmentId: true,
          status: true,
        },
        orderBy: { sequence: "asc" },
      },
      invoice: { select: { id: true, invoiceNumber: true, status: true } },
    },
    orderBy: { orderedAt: "desc" },
    take: 50,
  });
}

export type RecomputeInvoiceResult = {
  grossMinor: MinorUnits;
  discountMinor: MinorUnits;
  netMinor: MinorUnits;
  paidMinor: MinorUnits;
  dueMinor: MinorUnits;
};

/**
 * Recomputes invoice money from its own lines and non-reversed payments, then persists
 * the reconciled totals. Must run inside the same transaction as the change that
 * triggered it so partial financial state can never be observed.
 */
export async function recomputeInvoiceTotals(
  tx: Prisma.TransactionClient,
  tenantId: string,
  invoiceId: string,
): Promise<RecomputeInvoiceResult> {
  const invoice = await tx.invoice.findFirstOrThrow({
    where: { id: invoiceId, tenantId },
    include: {
      items: { orderBy: { sequence: "asc" } },
      payments: { where: { status: "RECEIVED" } },
    },
  });

  const paidMinor = invoice.payments.reduce(
    (total, payment) => total + parseMoneyToMinor(payment.amount),
    0,
  );

  const totals = computeInvoiceTotals({
    lines: invoice.items.map((item) => ({
      unitPriceMinor: parseMoneyToMinor(item.unitPrice),
      quantity: item.quantity,
      discountAllowed: item.discountAllowedSnapshot,
    })),
    discountType: invoice.discountType,
    discountValue: invoice.discountValue,
    paidMinor,
  });
  assertReconciled(totals);

  for (let index = 0; index < invoice.items.length; index += 1) {
    const item = invoice.items[index];
    const line = totals.lines[index];
    await tx.invoiceItem.update({
      where: { id: item.id },
      data: {
        lineGrossAmount: formatMinorForDb(line.lineGrossMinor),
        lineDiscountAmount: formatMinorForDb(line.lineDiscountMinor),
        lineNetAmount: formatMinorForDb(line.lineNetMinor),
      },
    });
  }

  await tx.invoice.update({
    where: { id: invoice.id },
    data: {
      grossAmount: formatMinorForDb(totals.grossMinor),
      discountAmount: formatMinorForDb(totals.discountMinor),
      netAmount: formatMinorForDb(totals.netMinor),
      paidAmount: formatMinorForDb(totals.paidMinor),
      dueAmount: formatMinorForDb(totals.dueMinor),
      status: deriveInvoiceStatus(invoice.status, totals.netMinor, totals.paidMinor),
    },
  });

  return {
    grossMinor: totals.grossMinor,
    discountMinor: totals.discountMinor,
    netMinor: totals.netMinor,
    paidMinor: totals.paidMinor,
    dueMinor: totals.dueMinor,
  };
}

/** Total outstanding due for a patient, used by the MOD-24 billing-hold evaluation. */
export async function getOutstandingDueMinor(
  client: Prisma.TransactionClient | typeof prisma,
  tenantId: string,
  patientId: string,
  labOrderId?: string,
): Promise<MinorUnits> {
  const invoices = await client.invoice.findMany({
    where: {
      tenantId,
      patientId,
      status: { in: ["ISSUED", "PARTIALLY_PAID"] },
      ...(labOrderId ? { labOrderId } : {}),
    },
    select: { dueAmount: true },
  });
  return invoices.reduce((total, invoice) => total + parseMoneyToMinor(invoice.dueAmount), 0);
}
