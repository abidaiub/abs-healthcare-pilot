"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reopenConsultationAction } from "@/app/actions/tenant-consultations";
import { Badge, Button, Card, CardBody, Textarea } from "@/components/ui";
import type { ClinicalEncounterStatus, DiagnosisType } from "@/lib/consultation/types";
import { ENCOUNTER_STATUS_I18N_KEYS, isEncounterEditable } from "@/lib/consultation/constants";
import { useI18n } from "@/lib/i18n/client";
import { PATIENT_GENDER_I18N_KEYS } from "@/lib/patient/constants";
import { formatPatientDisplayAge } from "@/lib/patient/normalize";

type DecimalLike = { toString(): string } | null;

function dec(value: DecimalLike | undefined): string {
  if (value == null) return "—";
  const n = Number(value.toString());
  return Number.isNaN(n) ? "—" : String(n);
}

type EncounterDetail = {
  id: string;
  encounterNumber: string;
  status: ClinicalEncounterStatus;
  consultationDate: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  chiefComplaint: string | null;
  historyOfPresentIllness: string | null;
  pastMedicalHistory: string | null;
  examinationNotes: string | null;
  clinicalNotes: string | null;
  generalAdvice: string | null;
  followUpDate: Date | null;
  followUpIntervalDays: number | null;
  followUpInstructions: string | null;
  patient: {
    patientNumber: string;
    fullName: string;
    gender: keyof typeof PATIENT_GENDER_I18N_KEYS;
    dateOfBirth: Date | null;
    estimatedAge: number | null;
    mobile: string | null;
  };
  doctor: { doctorCode: string; doctorName: string; specialty: string | null; degree: string | null };
  branch: { code: string; name: string };
  department: { name: string } | null;
  appointment: { appointmentNumber: string; queueToken: number | null } | null;
  vitals: {
    heightCm: DecimalLike;
    weightKg: DecimalLike;
    temperatureC: DecimalLike;
    pulseBpm: number | null;
    systolicBp: number | null;
    diastolicBp: number | null;
    spo2Percent: number | null;
    bmi: DecimalLike;
  } | null;
  diagnoses: {
    diagnosisType: DiagnosisType;
    diagnosisText: string;
    icdCode: string | null;
  }[];
  medicines: {
    medicineText: string;
    strength: string | null;
    dose: string | null;
    frequency: string | null;
    duration: string | null;
    instructions: string | null;
  }[];
  investigations: {
    investigationText: string;
    priority: string | null;
    instructions: string | null;
  }[];
};

