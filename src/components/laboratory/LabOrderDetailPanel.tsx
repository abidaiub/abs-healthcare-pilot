"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  cancelLabOrderAction,
  confirmLabOrderAction,
  type LabOrderActionResult,
} from "@/app/actions/tenant-lab-orders";
import { Badge, Button, Card, CardBody, Textarea } from "@/components/ui";
import type { LabOrderSource, LabOrderStatus } from "@/generated/prisma/client";
import { LAB_ORDER_STATUS_I18N, isLabOrderEditable } from "@/lib/laboratory/constants";
import { useI18n } from "@/lib/i18n/client";

const SOURCE_KEYS: Record<LabOrderSource, string> = {
  ENCOUNTER_ADVICE: "laboratory.source.encounterAdvice",
  PRESCRIPTION: "laboratory.source.prescription",
  MANUAL: "laboratory.source.manual",
};

export type LabOrderDetailData = {
  id: string;
  orderNumber: string;
  status: LabOrderStatus;
  orderSource: LabOrderSource;
  priority: string;
  orderedAt: Date;
  clinicalNote: string | null;
  patient: { patientNumber: string; fullName: string };
  doctor: { doctorName: string } | null;
  branch: { code: string; name: string };
  tests: Array<{
    id: string;
    testName: string;
    status: string;
    specimenRequirementSnapshot: string | null;
  }>;
  samples: Array<{
    id: string;
    accessionNumber: string;
    sampleStatus: string;
    sampleType: { sampleType: string } | null;
    sampleContainer: { containerType: string } | null;
  }>;
};

export function LabOrderDetailPanel({
  order,
  canEdit,
  canConfirm,
  canCancel,
  canCollect,
}: {
  order: LabOrderDetailData;
  canEdit: boolean;
  canConfirm: boolean;
  canCancel: boolean;
  canCollect: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [pending, startTransition] = useTransition();

  function handleResult(result: LabOrderActionResult) {
    if (!result.ok) {
      setError(t(`laboratory.errors.${result.errorCode}`, t("laboratory.errors.generic")));
      return;
    }
    setError(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-semibold text-teal-700">{order.orderNumber}</span>
          <Badge variant={order.status === "CANCELLED" ? "default" : "info"}>
            {t(LAB_ORDER_STATUS_I18N[order.status])}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && isLabOrderEditable(order.status) && (
            <Link href={`/lab/orders/${order.id}/edit`}>
              <Button type="button" variant="secondary">{t("consultation.actions.editWorkspace")}</Button>
            </Link>
          )}
          {canConfirm && isLabOrderEditable(order.status) && (
            <Button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => handleResult(await confirmLabOrderAction(order.id)))
              }
            >
              {t("laboratory.actions.confirm")}
            </Button>
          )}
          {canCollect && ["CONFIRMED", "PARTIALLY_COLLECTED"].includes(order.status) && (
            <Link href={`/lab/orders/${order.id}/collect`}>
              <Button type="button" variant="secondary">{t("laboratory.actions.collect")}</Button>
            </Link>
          )}
          <Link href="/lab/orders">
            <Button type="button" variant="ghost">{t("laboratory.actions.backToList")}</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {canCancel && order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
        <Card>
          <CardBody className="space-y-3">
            <Textarea
              label={t("laboratory.fields.cancellationReason")}
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              rows={2}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                startTransition(async () => handleResult(await cancelLabOrderAction(order.id, cancelReason)))
              }
            >
              {t("laboratory.actions.cancel")}
            </Button>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div><dt className="text-xs uppercase text-slate-500">{t("laboratory.fields.patient")}</dt><dd>{order.patient.fullName} ({order.patient.patientNumber})</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("laboratory.fields.doctor")}</dt><dd>{order.doctor?.doctorName ?? "—"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("laboratory.fields.branch")}</dt><dd>{order.branch.name}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("laboratory.fields.source")}</dt><dd>{t(SOURCE_KEYS[order.orderSource])}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("laboratory.fields.priority")}</dt><dd>{order.priority}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("laboratory.fields.orderedAt")}</dt><dd>{new Date(order.orderedAt).toLocaleString()}</dd></div>
        </CardBody>
      </Card>

      {order.clinicalNote && (
        <Card>
          <CardBody className="text-sm">
            <p className="text-xs uppercase text-slate-500">{t("laboratory.fields.clinicalNote")}</p>
            <p className="mt-1">{order.clinicalNote}</p>
          </CardBody>
        </Card>
      )}

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("laboratory.sections.tests")}</h2>
        </div>
        <CardBody className="space-y-2 text-sm">
          {order.tests.map((test, index) => (
            <div key={test.id}>
              <p className="font-medium">{index + 1}. {test.testName}</p>
              {test.specimenRequirementSnapshot && (
                <p className="text-slate-500">{test.specimenRequirementSnapshot}</p>
              )}
            </div>
          ))}
        </CardBody>
      </Card>

      {order.samples.length > 0 && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("laboratory.sections.samples")}</h2>
          </div>
          <CardBody className="space-y-3 text-sm">
            {order.samples.map((sample) => (
              <div key={sample.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3">
                <div>
                  <p className="font-mono font-medium text-teal-700">{sample.accessionNumber}</p>
                  <p className="text-slate-500">
                    {[sample.sampleType?.sampleType, sample.sampleContainer?.containerType].filter(Boolean).join(" / ") || "—"}
                  </p>
                </div>
                <Link href={`/lab/samples/${sample.id}`}>
                  <Button type="button" variant="secondary">{t("laboratory.actions.viewSample")}</Button>
                </Link>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
