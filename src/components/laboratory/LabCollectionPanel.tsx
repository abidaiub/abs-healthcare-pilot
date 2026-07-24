"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { collectLabSampleAction } from "@/app/actions/tenant-lab-orders";
import { Badge, Button, Card, CardBody } from "@/components/ui";
import type { LabOrderStatus, LabSampleStatus } from "@/generated/prisma/client";
import { LAB_ORDER_STATUS_I18N, LAB_SAMPLE_STATUS_I18N } from "@/lib/laboratory/constants";
import { useI18n } from "@/lib/i18n/client";

export type LabCollectionOrder = {
  id: string;
  orderNumber: string;
  status: LabOrderStatus;
  orderedAt: Date;
  patient: { patientNumber: string; fullName: string };
  samples: Array<{
    id: string;
    accessionNumber: string;
    sampleStatus: LabSampleStatus;
    sampleType: { sampleType: string } | null;
  }>;
};

export function LabCollectionPanel({
  orders,
  canCollect,
}: {
  orders: LabCollectionOrder[];
  canCollect: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!orders.length) {
    return (
      <Card>
        <CardBody className="text-sm text-slate-600">{t("laboratory.worklist.empty")}</CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {orders.map((order) => (
        <Card key={order.id}>
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono font-semibold text-teal-700">{order.orderNumber}</p>
                <p className="text-sm text-slate-600">
                  {order.patient.fullName} ({order.patient.patientNumber})
                </p>
              </div>
              <Badge variant="info">{t(LAB_ORDER_STATUS_I18N[order.status])}</Badge>
            </div>
            <div className="space-y-3">
              {order.samples
                .filter((sample) => sample.sampleStatus === "PENDING_COLLECTION")
                .map((sample) => (
                  <div key={sample.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3">
                    <div>
                      <p className="font-mono text-sm">{sample.accessionNumber}</p>
                      <p className="text-xs text-slate-500">{sample.sampleType?.sampleType ?? "—"}</p>
                      <Badge variant="warning">{t(LAB_SAMPLE_STATUS_I18N[sample.sampleStatus])}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canCollect && (
                        <Button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              const result = await collectLabSampleAction(sample.id);
                              if (!result.ok) {
                                setError(t(`laboratory.errors.${result.errorCode}`, t("laboratory.errors.generic")));
                                return;
                              }
                              setError(null);
                              router.refresh();
                            })
                          }
                        >
                          {t("laboratory.actions.collect")}
                        </Button>
                      )}
                      <Link href={`/lab/samples/${sample.id}/label`}>
                        <Button type="button" variant="secondary">{t("laboratory.actions.printLabel")}</Button>
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
            <Link href={`/lab/orders/${order.id}/collect`}>
              <Button type="button" variant="ghost">{t("laboratory.actions.viewOrder")}</Button>
            </Link>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
