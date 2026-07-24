"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { markSampleReadyForResultAction } from "@/app/actions/tenant-lab-orders";
import { Badge, Button, Card, CardBody } from "@/components/ui";
import type { LabSampleStatus } from "@/generated/prisma/client";
import { LAB_SAMPLE_STATUS_I18N } from "@/lib/laboratory/constants";
import { useI18n } from "@/lib/i18n/client";

export type LabProcessingSample = {
  id: string;
  accessionNumber: string;
  sampleStatus: LabSampleStatus;
  receivedAt: Date | null;
  labOrder: {
    orderNumber: string;
    patient: { patientNumber: string; fullName: string };
  };
  sampleTests: Array<{
    labOrderTest: { testName: string; department: { name: string } | null };
  }>;
};

export function LabProcessingPanel({
  samples,
  canEdit,
}: {
  samples: LabProcessingSample[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!samples.length) {
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
      {samples.map((sample) => (
        <Card key={sample.id}>
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono font-semibold text-teal-700">{sample.accessionNumber}</p>
                <p className="text-sm text-slate-600">
                  {sample.labOrder.patient.fullName} · {sample.labOrder.orderNumber}
                </p>
              </div>
              <Badge variant="info">{t(LAB_SAMPLE_STATUS_I18N[sample.sampleStatus])}</Badge>
            </div>
            <div className="space-y-1 text-sm">
              {sample.sampleTests.map((row, index) => (
                <p key={index}>
                  {row.labOrderTest.testName}
                  {row.labOrderTest.department?.name ? ` · ${row.labOrderTest.department.name}` : ""}
                </p>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await markSampleReadyForResultAction(sample.id);
                      if (!result.ok) {
                        setError(t(`laboratory.errors.${result.errorCode}`, t("laboratory.errors.generic")));
                        return;
                      }
                      setError(null);
                      router.refresh();
                    })
                  }
                >
                  {t("laboratory.actions.readyForResult")}
                </Button>
              )}
              <Link href={`/lab/samples/${sample.id}`}>
                <Button type="button" variant="ghost">{t("laboratory.actions.viewSample")}</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
