"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  listRejectionReasonsAction,
  receiveLabSampleAction,
  rejectLabSampleAction,
} from "@/app/actions/tenant-lab-orders";
import { Badge, Button, Card, CardBody, Select, Textarea } from "@/components/ui";
import type { LabSampleStatus } from "@/generated/prisma/client";
import { LAB_SAMPLE_STATUS_I18N } from "@/lib/laboratory/constants";
import { useI18n } from "@/lib/i18n/client";

export type LabReceiptSample = {
  id: string;
  accessionNumber: string;
  sampleStatus: LabSampleStatus;
  collectedAt: Date | null;
  sampleType: { sampleType: string } | null;
  labOrder: {
    orderNumber: string;
    patient: { patientNumber: string; fullName: string };
  };
};

type RejectionReason = Awaited<ReturnType<typeof listRejectionReasonsAction>>[number];

export function LabReceiptPanel({
  samples,
  rejectionReasons,
  canEdit,
}: {
  samples: LabReceiptSample[];
  rejectionReasons: RejectionReason[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [rejectionReasonId, setRejectionReasonId] = useState("");
  const [rejectionNote, setRejectionNote] = useState("");
  const [receiptNote, setReceiptNote] = useState("");
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
                <p className="text-xs text-slate-500">{sample.sampleType?.sampleType ?? "—"}</p>
              </div>
              <Badge variant="warning">{t(LAB_SAMPLE_STATUS_I18N[sample.sampleStatus])}</Badge>
            </div>
            {canEdit && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await receiveLabSampleAction(sample.id, receiptNote);
                      if (!result.ok) {
                        setError(t(`laboratory.errors.${result.errorCode}`, t("laboratory.errors.generic")));
                        return;
                      }
                      setError(null);
                      router.refresh();
                    })
                  }
                >
                  {t("laboratory.actions.receive")}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setActiveSampleId(sample.id)}>
                  {t("laboratory.actions.reject")}
                </Button>
                <Link href={`/lab/samples/${sample.id}`}>
                  <Button type="button" variant="ghost">{t("laboratory.actions.viewSample")}</Button>
                </Link>
              </div>
            )}
            {activeSampleId === sample.id && (
              <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <Select
                  label={t("laboratory.fields.rejectionReason")}
                  value={rejectionReasonId}
                  onChange={(event) => setRejectionReasonId(event.target.value)}
                >
                  <option value="">—</option>
                  {rejectionReasons.map((reason) => (
                    <option key={reason.id} value={reason.id}>{reason.displayName}</option>
                  ))}
                </Select>
                <Textarea
                  label={t("laboratory.fields.rejectionNote")}
                  value={rejectionNote}
                  onChange={(event) => setRejectionNote(event.target.value)}
                  rows={2}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await rejectLabSampleAction(sample.id, rejectionReasonId, rejectionNote);
                      if (!result.ok) {
                        setError(t(`laboratory.errors.${result.errorCode}`, t("laboratory.errors.generic")));
                        return;
                      }
                      setActiveSampleId(null);
                      setRejectionReasonId("");
                      setRejectionNote("");
                      router.refresh();
                    })
                  }
                >
                  {t("laboratory.actions.reject")}
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      ))}
      <Card>
        <CardBody>
          <Textarea
            label={t("laboratory.fields.receiptNote")}
            value={receiptNote}
            onChange={(event) => setReceiptNote(event.target.value)}
            rows={2}
          />
        </CardBody>
      </Card>
    </div>
  );
}
