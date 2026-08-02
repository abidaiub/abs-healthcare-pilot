"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  applyInvoiceDiscountAction,
  cancelInvoiceAction,
  issueInvoiceAction,
  recordInvoicePaymentAction,
  reverseInvoicePaymentAction,
} from "@/app/actions/tenant-billing";
import { Badge, Button, Card, CardBody, Input, Select, Textarea } from "@/components/ui";
import type { InvoiceDiscountType, InvoicePaymentMethod } from "@/generated/prisma/client";
import {
  INVOICE_DISCOUNT_TYPE_I18N,
  INVOICE_PAYMENT_METHOD_I18N,
  INVOICE_STATUS_I18N,
} from "@/lib/billing/constants";
import type { InvoiceView } from "@/lib/billing/view";
import { useI18n } from "@/lib/i18n/client";

const PAYMENT_METHODS: InvoicePaymentMethod[] = [
  "CASH",
  "CARD",
  "MOBILE_BANKING",
  "BANK_TRANSFER",
  "CHEQUE",
];

const DISCOUNT_TYPES: InvoiceDiscountType[] = ["NONE", "PERCENTAGE", "FIXED_AMOUNT"];

function statusVariant(status: InvoiceView["status"]) {
  if (status === "PAID") return "success" as const;
  if (status === "PARTIALLY_PAID") return "warning" as const;
  if (status === "CANCELLED") return "danger" as const;
  return "info" as const;
}

