"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  createAppointmentAction,
  searchPatientsForAppointmentAction,
  updateAppointmentAction,
} from "@/app/actions/tenant-appointments";
import { Badge, Button, Card, CardBody, Input, Select, Textarea } from "@/components/ui";
import {
  APPOINTMENT_TYPES,
  APPOINTMENT_TYPE_I18N_KEYS,
  TIME_SLOTS,
} from "@/lib/appointment/constants";
import { useI18n } from "@/lib/i18n/client";

type DoctorOption = {
  id: string;
  doctorCode: string;
  doctorName: string;
  specialty: string | null;
  departmentId: string | null;
  department: { id: string; name: string } | null;
};

type PatientOption = {
  id: string;
  patientNumber: string;
  fullName: string;
  mobile: string | null;
};

type AppointmentFormProps = {
  mode: "create" | "edit";
  appointmentId?: string;
  appointmentNumber?: string;
  branchLabel: string;
  doctors: DoctorOption[];
  bookedSlots: string[];
  initialPatient?: PatientOption | null;
  initialValues?: {
    appointmentType: string;
    appointmentDate: string;
    timeSlot: string;
    patientId: string;
    doctorId: string;
    reasonForVisit: string;
    notes: string;
  };
};

export function AppointmentForm({
  mode,
  appointmentId,
  appointmentNumber,
  branchLabel,
  doctors,
  bookedSlots,
  initialPatient,
  initialValues,
}: AppointmentFormProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [patientQuery, setPatientQuery] = useState(initialPatient?.fullName ?? "");
  const [patientResults, setPatientResults] = useState<PatientOption[]>(
    initialPatient ? [initialPatient] : [],
  );
  const [patientId, setPatientId] = useState(initialValues?.patientId ?? initialPatient?.id ?? "");
  const [appointmentType, setAppointmentType] = useState(
    initialValues?.appointmentType ?? "SCHEDULED",
  );
  const [appointmentDate, setAppointmentDate] = useState(
    initialValues?.appointmentDate ?? new Date().toISOString().slice(0, 10),
  );
  const [timeSlot, setTimeSlot] = useState(initialValues?.timeSlot ?? TIME_SLOTS[2]);
  const [doctorId, setDoctorId] = useState(initialValues?.doctorId ?? doctors[0]?.id ?? "");
  const [reasonForVisit, setReasonForVisit] = useState(initialValues?.reasonForVisit ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");

  const bookedSet = useMemo(() => new Set(bookedSlots), [bookedSlots]);

  function runPatientSearch(query: string) {
    startTransition(async () => {
      const results = await searchPatientsForAppointmentAction(query);
      setPatientResults(results);
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!patientId) {
      setError(t("appointment.messages.selectPatient"));
      return;
    }

    const formData = new FormData();
    formData.set("appointmentType", appointmentType);
    formData.set("appointmentDate", appointmentDate);
    formData.set("timeSlot", appointmentType === "SCHEDULED" ? timeSlot : "");
    formData.set("patientId", patientId);
    formData.set("doctorId", doctorId);
    formData.set("reasonForVisit", reasonForVisit);
    formData.set("notes", notes);
    formData.set("autoCheckIn", appointmentType === "WALK_IN" ? "true" : "false");

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createAppointmentAction(formData)
          : await updateAppointmentAction(appointmentId!, formData);

      if (!result.ok) {
        setError(t(`appointment.errors.${result.errorCode}`, t("appointment.errors.generic")));
        return;
      }

      setError(null);
      router.push(`/appointments/${result.appointmentId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <p className="text-sm text-slate-500">
            {t("appointment.messages.currentBranch")}: {branchLabel}
          </p>
          {appointmentNumber && (
            <p className="font-mono text-sm font-semibold text-teal-700">{appointmentNumber}</p>
          )}
          <Input
            label={t("appointment.fields.patientSearch")}
            value={patientQuery}
            onChange={(e) => {
              setPatientQuery(e.target.value);
              runPatientSearch(e.target.value);
            }}
            placeholder={t("appointment.fields.patientSearchPlaceholder")}
          />
          {patientResults.length > 0 && (
            <div className="space-y-2 rounded-lg border border-slate-200 p-3">
              {patientResults.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                    patientId === patient.id ? "bg-teal-50 text-teal-900" : "hover:bg-slate-50"
                  }`}
                  onClick={() => setPatientId(patient.id)}
                >
                  <span>
                    {patient.fullName} ({patient.patientNumber})
                  </span>
                  <span className="text-slate-500">{patient.mobile ?? "—"}</span>
                </button>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t("appointment.fields.appointmentType")}
            value={appointmentType}
            onChange={(e) => setAppointmentType(e.target.value)}
          >
            {APPOINTMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(APPOINTMENT_TYPE_I18N_KEYS[type])}
              </option>
            ))}
          </Select>
          <Input
            label={t("appointment.fields.appointmentDate")}
            type="date"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            required
          />
          <Select
            label={t("appointment.fields.doctor")}
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
          >
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.doctorCode} — {doctor.doctorName}
              </option>
            ))}
          </Select>
          {appointmentType === "SCHEDULED" && (
            <Select
              label={t("appointment.fields.timeSlot")}
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot} disabled={bookedSet.has(slot)}>
                  {slot}
                  {bookedSet.has(slot) ? " (booked)" : ""}
                </option>
              ))}
            </Select>
          )}
          <Input
            label={t("appointment.fields.reasonForVisit")}
            value={reasonForVisit}
            onChange={(e) => setReasonForVisit(e.target.value)}
          />
          <div className="sm:col-span-2">
            <Textarea
              label={t("appointment.fields.notes")}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <Link href={appointmentId ? `/appointments/${appointmentId}` : "/appointments"}>
          <Button type="button" variant="secondary">
            {t("appointment.actions.cancel")}
          </Button>
        </Link>
        <Button type="submit" disabled={pending}>
          {t("appointment.actions.save")}
        </Button>
      </div>
    </form>
  );
}
