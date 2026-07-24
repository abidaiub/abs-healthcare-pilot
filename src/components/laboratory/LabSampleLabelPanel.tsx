"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { printSampleLabelAction } from "@/app/actions/tenant-lab-orders";
import { Button, Card, CardBody } from "@/components/ui";
import { useI18n } from "@/lib/i18n/client";

export type LabSampleLabelData = {
  id: string;
  accessionNumber: string;
  barcodeValue: string;
  labOrder: {
    orderNumber: string;
    patient: { patientNumber: string; fullName: string };
  };
  sampleType: { sampleType: string } | null;
  sampleContainer: { containerType: string } | null;
};

export function LabSampleLabelPanel({
  sample,
  canPrint,
}: {
  sample: LabSampleLabelData;
  canPrint: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  function printLabel(reprint = false) {
    startTransition(async () => {
      await printSampleLabelAction(sample.id, reprint);
      window.print();
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center print:border-black">
            <p className="text-xs uppercase tracking-wide text-slate-500">{sample.labOrder.patient.fullName}</p>
            <p className="mt-2 font-mono text-2xl font-bold text-teal-700">{sample.accessionNumber}</p>
            <p className="mt-1 text-sm text-slate-600">{sample.labOrder.orderNumber}</p>
            <p className="mt-3 text-xs text-slate-500">
              {[sample.sampleType?.sampleType, sample.sampleContainer?.containerType].filter(Boolean).join(" / ") || "—"}
            </p>
            <p className="mt-4 font-mono text-lg tracking-[0.3em]">{sample.barcodeValue}</p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            {canPrint && (
              <>
                <Button type="button" disabled={pending} onClick={() => printLabel(false)}>
                  {t("laboratory.actions.printLabel")}
                </Button>
                <Button type="button" variant="secondary" disabled={pending} onClick={() => printLabel(true)}>
                  {t("laboratory.actions.reprintLabel")}
                </Button>
              </>
            )}
            <Link href={`/lab/samples/${sample.id}`}>
              <Button type="button" variant="ghost">{t("laboratory.actions.viewSample")}</Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
