"use client";

import Link from "next/link";
import { Badge, Button, Card, CardBody } from "@/components/ui";
import type { LabOrderStatus } from "@/generated/prisma/client";
import { LAB_ORDER_STATUS_I18N } from "@/lib/laboratory/constants";
import { useI18n } from "@/lib/i18n/client";

export type LabOrderListRow = {
  id: string;
  orderNumber: string;
  status: LabOrderStatus;
  orderSource: string;
  priority: string;
  orderedAt: Date;
  patient: { patientNumber: string; fullName: string };
  doctor: { doctorName: string } | null;
  branch: { code: string; name: string };
  tests: { id: string; status: string }[];
};

const STATUS_VARIANTS: Record<LabOrderStatus, "default" | "success" | "warning" | "info"> = {
  DRAFT: "info",
  CONFIRMED: "info",
  PARTIALLY_COLLECTED: "warning",
  COLLECTED: "warning",
  RECEIVED: "warning",
  IN_PROCESS: "warning",
  READY_FOR_RESULT: "success",
  COMPLETED: "success",
  CANCELLED: "default",
};

export function LabOrderListPanel({
  rows,
  canCreate,
}: {
  rows: LabOrderListRow[];
  canCreate: boolean;
}) {
  const { t } = useI18n();

  if (!rows.length) {
    return (
      <Card>
        <CardBody className="text-sm text-slate-600">
          {t("laboratory.list.empty")}
          {canCreate && (
            <div className="mt-4">
              <Link href="/lab/orders/new">
                <Button type="button">{t("laboratory.actions.create")}</Button>
              </Link>
            </div>
          )}
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">{t("laboratory.fields.orderNumber")}</th>
              <th className="px-4 py-3">{t("laboratory.fields.patient")}</th>
              <th className="px-4 py-3">{t("laboratory.fields.doctor")}</th>
              <th className="px-4 py-3">{t("laboratory.fields.status")}</th>
              <th className="px-4 py-3">{t("laboratory.fields.orderedAt")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-mono text-teal-700">{row.orderNumber}</td>
                <td className="px-4 py-3">
                  {row.patient.fullName}
                  <span className="block text-xs text-slate-500">{row.patient.patientNumber}</span>
                </td>
                <td className="px-4 py-3">{row.doctor?.doctorName ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANTS[row.status]}>{t(LAB_ORDER_STATUS_I18N[row.status])}</Badge>
                </td>
                <td className="px-4 py-3">{new Date(row.orderedAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/lab/orders/${row.id}`}>
                    <Button type="button" variant="secondary">{t("laboratory.actions.viewOrder")}</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}
