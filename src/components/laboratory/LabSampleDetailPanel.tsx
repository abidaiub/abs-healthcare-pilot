"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { requestSampleRecollectionAction } from "@/app/actions/tenant-lab-orders";
import { Badge, Button, Card, CardBody } from "@/components/ui";
import type { LabSampleStatus } from "@/generated/prisma/client";
import { LAB_SAMPLE_STATUS_I18N } from "@/lib/laboratory/constants";
import { useI18n } from "@/lib/i18n/client";

export type LabSampleDetailData = {
  id: string;
  accessionNumber: string;
  barcodeValue: string;
  sampleStatus: LabSampleStatus;
  collectedAt: Date | null;
  receivedAt: Date | null;
  rejectedAt: Date | null;
  recollectionRequired: boolean;
  rejectionNote: string | null;
  labOrder: {
    id: string;
    orderNumber: string;
    patient: { patientNumber: string; fullName: string };
  };
  sampleType: { sampleType: string } | null;
  sampleContainer: { containerType: string } | null;
  rejectionReason: { displayName: string } | null;
  sampleTests: Array<{ labOrderTest: { testName: string } }>;
};

export function LabSampleDetailPanel({
  sample,
  canCollect,
}: {
  sample: LabSampleDetailData;
  canCollect: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-sm font-semibold text-teal-700">{sample.accessionNumber}</span>
        <Badge variant="info">{t(LAB_SAMPLE_STATUS_I18N[sample.sampleStatus])}</Badge>
      </div>

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div><dt className="text-xs uppercase text-slate-500">{t("laboratory.fields.patient")}</dt><dd>{sample.labOrder.patient.fullName}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("laboratory.fields.orderNumber")}</dt><dd>{sample.labOrder.orderNumber}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("laboratory.fields.barcode")}</dt><dd className="font-mono">{sample.barcodeValue}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("laboratory.fields.specimen")}</dt><dd>{[sample.sampleType?.sampleType, sample.sampleContainer?.containerType].filter(Boolean).join(" / ") || "—"}</dd></div>
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("laboratory.sections.tests")}</h2>
        </div>
        <CardBody className="space-y-2 text-sm">
          {sample.sampleTests.map((row, index) => (
            <p key={index}>{row.labOrderTest.testName}</p>
          ))}
        </CardBody>
      </Card>

      {sample.rejectionReason && (
        <Card>
          <CardBody className="text-sm">
            <p className="text-xs uppercase text-slate-500">{t("laboratory.fields.rejectionReason")}</p>
            <p className="mt-1">{sample.rejectionReason.displayName}</p>
            {sample.rejectionNote && <p className="mt-2 text-slate-600">{sample.rejectionNote}</p>}
          </CardBody>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {canCollect && sample.sampleStatus === "REJECTED" && sample.recollectionRequired && (
          <Button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await requestSampleRecollectionAction(sample.id);
                if (!result.ok) {
                  setError(t(`laboratory.errors.${result.errorCode}`, t("laboratory.errors.generic")));
                  return;
                }
                router.push(`/lab/samples/${result.sampleId}`);
              })
            }
          >
            {t("laboratory.actions.recollect")}
          </Button>
        )}
        <Link href={`/lab/orders/${sample.labOrder.id}`}>
          <Button type="button" variant="ghost">{t("laboratory.actions.viewOrder")}</Button>
        </Link>
      </div>
    </div>
  );
}
