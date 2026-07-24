"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { startConsultationAction } from "@/app/actions/tenant-consultations";
import { Badge, Button, Card, CardBody } from "@/components/ui";
import {
  APPOINTMENT_STATUS_I18N_KEYS,
} from "@/lib/appointment/constants";
import type { AppointmentStatus } from "@/generated/prisma/client";
import { useI18n } from "@/lib/i18n/client";
import { PATIENT_GENDER_I18N_KEYS } from "@/lib/patient/constants";
import { formatPatientDisplayAge } from "@/lib/patient/normalize";

type WorklistRow = {
  appointment: {
    id: string;
    appointmentNumber: string;
    status: AppointmentStatus;
    queueToken: number | null;
    timeSlot: string | null;
    reasonForVisit: string | null;
    patient: {
      patientNumber: string;
      fullName: string;
      gender: keyof typeof PATIENT_GENDER_I18N_KEYS;
      dateOfBirth: Date | null;
      estimatedAge: number | null;
    };
    doctor: { doctorCode: string; doctorName: string };
    department: { name: string } | null;
    branch: { code: string; name: string };
  };
  encounter: {
    id: string;
    status: string;
    encounterNumber: string;
  } | null;
};

export function ConsultationWorklistPanel({
  rows,
  branchName,
  doctorName,
  doctorCode,
  departmentName,
  canStart,
}: {
  rows: WorklistRow[];
  branchName: string;
  doctorName?: string | null;
  doctorCode?: string | null;
  departmentName?: string | null;
  canStart: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const waiting = rows.filter((r) => r.appointment.status === "WAITING").length;
  const called = rows.filter((r) => r.appointment.status === "CALLED").length;
  const inConsult = rows.filter((r) => r.appointment.status === "IN_CONSULTATION").length;

  function handleStart(appointmentId: string) {
    startTransition(async () => {
      const result = await startConsultationAction(appointmentId);
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
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {doctorName && (
              <p className="text-sm font-semibold text-slate-900">{doctorName}</p>
            )}
            <p className="text-sm text-slate-500">
              {doctorCode ? `${doctorCode} · ` : ""}
              {departmentName ? `${t("consultation.fields.department")}: ${departmentName} · ` : ""}
              {branchName} · {t("consultation.worklist.today")}: {new Date().toLocaleDateString()}
            </p>
          </div>
          <Button type="button" variant="secondary" disabled={pending} onClick={() => router.refresh()}>
            Refresh
          </Button>
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardBody><p className="text-xs uppercase text-slate-500">{t("appointment.status.waiting")}</p><p className="text-2xl font-semibold">{waiting}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs uppercase text-slate-500">{t("appointment.status.called")}</p><p className="text-2xl font-semibold">{called}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs uppercase text-slate-500">{t("appointment.status.inConsultation")}</p><p className="text-2xl font-semibold">{inConsult}</p></CardBody></Card>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="px-4 py-3">{t("consultation.fields.queueToken")}</th>
                <th className="px-4 py-3">{t("consultation.fields.patient")}</th>
                <th className="px-4 py-3">{t("consultation.fields.ageSex")}</th>
                <th className="px-4 py-3">{t("consultation.fields.status")}</th>
                <th className="px-4 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ appointment, encounter }) => (
                <tr key={appointment.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-semibold">{appointment.queueToken ?? "—"}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{appointment.patient.fullName}</p>
                    <p className="text-xs text-slate-500">{appointment.patient.patientNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatPatientDisplayAge({ ...appointment.patient, ageAsOfDate: null })} / {t(PATIENT_GENDER_I18N_KEYS[appointment.patient.gender])}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="info">{t(APPOINTMENT_STATUS_I18N_KEYS[appointment.status])}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {encounter ? (
                        <Link href={`/consultations/${encounter.id}/edit`}>
                          <Button type="button">{t("consultation.actions.resume")}</Button>
                        </Link>
                      ) : canStart ? (
                        <Button
                          type="button"
                          disabled={pending}
                          onClick={() => handleStart(appointment.id)}
                        >
                          {t("consultation.actions.start")}
                        </Button>
                      ) : null}
                      <Link href={`/appointments/${appointment.id}`}>
                        <Button type="button" variant="ghost">{t("appointment.actions.view")}</Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-slate-500">{t("consultation.worklist.empty")}</div>
        )}
      </Card>
    </div>
  );
}
