"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";
import { INVOICE_PAYMENT_METHOD_I18N, INVOICE_STATUS_I18N } from "@/lib/billing/constants";
import type { InvoiceView } from "@/lib/billing/view";
import { useI18n } from "@/lib/i18n/client";

export type CashMemoBranding = {
  tenantName: string;
  branchName: string;
  address: string | null;
  contactMobile: string | null;
  footerText: string | null;
};

export function CashMemoView({
  invoice,
  branding,
  autoPrint,
}: {
  invoice: InvoiceView;
  branding: CashMemoBranding;
  autoPrint?: boolean;
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (!autoPrint) return;
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, [autoPrint]);

  const currency = invoice.currencyCode;
  const receivedPayments = invoice.payments.filter((payment) => payment.status === "RECEIVED");

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap gap-2">
        <Button type="button" onClick={() => window.print()}>
          {t("billing.actions.printReceipt")}
        </Button>
      </div>

      <div className="mx-auto max-w-2xl rounded-xl border border-slate-300 bg-white p-8 text-sm text-slate-900">
        <header className="border-b border-slate-300 pb-4 text-center">
          <h1 className="text-lg font-semibold">{branding.tenantName}</h1>
          <p className="text-slate-600">{branding.branchName}</p>
          {branding.address && <p className="text-xs text-slate-500">{branding.address}</p>}
          {branding.contactMobile && (
            <p className="text-xs text-slate-500">{branding.contactMobile}</p>
          )}
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-teal-700">
            {t("billing.actions.printReceipt")}
          </p>
        </header>

        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-slate-500">{t("billing.fields.invoiceNumber")}</dt>
            <dd className="font-mono font-medium">{invoice.invoiceNumber}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{t("billing.fields.orderNumber")}</dt>
            <dd className="font-mono font-medium">{invoice.labOrder?.orderNumber ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{t("billing.fields.patientName")}</dt>
            <dd className="font-medium">{invoice.patient.fullName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">{t("billing.fields.patientNumber")}</dt>
            <dd className="font-mono font-medium">{invoice.patient.patientNumber}</dd>
          </div>
        </dl>

        <table className="mt-5 w-full text-xs">
          <thead>
            <tr className="border-b border-slate-300 text-left uppercase text-slate-500">
              <th className="py-2">{t("billing.fields.testName")}</th>
              <th className="py-2 text-right">{t("billing.fields.unitPrice")}</th>
              <th className="py-2 text-right">{t("billing.fields.discountAmount")}</th>
              <th className="py-2 text-right">{t("billing.fields.netAmount")}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-slate-200">
                <td className="py-2">{item.testName}</td>
                <td className="py-2 text-right font-mono">{item.unitPrice}</td>
                <td className="py-2 text-right font-mono">{item.lineDiscountAmount}</td>
                <td className="py-2 text-right font-mono">{item.lineNetAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-5 ml-auto max-w-xs space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600">{t("billing.fields.grossAmount")}</span>
            <span className="font-mono">
              {currency} {invoice.grossAmount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">{t("billing.fields.discountAmount")}</span>
            <span className="font-mono">
              − {currency} {invoice.discountAmount}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-300 pt-1 font-semibold">
            <span>{t("billing.fields.netAmount")}</span>
            <span className="font-mono">
              {currency} {invoice.netAmount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">{t("billing.fields.paidAmount")}</span>
            <span className="font-mono">
              {currency} {invoice.paidAmount}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-300 pt-1 font-semibold">
            <span>{t("billing.fields.dueAmount")}</span>
            <span className="font-mono">
              {currency} {invoice.dueAmount}
            </span>
          </div>
        </div>

        {invoice.discountReason && (
          <p className="mt-4 text-xs text-slate-600">
            {t("billing.fields.discountReason")}: {invoice.discountReason}
            {invoice.discountApprovedByName ? ` · ${invoice.discountApprovedByName}` : ""}
          </p>
        )}

        <div className="mt-5 border-t border-slate-300 pt-3 text-xs">
          <p className="font-semibold uppercase tracking-wide text-slate-500">
            {t("billing.sections.payments")}
          </p>
          {receivedPayments.map((payment) => (
            <div key={payment.id} className="mt-2 flex justify-between">
              <span className="font-mono">{payment.receiptNumber}</span>
              <span>{t(INVOICE_PAYMENT_METHOD_I18N[payment.paymentMethod])}</span>
              <span className="font-mono">
                {currency} {payment.amount}
              </span>
            </div>
          ))}
        </div>

        <footer className="mt-6 flex items-end justify-between border-t border-slate-300 pt-4 text-xs text-slate-500">
          <span>{t(INVOICE_STATUS_I18N[invoice.status])}</span>
          <span className="border-t border-slate-400 pt-1">{t("billing.fields.receivedBy")}</span>
        </footer>
        {branding.footerText && (
          <p className="mt-3 text-center text-[10px] text-slate-400">{branding.footerText}</p>
        )}
      </div>
    </div>
  );
}
