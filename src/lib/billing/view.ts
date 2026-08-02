import type {
  InvoiceDiscountType,
  InvoicePaymentMethod,
  InvoicePaymentStatus,
  InvoiceStatus,
} from "@/generated/prisma/client";
import type { InvoiceWithDetails } from "@/lib/billing/queries";

/**
 * Plain, serializable projection of an invoice for Client Components.
 * Money stays as decimal strings so no precision is lost crossing the boundary.
 */
export type InvoiceView = {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currencyCode: string;
  recordVersion: number;
  grossAmount: string;
  discountType: InvoiceDiscountType;
  discountValue: string;
  discountAmount: string;
  discountReason: string | null;
  discountApprovedByName: string | null;
  discountApprovedAt: string | null;
  netAmount: string;
  paidAmount: string;
  dueAmount: string;
  issuedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  patient: {
    id: string;
    patientNumber: string;
    fullName: string;
    mobile: string | null;
    guardianName: string | null;
    guardianRelation: string | null;
  };
  branch: { id: string; code: string; name: string };
  labOrder: { id: string; orderNumber: string; status: string } | null;
  items: Array<{
    id: string;
    testCode: string | null;
    testName: string;
    unitPrice: string;
    quantity: number;
    lineGrossAmount: string;
    lineDiscountAmount: string;
    lineNetAmount: string;
    discountAllowedSnapshot: boolean;
    priceSource: string | null;
  }>;
  payments: Array<{
    id: string;
    receiptNumber: string;
    amount: string;
    paymentMethod: InvoicePaymentMethod;
    status: InvoicePaymentStatus;
    referenceNo: string | null;
    note: string | null;
    receivedByName: string | null;
    receivedAt: string;
    reversalReason: string | null;
  }>;
  discountEvents: Array<{
    id: string;
    eventType: string;
    newDiscountAmount: string;
    reason: string | null;
    appliedAfterPayment: boolean;
    authorizedByName: string | null;
    authorizedAt: string;
  }>;
};

export function toInvoiceView(invoice: InvoiceWithDetails): InvoiceView {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    currencyCode: invoice.currencyCode,
    recordVersion: invoice.recordVersion,
    grossAmount: invoice.grossAmount.toString(),
    discountType: invoice.discountType,
    discountValue: invoice.discountValue.toString(),
    discountAmount: invoice.discountAmount.toString(),
    discountReason: invoice.discountReason,
    discountApprovedByName: invoice.discountApprovedByName,
    discountApprovedAt: invoice.discountApprovedAt?.toISOString() ?? null,
    netAmount: invoice.netAmount.toString(),
    paidAmount: invoice.paidAmount.toString(),
    dueAmount: invoice.dueAmount.toString(),
    issuedAt: invoice.issuedAt?.toISOString() ?? null,
    cancelledAt: invoice.cancelledAt?.toISOString() ?? null,
    cancellationReason: invoice.cancellationReason,
    patient: {
      id: invoice.patient.id,
      patientNumber: invoice.patient.patientNumber,
      fullName: invoice.patient.fullName,
      mobile: invoice.patient.mobile,
      guardianName: invoice.patient.guardianName,
      guardianRelation: invoice.patient.guardianRelation,
    },
    branch: {
      id: invoice.branch.id,
      code: invoice.branch.code,
      name: invoice.branch.name,
    },
    labOrder: invoice.labOrder
      ? {
          id: invoice.labOrder.id,
          orderNumber: invoice.labOrder.orderNumber,
          status: invoice.labOrder.status,
        }
      : null,
    items: invoice.items.map((item) => ({
      id: item.id,
      testCode: item.testCode,
      testName: item.testName,
      unitPrice: item.unitPrice.toString(),
      quantity: item.quantity,
      lineGrossAmount: item.lineGrossAmount.toString(),
      lineDiscountAmount: item.lineDiscountAmount.toString(),
      lineNetAmount: item.lineNetAmount.toString(),
      discountAllowedSnapshot: item.discountAllowedSnapshot,
      priceSource: item.priceSource,
    })),
    payments: invoice.payments.map((payment) => ({
      id: payment.id,
      receiptNumber: payment.receiptNumber,
      amount: payment.amount.toString(),
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      referenceNo: payment.referenceNo,
      note: payment.note,
      receivedByName: payment.receivedByName,
      receivedAt: payment.receivedAt.toISOString(),
      reversalReason: payment.reversalReason,
    })),
    discountEvents: invoice.discountEvents.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      newDiscountAmount: event.newDiscountAmount.toString(),
      reason: event.reason,
      appliedAfterPayment: event.appliedAfterPayment,
      authorizedByName: event.authorizedByName,
      authorizedAt: event.authorizedAt.toISOString(),
    })),
  };
}
