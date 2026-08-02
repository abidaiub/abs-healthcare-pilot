"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createInvoiceFromLabOrderAction,
  createInvoiceFromPrescriptionAction,
  listBillableDoctorPrescriptionsAction,
  listBillableLabOrdersAction,
} from "@/app/actions/tenant-billing";
import { Badge, Button, Card, CardBody, Input } from "@/components/ui";
import { INVOICE_STATUS_I18N } from "@/lib/billing/constants";
import { useI18n } from "@/lib/i18n/client";

export type BillableLabOrder = Awaited<
  ReturnType<typeof listBillableLabOrdersAction>
>[number];

type BillablePrescription = Awaited<
  ReturnType<typeof listBillableDoctorPrescriptionsAction>
>[number];

function invoiceVariant(status: string) {
  if (status === "PAID") return "success" as const;
  if (status === "PARTIALLY_PAID") return "warning" as const;
  if (status === "CANCELLED") return "danger" as const;
  return "info" as const;
}

export function BillingWorklistPanel({
  orders,
  canCreateInvoice,
}: {
  orders: BillableLabOrder[];
  canCreateInvoice: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [term, setTerm] = useState("");
  const [rows, setRows] = useState(orders);
  const [prescriptions, setPrescriptions] = useState<BillablePrescription[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function search() {
    startTransition(async () => {
      const [orderResult, prescriptionResult] = await Promise.all([
        listBillableLabOrdersAction(term),
        listBillableDoctorPrescriptionsAction(term),
      ]);
      setRows(orderResult);
      setPrescriptions(prescriptionResult);
      setError(null);
    });
  }

  function createInvoice(labOrderId: string) {
    startTransition(async () => {
      const result = await createInvoiceFromLabOrderAction(labOrderId);
      if (!result.ok) {
        setError(t(`billing.errors.${result.errorCode}`, t("billing.errors.BILLING_VALIDATION")));
        return;
      }
      setError(null);
      router.push(`/diagnostic/billing/${result.invoiceId}`);
    });
  }

  function loadDoctorInvestigations(prescriptionId: string) {
    startTransition(async () => {
      const result = await createInvoiceFromPrescriptionAction(prescriptionId);
      if (!result.ok) {
        setError(t(`billing.errors.${result.errorCode}`, t("billing.errors.BILLING_VALIDATION")));
        return;
      }
      setError(null);
      router.push(`/diagnostic/billing/${result.invoiceId}`);
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {t("billing.sections.orderSearch")}
          </h2>
        </div>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[240px] flex-1">
              <Input
                label={t("billing.actions.search")}
                placeholder={`${t("billing.fields.orderNumber")} / ${t("billing.fields.patientNumber")} / ${t("billing.fields.invoiceNumber")}`}
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") search();
                }}
              />
            </div>
            <Button type="button" onClick={search} disabled={pending}>
              {t("billing.actions.search")}
            </Button>
          </div>
          <p className="text-xs text-slate-500">{t("billing.hints.priceSnapshot")}</p>
          <p className="text-xs text-slate-500">{t("billing.hints.doctorInvestigations")}</p>
        </CardBody>
      </Card>

      {prescriptions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">
            {t("billing.sections.doctorInvestigations")}
          </h3>
          {prescriptions.map((prescription) => (
            <Card key={prescription.id}>
              <CardBody className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono font-semibold text-teal-700">
                      {prescription.prescriptionNumber}
                    </p>
                    <p className="text-sm text-slate-700">
                      {prescription.patient.fullName} · {prescription.patient.patientNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {prescription.doctor?.doctorName ?? "—"} ·{" "}
                      {prescription.investigations.length} {t("billing.sections.items")}
                    </p>
                  </div>
                  <Badge variant="warning">{t("billing.actions.loadDoctorInvestigations")}</Badge>
                </div>

                <ul className="flex flex-wrap gap-2 text-xs text-slate-600">
                  {prescription.investigations.map((row) => (
                    <li
                      key={row.id}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
                    >
                      {row.investigationText}
                      {row.priority ? ` (${row.priority})` : ""}
                    </li>
                  ))}
                </ul>

                <Button
                  type="button"
                  disabled={!canCreateInvoice || pending}
                  onClick={() => loadDoctorInvestigations(prescription.id)}
                >
                  {t("billing.actions.loadDoctorInvestigations")}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {!rows.length && !prescriptions.length ? (
        <Card>
          <CardBody className="text-sm text-slate-600">{t("billing.list.empty")}</CardBody>
        </Card>
      ) : rows.length > 0 ? (
        <div className="space-y-4">
          {rows.map((order) => (
            <Card key={order.id}>
              <CardBody className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono font-semibold text-teal-700">{order.orderNumber}</p>
                    <p className="text-sm text-slate-700">
                      {order.patient.fullName} · {order.patient.patientNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.doctor?.doctorName ?? "—"} · {order.tests.length}{" "}
                      {t("billing.sections.items")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {order.invoice ? (
                      <Badge variant={invoiceVariant(order.invoice.status)}>
                        {t(INVOICE_STATUS_I18N[order.invoice.status])}
                      </Badge>
                    ) : (
                      <Badge variant="warning">{t("billing.actions.createInvoice")}</Badge>
                    )}
                  </div>
                </div>

                <ul className="flex flex-wrap gap-2 text-xs text-slate-600">
                  {order.tests.map((test) => (
                    <li
                      key={test.id}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
                    >
                      {test.testName}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-2">
                  {order.invoice ? (
                    <Link href={`/diagnostic/billing/${order.invoice.id}`}>
                      <Button type="button" variant="secondary">
                        {order.invoice.invoiceNumber}
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      type="button"
                      disabled={!canCreateInvoice || pending}
                      onClick={() => createInvoice(order.id)}
                    >
                      {t("billing.actions.createInvoice")}
                    </Button>
                  )}
                  <Link href={`/lab/orders/${order.id}`}>
                    <Button type="button" variant="ghost">
                      {order.orderNumber}
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
