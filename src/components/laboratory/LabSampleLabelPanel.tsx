"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { printSampleLabelAction } from "@/app/actions/tenant-lab-orders";
import { Button, Card, CardBody } from "@/components/ui";
import { useI18n } from "@/lib/i18n/client";

export type LabSampleLabelData = {
  id: string;
  accessionNumber: string;
  barcodeValue: string;
  collectedAt: string | null;
  tenantName: string;
  branchName: string;
  branchCode: string;
  priority: string;
  departments: string[];
  labOrder: {
    orderNumber: string;
    patient: { patientNumber: string; fullName: string };
  };
  sampleType: { sampleType: string } | null;
  sampleContainer: { containerType: string } | null;
};

export function LabSampleLabelPanel({
  sample,
  codes,
  canPrint,
}: {
  sample: LabSampleLabelData;
  codes: { barcodeSvgDataUrl: string; qrSvgDataUrl: string };
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

  const container =
    [sample.sampleType?.sampleType, sample.sampleContainer?.containerType]
      .filter(Boolean)
      .join(" / ") || "—";

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div className="mx-auto w-full max-w-sm rounded-lg border border-dashed border-slate-300 p-4 print:border-black">
            <div className="border-b border-slate-200 pb-2 text-center print:border-black">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                {sample.tenantName}
              </p>
              <p className="text-[10px] text-slate-500">
                {sample.branchName} ({sample.branchCode})
              </p>
            </div>

            <div className="mt-2 space-y-0.5 text-[11px] text-slate-700">
              <p className="font-semibold text-slate-900">{sample.labOrder.patient.fullName}</p>
              <p>
                {t("laboratory.label.patientId", "Patient ID")}:{" "}
                {sample.labOrder.patient.patientNumber}
              </p>
              <p>
                {t("laboratory.label.orderNumber", "Order")}: {sample.labOrder.orderNumber}
              </p>
              <p>
                {t("laboratory.label.sampleNumber", "Sample")}: {sample.accessionNumber}
              </p>
              <p>
                {t("laboratory.label.container", "Container")}: {container}
              </p>
              <p>
                {t("laboratory.label.collectedAt", "Collected")}: {sample.collectedAt ?? "—"}
              </p>
              <p>
                {t("laboratory.label.department", "Department")}:{" "}
                {sample.departments.length ? sample.departments.join(", ") : "—"}
              </p>
              <p>
                {t("laboratory.label.priority", "Priority")}: {sample.priority}
              </p>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Image
                  src={codes.barcodeSvgDataUrl}
                  alt={sample.barcodeValue}
                  width={220}
                  height={48}
                  unoptimized
                  className="h-12 w-full object-contain"
                />
                <p className="mt-1 text-center font-mono text-[11px] tracking-[0.2em]">
                  {sample.barcodeValue}
                </p>
              </div>
              <Image
                src={codes.qrSvgDataUrl}
                alt={sample.barcodeValue}
                width={64}
                height={64}
                unoptimized
                className="h-16 w-16"
              />
            </div>
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