function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pay-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function InvoiceDetailPanel({
  invoice,
  permissions,
}: {
  invoice: InvoiceView;
  permissions: {
    canIssue: boolean;
    canDiscount: boolean;
    canPay: boolean;
    canReverse: boolean;
    canCancel: boolean;
    canPrint: boolean;
  };
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [discountType, setDiscountType] = useState<InvoiceDiscountType>(invoice.discountType);
  const [discountValue, setDiscountValue] = useState(
    invoice.discountType === "NONE" ? "" : invoice.discountValue,
  );
  const [discountReason, setDiscountReason] = useState(invoice.discountReason ?? "");

  const [paymentAmount, setPaymentAmount] = useState(invoice.dueAmount);
  const [paymentMethod, setPaymentMethod] = useState<InvoicePaymentMethod>("CASH");
  const [referenceNo, setReferenceNo] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentKey, setPaymentKey] = useState(newIdempotencyKey);

  const currency = invoice.currencyCode;
  const hasPayment = invoice.payments.some((payment) => payment.status === "RECEIVED");
  const isCancelled = invoice.status === "CANCELLED";
  const acceptsPayment = invoice.status === "ISSUED" || invoice.status === "PARTIALLY_PAID";

  function fail(errorCode: string) {
    setNotice(null);
    setError(t(`billing.errors.${errorCode}`, t("billing.errors.BILLING_VALIDATION")));
  }

  function succeed(messageKey: string) {
    setError(null);
    setNotice(t(messageKey));
    router.refresh();
  }

  function issue() {
    startTransition(async () => {
      const result = await issueInvoiceAction(invoice.id, invoice.recordVersion);
      if (!result.ok) return fail(result.errorCode);
      succeed("billing.messages.invoiceIssued");
    });
  }

  function applyDiscount() {
    startTransition(async () => {
      const result = await applyInvoiceDiscountAction({
        invoiceId: invoice.id,
        expectedRecordVersion: invoice.recordVersion,
        discountType,
        discountValue: discountType === "NONE" ? "0" : discountValue.trim(),
        reason: discountReason,
      });
      if (!result.ok) return fail(result.errorCode);
      succeed("billing.messages.discountApplied");
    });
  }

  function recordPayment() {
    startTransition(async () => {
      const result = await recordInvoicePaymentAction({
        invoiceId: invoice.id,
        amount: paymentAmount.trim(),
        paymentMethod,
        referenceNo,
        note: paymentNote,
        idempotencyKey: paymentKey,
      });
      if (!result.ok) return fail(result.errorCode);
      setPaymentKey(newIdempotencyKey());
      setReferenceNo("");
      setPaymentNote("");
      succeed(
        result.alreadyApplied
          ? "billing.messages.paymentAlreadyRecorded"
          : "billing.messages.paymentRecorded",
      );
    });
  }

  function reversePayment(paymentId: string) {
    const reason = window.prompt(t("billing.fields.reversalReason"));
    if (!reason?.trim()) return;
    startTransition(async () => {
      const result = await reverseInvoicePaymentAction({ paymentId, reason });
      if (!result.ok) return fail(result.errorCode);
      succeed("billing.messages.paymentReversed");
    });
  }

  function cancelInvoice() {
    if (!window.confirm(t("billing.messages.confirmCancelInvoice"))) return;
    const reason = window.prompt(t("billing.fields.reversalReason"));
    if (!reason?.trim()) return;
    startTransition(async () => {
      const result = await cancelInvoiceAction({
        invoiceId: invoice.id,
        reason,
        expectedRecordVersion: invoice.recordVersion,
      });
      if (!result.ok) return fail(result.errorCode);
      succeed("billing.messages.invoiceCancelled");
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="font-mono text-base font-semibold text-teal-700">
                  {invoice.invoiceNumber}
                </h2>
                <p className="text-sm text-slate-600">
                  {invoice.patient.fullName} · {invoice.patient.patientNumber}
                </p>
                {invoice.patient.guardianName && (
                  <p className="text-xs text-slate-500">
                    {invoice.patient.guardianName}
                    {invoice.patient.guardianRelation
                      ? ` (${invoice.patient.guardianRelation})`
                      : ""}
                  </p>
                )}
              </div>
              <Badge variant={statusVariant(invoice.status)}>
                {t(INVOICE_STATUS_I18N[invoice.status])}
              </Badge>
            </div>
            <CardBody className="space-y-4">
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-slate-500">{t("billing.fields.orderNumber")}</dt>
                  <dd className="font-medium text-slate-900">
                    {invoice.labOrder ? (
                      <Link
                        href={`/lab/orders/${invoice.labOrder.id}`}
                        className="font-mono text-teal-700 hover:underline"
                      >
                        {invoice.labOrder.orderNumber}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">{t("common.branch", "Branch")}</dt>
                  <dd className="font-medium text-slate-900">{invoice.branch.name}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">{t("billing.fields.status")}</dt>
                  <dd className="font-medium text-slate-900">
                    {t(INVOICE_STATUS_I18N[invoice.status])}
                  </dd>
                </div>
              </dl>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                      <th className="py-2">{t("billing.fields.testCode")}</th>
                      <th className="py-2">{t("billing.fields.testName")}</th>
                      <th className="py-2 text-right">{t("billing.fields.unitPrice")}</th>
                      <th className="py-2 text-right">{t("billing.fields.discountAmount")}</th>
                      <th className="py-2 text-right">{t("billing.fields.netAmount")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="py-2 font-mono text-xs text-teal-700">
                          {item.testCode ?? "—"}
                        </td>
                        <td className="py-2">
                          {item.testName}
                          {!item.discountAllowedSnapshot && (
                            <span className="ml-2 text-xs text-slate-400">
                              {t("billing.discountType.none")}
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right font-mono">
                          {currency} {item.unitPrice}
                        </td>
                        <td className="py-2 text-right font-mono">
                          {currency} {item.lineDiscountAmount}
                        </td>
                        <td className="py-2 text-right font-mono">
                          {currency} {item.lineNetAmount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          {!isCancelled && (
            <Card>
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-base font-semibold text-slate-900">
                  {t("billing.sections.discount")}
                </h2>
              </div>
              <CardBody className="space-y-4">
                {!permissions.canDiscount ? (
                  <p className="text-sm text-slate-600">
                    {t("billing.errors.DISCOUNT_NOT_PERMITTED")}
                  </p>
                ) : (
                  <>
                    {hasPayment && (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        {t("billing.hints.postPaymentDiscount")}
                      </p>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Select
                        label={t("billing.fields.discountType")}
                        value={discountType}
                        onChange={(event) =>
                          setDiscountType(event.target.value as InvoiceDiscountType)
                        }
                      >
                        {DISCOUNT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {t(INVOICE_DISCOUNT_TYPE_I18N[type])}
                          </option>
                        ))}
                      </Select>
                      <Input
                        label={t("billing.fields.discountValue")}
                        value={discountValue}
                        inputMode="decimal"
                        disabled={discountType === "NONE"}
                        onChange={(event) => setDiscountValue(event.target.value)}
                      />
                    </div>
                    <Textarea
                      label={t("billing.fields.discountReason")}
                      value={discountReason}
                      rows={2}
                      onChange={(event) => setDiscountReason(event.target.value)}
                    />
                    <p className="text-xs text-slate-500">{t("billing.hints.discountReason")}</p>
                    <Button type="button" disabled={pending} onClick={applyDiscount}>
                      {discountType === "NONE"
                        ? t("billing.actions.removeDiscount")
                        : t("billing.actions.applyDiscount")}
                    </Button>
                    {invoice.discountApprovedByName && (
                      <p className="text-xs text-slate-500">
                        {t("billing.fields.discountApprovedBy")}:{" "}
                        {invoice.discountApprovedByName}
                      </p>
                    )}
                  </>
                )}
              </CardBody>
            </Card>
          )}

          {acceptsPayment && (
            <Card>
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-base font-semibold text-slate-900">
                  {t("billing.sections.payment")}
                </h2>
              </div>
              <CardBody className="space-y-4">
                {!permissions.canPay ? (
                  <p className="text-sm text-slate-600">{t("billing.errors.BILLING_VALIDATION")}</p>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label={`${t("billing.fields.paidAmount")} (${currency})`}
                        value={paymentAmount}
                        inputMode="decimal"
                        onChange={(event) => setPaymentAmount(event.target.value)}
                      />
                      <Select
                        label={t("billing.fields.paymentMethod")}
                        value={paymentMethod}
                        onChange={(event) =>
                          setPaymentMethod(event.target.value as InvoicePaymentMethod)
                        }
                      >
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method} value={method}>
                            {t(INVOICE_PAYMENT_METHOD_I18N[method])}
                          </option>
                        ))}
                      </Select>
                      <Input
                        label={t("billing.fields.referenceNo")}
                        value={referenceNo}
                        onChange={(event) => setReferenceNo(event.target.value)}
                      />
                      <Input
                        label={t("billing.fields.note")}
                        value={paymentNote}
                        onChange={(event) => setPaymentNote(event.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" disabled={pending} onClick={recordPayment}>
                        {t("billing.actions.recordPayment")}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={pending}
                        onClick={() => setPaymentAmount(invoice.dueAmount)}
                      >
                        {t("billing.actions.payFull")}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">{t("billing.hints.idempotency")}</p>
                  </>
                )}
              </CardBody>
            </Card>
          )}

          {invoice.payments.length > 0 && (
            <Card>
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-base font-semibold text-slate-900">
                  {t("billing.sections.payments")}
                </h2>
              </div>
              <CardBody className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-mono font-medium text-slate-900">
                        {payment.receiptNumber}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t(INVOICE_PAYMENT_METHOD_I18N[payment.paymentMethod])} ·{" "}
                        {payment.receivedByName ?? "—"}
                      </p>
                      {payment.reversalReason && (
                        <p className="text-xs text-red-600">{payment.reversalReason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold">
                        {currency} {payment.amount}
                      </span>
                      <Badge variant={payment.status === "RECEIVED" ? "success" : "danger"}>
                        {t(`billing.paymentStatus.${payment.status.toLowerCase()}`)}
                      </Badge>
                      {permissions.canReverse && payment.status === "RECEIVED" && (
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => reversePayment(payment.id)}
                        >
                          {t("billing.actions.reversePayment")}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                {t("billing.sections.reconciliation")}
              </h2>
            </div>
            <CardBody className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">{t("billing.fields.grossAmount")}</span>
                <span className="font-mono">
                  {currency} {invoice.grossAmount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">{t("billing.fields.discountAmount")}</span>
                <span className="font-mono text-amber-700">
                  − {currency} {invoice.discountAmount}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 font-semibold text-slate-900">
                <span>{t("billing.fields.netAmount")}</span>
                <span className="font-mono">
                  {currency} {invoice.netAmount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">{t("billing.fields.paidAmount")}</span>
                <span className="font-mono text-emerald-700">
                  {currency} {invoice.paidAmount}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 font-semibold">
                <span>{t("billing.fields.dueAmount")}</span>
                <span
                  className={`font-mono ${
                    Number(invoice.dueAmount) > 0 ? "text-amber-700" : "text-emerald-700"
                  }`}
                >
                  {currency} {invoice.dueAmount}
                </span>
              </div>
              <p className="text-xs text-slate-500">{t("billing.hints.reconciliation")}</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-col gap-2">
              {invoice.status === "DRAFT" && permissions.canIssue && (
                <Button type="button" disabled={pending} onClick={issue}>
                  {t("billing.actions.issueInvoice")}
                </Button>
              )}
              {permissions.canPrint && invoice.payments.length > 0 && (
                <Link href={`/diagnostic/billing/${invoice.id}/receipt`}>
                  <Button type="button" variant="secondary" className="w-full">
                    {t("billing.actions.printReceipt")}
                  </Button>
                </Link>
              )}
              {permissions.canCancel && !isCancelled && !hasPayment && (
                <Button type="button" variant="ghost" disabled={pending} onClick={cancelInvoice}>
                  {t("billing.actions.cancelInvoice")}
                </Button>
              )}
            </CardBody>
          </Card>

          {invoice.discountEvents.length > 0 && (
            <Card>
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-base font-semibold text-slate-900">
                  {t("billing.sections.discount")}
                </h2>
              </div>
              <CardBody className="space-y-2 text-xs text-slate-600">
                {invoice.discountEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border border-slate-200 px-3 py-2">
                    <p className="font-medium text-slate-800">
                      {event.eventType} · {currency} {event.newDiscountAmount}
                    </p>
                    <p>{event.reason ?? "—"}</p>
                    <p className="text-slate-500">
                      {event.authorizedByName ?? "—"}
                      {event.appliedAfterPayment ? " · post-payment correction" : ""}
                    </p>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
