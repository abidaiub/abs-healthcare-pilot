"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  callQueueAppointmentAction,
  completeAppointmentAction,
  recallQueueAppointmentAction,
  skipQueueAppointmentAction,
} from "@/app/actions/tenant-appointments";
import { startConsultationAction } from "@/app/actions/tenant-consultations";
import { Badge, Button, Card, CardBody } from "@/components/ui";
import { APPOINTMENT_STATUS_I18N_KEYS } from "@/lib/appointment/constants";
import type { QueueSummary } from "@/lib/appointment/queries";
import { useI18n } from "@/lib/i18n/client";

type QueueRow = {
  id: string;
  appointmentNumber: string;
  queueToken: number | null;
  status: keyof typeof APPOINTMENT_STATUS_I18N_KEYS;
  patient: { patientNumber: string; fullName: string; mobile: string | null };
};

export function QueueOperatorPanel({
  queueRows,
  summary,
  canOperate,
}: {
  queueRows: QueueRow[];
  summary: QueueSummary;
  canOperate: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; errorCode?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(t(`appointment.errors.${result.errorCode}`, t("appointment.errors.generic")));
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card><CardBody><p className="text-xs uppercase text-slate-500">{t("appointment.queue.waitingCount")}</p><p className="text-2xl font-semibold">{summary.waitingCount}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs uppercase text-slate-500">{t("appointment.queue.calledCount")}</p><p className="text-2xl font-semibold">{summary.calledCount}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs uppercase text-slate-500">{t("appointment.queue.inConsultationCount")}</p><p className="text-2xl font-semibold">{summary.inConsultationCount}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs uppercase text-slate-500">{t("appointment.queue.nextToken")}</p><p className="text-2xl font-semibold">{summary.nextToken ?? "—"}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs uppercase text-slate-500">{t("appointment.queue.currentToken")}</p><p className="text-2xl font-semibold">{summary.currentToken ?? "—"}</p></CardBody></Card>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-4 py-3">{t("appointment.fields.queueToken")}</th>
                <th className="px-4 py-3">{t("appointment.fields.patient")}</th>
                <th className="px-4 py-3">{t("appointment.fields.status")}</th>
                <th className="px-4 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queueRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-semibold">{row.queueToken ?? "—"}</td>
                  <td className="px-4 py-3">{row.patient.fullName} ({row.patient.patientNumber})</td>
                  <td className="px-4 py-3"><Badge variant="info">{t(APPOINTMENT_STATUS_I18N_KEYS[row.status])}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {canOperate && row.status === "WAITING" && (
                        <Button type="button" disabled={pending} onClick={() => run(() => callQueueAppointmentAction(row.id).then((r) => ({ ok: r.ok, errorCode: r.ok ? undefined : r.errorCode })))}>{t("appointment.actions.call")}</Button>
                      )}
                      {canOperate && (row.status === "WAITING" || row.status === "CALLED") && (
                        <Button type="button" variant="secondary" disabled={pending} onClick={() => run(() => skipQueueAppointmentAction(row.id).then((r) => ({ ok: r.ok, errorCode: r.ok ? undefined : r.errorCode })))}>{t("appointment.actions.skip")}</Button>
                      )}
                      {canOperate && row.status === "CALLED" && (
                        <>
                          <Button
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                const result = await startConsultationAction(row.id);
                                if (!result.ok) {
                                  setError(t(`consultation.errors.${result.errorCode}`, t("consultation.errors.generic")));
                                  return;
                                }
                                setError(null);
                                if (result.encounterId) {
                                  router.push(`/consultations/${result.encounterId}/edit`);
                                } else {
                                  router.refresh();
                                }
                              })
                            }
                          >
                            {t("appointment.actions.startConsultation")}
                          </Button>
                          <Button type="button" variant="secondary" disabled={pending} onClick={() => run(() => recallQueueAppointmentAction(row.id).then((r) => ({ ok: r.ok, errorCode: r.ok ? undefined : r.errorCode })))}>{t("appointment.actions.recall")}</Button>
                        </>
                      )}
                      {canOperate && row.status === "IN_CONSULTATION" && (
                        <Button type="button" disabled={pending} onClick={() => run(() => completeAppointmentAction(row.id).then((r) => ({ ok: r.ok, errorCode: r.ok ? undefined : r.errorCode })))}>{t("appointment.actions.complete")}</Button>
                      )}
                      <Link href={`/appointments/${row.id}`}><Button type="button" variant="ghost">{t("appointment.actions.view")}</Button></Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {queueRows.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-slate-500">{t("appointment.queue.noActiveQueue")}</div>
        )}
      </Card>
    </div>
  );
}
