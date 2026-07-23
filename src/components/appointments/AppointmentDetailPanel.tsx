"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  cancelAppointmentAction,
  checkInAppointmentAction,
  markNoShowAppointmentAction,
} from "@/app/actions/tenant-appointments";
import { Badge, Button, Card, CardBody } from "@/components/ui";
import {
  APPOINTMENT_STATUS_I18N_KEYS,
  APPOINTMENT_TYPE_I18N_KEYS,
} from "@/lib/appointment/constants";
import { useI18n } from "@/lib/i18n/client";

export function AppointmentDetailPanel({
  appointment,
  canEdit,
}: {
  appointment: {
    id: string;
    appointmentNumber: string;
    appointmentType: keyof typeof APPOINTMENT_TYPE_I18N_KEYS;
    status: keyof typeof APPOINTMENT_STATUS_I18N_KEYS;
    appointmentDate: Date;
    timeSlot: string | null;
    queueToken: number | null;
    reasonForVisit: string | null;
    notes: string | null;
    patient: { patientNumber: string; fullName: string; mobile: string | null };
    doctor: { doctorCode: string; doctorName: string; specialty: string | null };
    branch: { code: string; name: string };
    department: { name: string } | null;
  };
  canEdit: boolean;
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-semibold text-teal-700">{appointment.appointmentNumber}</span>
          <Badge variant="info">{t(APPOINTMENT_STATUS_I18N_KEYS[appointment.status])}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Link href={`/appointments/${appointment.id}/edit`}>
              <Button type="button" variant="secondary">{t("appointment.actions.edit")}</Button>
            </Link>
          )}
          {canEdit && appointment.status === "SCHEDULED" && (
            <Button type="button" disabled={pending} onClick={() => run(() => checkInAppointmentAction(appointment.id).then((r) => ({ ok: r.ok, errorCode: r.ok ? undefined : r.errorCode })))}>
              {t("appointment.actions.checkIn")}
            </Button>
          )}
          {canEdit && !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(appointment.status) && (
            <>
              <Button type="button" variant="secondary" disabled={pending} onClick={() => run(() => cancelAppointmentAction(appointment.id).then((r) => ({ ok: r.ok, errorCode: r.ok ? undefined : r.errorCode })))}>
                {t("appointment.actions.cancelAppointment")}
              </Button>
              <Button type="button" variant="secondary" disabled={pending} onClick={() => run(() => markNoShowAppointmentAction(appointment.id).then((r) => ({ ok: r.ok, errorCode: r.ok ? undefined : r.errorCode })))}>
                {t("appointment.actions.markNoShow")}
              </Button>
            </>
          )}
          <Link href="/appointments/queue/operator">
            <Button type="button">{t("appointment.actions.openOperator")}</Button>
          </Link>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div><dt className="text-xs uppercase text-slate-500">{t("appointment.fields.patient")}</dt><dd>{appointment.patient.fullName} ({appointment.patient.patientNumber})</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("appointment.fields.doctor")}</dt><dd>{appointment.doctor.doctorName}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("appointment.fields.appointmentType")}</dt><dd>{t(APPOINTMENT_TYPE_I18N_KEYS[appointment.appointmentType])}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("appointment.fields.appointmentDate")}</dt><dd>{new Date(appointment.appointmentDate).toLocaleDateString()}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("appointment.fields.timeSlot")}</dt><dd>{appointment.timeSlot ?? "—"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("appointment.fields.queueToken")}</dt><dd>{appointment.queueToken ?? "—"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("appointment.fields.branch")}</dt><dd>{appointment.branch.code} — {appointment.branch.name}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("appointment.fields.department")}</dt><dd>{appointment.department?.name ?? "—"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("appointment.fields.reasonForVisit")}</dt><dd>{appointment.reasonForVisit ?? "—"}</dd></div>
        </CardBody>
      </Card>
      {appointment.notes && (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-700">{appointment.notes}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
