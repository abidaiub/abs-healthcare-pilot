"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createLabResultDraftAction,
  type LabResultActionResult,
} from "@/app/actions/tenant-lab-results";
import { Badge, Button, Card, CardBody } from "@/components/ui";
import type { LabOrderTestStatus, LabResultStatus } from "@/generated/prisma/client";
import { LAB_RESULT_STATUS_I18N } from "@/lib/laboratory-result/constants";
import { useI18n } from "@/lib/i18n/client";

const TEST_STATUS_I18N: Partial<Record<LabOrderTestStatus, string>> = {
  READY_FOR_RESULT: "laboratoryResult.testStatus.readyForResult",
  RESULT_IN_PROGRESS: "laboratoryResult.testStatus.resultInProgress",
  READY_FOR_VERIFICATION: "laboratoryResult.testStatus.readyForVerification",
};

export type ResultEntryWorklistRow = {
  id: string;
  testName: string;
  status: LabOrderTestStatus;
  department: { name: string } | null;
  labOrder: {
    orderNumber: string;
    patient: { patientNumber: string; fullName: string };
    branch: { code: string; name: string };
  };
  labResult: { id: string; status: LabResultStatus; enteredAt: Date | null } | null;
  sampleTests: Array<{
    labSample: {
      accessionNumber: string;
      sampleStatus: string;
      receivedAt: Date | null;
    };
  }>;
};

export function ResultEntryWorklistPanel({
  rows,
  canCreate,
}: {
  rows: ResultEntryWorklistRow[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleResult(result: LabResultActionResult, resultId?: string) {
    if (!result.ok) {
      setError(t(`laboratoryResult.errors.${result.errorCode}`, t("laboratoryResult.errors.generic")));
      return;
    }
    setError(null);
    if (resultId ?? result.resultId) {
      router.push(`/lab/result-entry/${result.resultId}/edit`);
      return;
    }
    router.refresh();
  }

  if (!rows.length) {
    return (
      <Card>
        <CardBody className="text-sm text-slate-600">{t("laboratoryResult.worklist.empty")}</CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {rows.map((row) => {
        const sample = row.sampleTests[0]?.labSample;
        const resultStatus = row.labResult?.status;
        return (
          <Card key={row.id}>
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{row.testName}</p>
                  <p className="text-sm text-slate-600">
                    {row.labOrder.patient.fullName} · {row.labOrder.orderNumber}
                    {sample ? ` · ${sample.accessionNumber}` : ""}
                  </p>
                  {row.department?.name ? (
                    <p className="text-xs text-slate-500">{row.department.name}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="info">{t(TEST_STATUS_I18N[row.status] ?? "laboratoryResult.testStatus.unknown")}</Badge>
                  {resultStatus ? (
                    <Badge variant="default">{t(LAB_RESULT_STATUS_I18N[resultStatus])}</Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {row.labResult ? (
                  <>
                    <Link href={`/lab/result-entry/${row.labResult.id}`}>
                      <Button type="button" variant="ghost">
                        {t("laboratoryResult.actions.viewResult")}
                      </Button>
                    </Link>
                    {canCreate && (resultStatus === "DRAFT" || resultStatus === "IN_PROGRESS" || resultStatus === "ENTRY_COMPLETED") ? (
                      <Link href={`/lab/result-entry/${row.labResult.id}/edit`}>
                        <Button type="button">{t("laboratoryResult.actions.continueEntry")}</Button>
                      </Link>
                    ) : null}
                  </>
                ) : canCreate && row.status === "READY_FOR_RESULT" ? (
                  <Button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await createLabResultDraftAction(row.id);
                        handleResult(result);
                      })
                    }
                  >
                    {t("laboratoryResult.actions.startEntry")}
                  </Button>
                ) : null}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