export function ConsultationDetailPanel({
  encounter,
  canPrint,
  canReopen,
}: {
  encounter: EncounterDetail;
  canPrint: boolean;
  canReopen: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState("");
  const [pending, startTransition] = useTransition();
  const editable = isEncounterEditable(encounter.status);

  function reopen() {
    startTransition(async () => {
      const result = await reopenConsultationAction(encounter.id, reopenReason);
      if (!result.ok) {
        setError(t(`consultation.errors.${result.errorCode}`, t("consultation.errors.generic")));
        return;
      }
      setError(null);
      router.push(`/consultations/${encounter.id}/edit`);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-semibold text-teal-700">{encounter.encounterNumber}</span>
          <Badge variant={encounter.status === "COMPLETED" ? "success" : "info"}>
            {t(ENCOUNTER_STATUS_I18N_KEYS[encounter.status])}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && (
            <Link href={`/consultations/${encounter.id}/edit`}>
              <Button type="button">{t("consultation.actions.editWorkspace")}</Button>
            </Link>
          )}
          {canPrint && (
            <Link href={`/consultations/${encounter.id}/print`}>
              <Button type="button" variant="secondary">{t("consultation.actions.print")}</Button>
            </Link>
          )}
          <Link href="/consultations">
            <Button type="button" variant="ghost">{t("consultation.actions.backToList")}</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {canReopen && encounter.status === "COMPLETED" && (
        <Card>
          <CardBody className="space-y-3">
            <Textarea
              label={t("consultation.fields.reopenReason")}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              rows={2}
            />
            <Button type="button" disabled={pending} onClick={reopen}>
              {t("consultation.actions.reopen")}
            </Button>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div><dt className="text-xs uppercase text-slate-500">{t("consultation.fields.patient")}</dt><dd>{encounter.patient.fullName} ({encounter.patient.patientNumber})</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("consultation.fields.ageSex")}</dt><dd>{formatPatientDisplayAge({ ...encounter.patient, ageAsOfDate: null })} / {t(PATIENT_GENDER_I18N_KEYS[encounter.patient.gender])}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("consultation.fields.doctor")}</dt><dd>{encounter.doctor.doctorName}{encounter.doctor.degree ? `, ${encounter.doctor.degree}` : ""}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("consultation.fields.consultationDate")}</dt><dd>{new Date(encounter.consultationDate).toLocaleDateString()}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("consultation.fields.startedAt")}</dt><dd>{encounter.startedAt ? new Date(encounter.startedAt).toLocaleString() : "—"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("consultation.fields.completedAt")}</dt><dd>{encounter.completedAt ? new Date(encounter.completedAt).toLocaleString() : "—"}</dd></div>
        </CardBody>
      </Card>

      {(encounter.chiefComplaint || encounter.historyOfPresentIllness || encounter.examinationNotes) && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("consultation.sections.complaintHistory")}</h2>
          </div>
          <CardBody className="space-y-3 text-sm">
            {encounter.chiefComplaint && <div><p className="text-xs uppercase text-slate-500">{t("consultation.fields.chiefComplaint")}</p><p>{encounter.chiefComplaint}</p></div>}
            {encounter.historyOfPresentIllness && <div><p className="text-xs uppercase text-slate-500">{t("consultation.fields.historyOfPresentIllness")}</p><p>{encounter.historyOfPresentIllness}</p></div>}
            {encounter.examinationNotes && <div><p className="text-xs uppercase text-slate-500">{t("consultation.fields.examinationNotes")}</p><p>{encounter.examinationNotes}</p></div>}
            {encounter.clinicalNotes && <div><p className="text-xs uppercase text-slate-500">{t("consultation.fields.clinicalNotes")}</p><p>{encounter.clinicalNotes}</p></div>}
            {encounter.generalAdvice && <div><p className="text-xs uppercase text-slate-500">{t("consultation.fields.generalAdvice")}</p><p>{encounter.generalAdvice}</p></div>}
          </CardBody>
        </Card>
      )}

      {encounter.vitals && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("consultation.sections.vitals")}</h2>
          </div>
          <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div><dt className="text-xs uppercase text-slate-500">{t("consultation.fields.heightCm")}</dt><dd>{dec(encounter.vitals.heightCm)}</dd></div>
            <div><dt className="text-xs uppercase text-slate-500">{t("consultation.fields.weightKg")}</dt><dd>{dec(encounter.vitals.weightKg)}</dd></div>
            <div><dt className="text-xs uppercase text-slate-500">{t("consultation.fields.temperatureC")}</dt><dd>{dec(encounter.vitals.temperatureC)}</dd></div>
            <div><dt className="text-xs uppercase text-slate-500">{t("consultation.fields.pulseBpm")}</dt><dd>{encounter.vitals.pulseBpm ?? "—"}</dd></div>
            <div><dt className="text-xs uppercase text-slate-500">BP</dt><dd>{encounter.vitals.systolicBp ?? "—"}/{encounter.vitals.diastolicBp ?? "—"}</dd></div>
            <div><dt className="text-xs uppercase text-slate-500">{t("consultation.fields.spo2Percent")}</dt><dd>{encounter.vitals.spo2Percent ?? "—"}</dd></div>
            <div><dt className="text-xs uppercase text-slate-500">{t("consultation.fields.bmi")}</dt><dd>{dec(encounter.vitals.bmi)}</dd></div>
          </CardBody>
        </Card>
      )}

      {encounter.diagnoses.length > 0 && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("consultation.sections.diagnosis")}</h2>
          </div>
          <CardBody className="space-y-2 text-sm">
            {encounter.diagnoses.map((row, index) => (
              <p key={index}>
                {row.diagnosisText}
                {row.icdCode ? ` (${row.icdCode})` : ""}
                {" — "}
                {t(`consultation.diagnosisType.${row.diagnosisType.toLowerCase()}`)}
              </p>
            ))}
          </CardBody>
        </Card>
      )}

      {encounter.medicines.length > 0 && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("consultation.sections.medicines")}</h2>
          </div>
          <CardBody className="space-y-3 text-sm">
            {encounter.medicines.map((row, index) => (
              <div key={index}>
                <p className="font-medium">{index + 1}. {row.medicineText}{row.strength ? ` ${row.strength}` : ""}</p>
                <p className="text-slate-600">{[row.dose, row.frequency, row.duration].filter(Boolean).join(" · ")}</p>
                {row.instructions && <p className="text-slate-500">{row.instructions}</p>}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {encounter.investigations.length > 0 && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("consultation.sections.investigations")}</h2>
          </div>
          <CardBody className="space-y-2 text-sm">
            {encounter.investigations.map((row, index) => (
              <p key={index}>{row.investigationText}{row.priority ? ` (${row.priority})` : ""}</p>
            ))}
          </CardBody>
        </Card>
      )}

      {(encounter.followUpDate || encounter.followUpIntervalDays || encounter.followUpInstructions) && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("consultation.sections.followUp")}</h2>
          </div>
          <CardBody className="text-sm space-y-2">
            {encounter.followUpDate && <p>{new Date(encounter.followUpDate).toLocaleDateString()}</p>}
            {encounter.followUpIntervalDays && <p>{encounter.followUpIntervalDays} days</p>}
            {encounter.followUpInstructions && <p>{encounter.followUpInstructions}</p>}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
