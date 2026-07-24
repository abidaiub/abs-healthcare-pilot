"use client";

import { useTransition } from "react";
import { recordConsultationPrintedAction } from "@/app/actions/tenant-consultations";
import { Button } from "@/components/ui";
import type { DiagnosisType } from "@/lib/consultation/types";
import { useI18n } from "@/lib/i18n/client";
import { PATIENT_GENDER_I18N_KEYS } from "@/lib/patient/constants";
import { formatPatientDisplayAge } from "@/lib/patient/normalize";

type DecimalLike = { toString(): string } | null;

function dec(value: DecimalLike | undefined): string {
  if (value == null) return "—";
  const n = Number(value.toString());
  return Number.isNaN(n) ? "—" : String(n);
}

type PrintEncounter = {
  id: string;
  encounterNumber: string;
  consultationDate: Date;
  chiefComplaint: string | null;
  examinationNotes: string | null;
  clinicalNotes: string | null;
  generalAdvice: string | null;
  followUpDate: Date | null;
  followUpInstructions: string | null;
  patient: {
    patientNumber: string;
    fullName: string;
    gender: keyof typeof PATIENT_GENDER_I18N_KEYS;
    dateOfBirth: Date | null;
    estimatedAge: number | null;
    mobile: string | null;
  };
  doctor: { doctorName: string; specialty: string | null; degree: string | null };
  branch: { code: string; name: string };
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
  diagnoses: { diagnosisType: DiagnosisType; diagnosisText: string; icdCode: string | null }[];
  medicines: {
    medicineText: string;
    strength: string | null;
    dose: string | null;
    frequency: string | null;
    duration: string | null;
    instructions: string | null;
  }[];
  investigations: { investigationText: string; priority: string | null }[];
};

export function ConsultationPrintPanel({ encounter }: { encounter: PrintEncounter }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  function handlePrint() {
    startTransition(async () => {
      await recordConsultationPrintedAction(encounter.id);
      window.print();
    });
  }

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button type="button" disabled={pending} onClick={handlePrint}>
          {t("consultation.print.printButton")}
        </Button>
      </div>

      <article className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 print:border-0 print:p-0">
        <header className="border-b border-slate-200 pb-4 text-center">
          <h1 className="text-xl font-bold text-slate-900">{encounter.branch.name}</h1>
          <p className="text-sm text-slate-600">{encounter.branch.code}</p>
          <p className="mt-3 text-lg font-semibold">{t("consultation.print.title")}</p>
          <p className="text-sm text-slate-500">{t("consultation.print.subtitle")}</p>
          <p className="mt-2 font-mono text-sm text-teal-700">{encounter.encounterNumber}</p>
          <p className="text-xs text-slate-500">{new Date(encounter.consultationDate).toLocaleDateString()}</p>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">{t("consultation.print.patientInfo")}</h2>
            <p className="font-medium">{encounter.patient.fullName}</p>
            <p>{encounter.patient.patientNumber}</p>
            <p>{formatPatientDisplayAge({ ...encounter.patient, ageAsOfDate: null })} / {t(PATIENT_GENDER_I18N_KEYS[encounter.patient.gender])}</p>
            {encounter.patient.mobile && <p>{encounter.patient.mobile}</p>}
          </div>
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">{t("consultation.print.doctorInfo")}</h2>
            <p className="font-medium">{encounter.doctor.doctorName}</p>
            {encounter.doctor.degree && <p>{encounter.doctor.degree}</p>}
            {encounter.doctor.specialty && <p>{encounter.doctor.specialty}</p>}
          </div>
        </section>

        {encounter.chiefComplaint && (
          <section className="mt-6 text-sm">
            <h2 className="text-xs font-semibold uppercase text-slate-500">{t("consultation.fields.chiefComplaint")}</h2>
            <p className="mt-1">{encounter.chiefComplaint}</p>
          </section>
        )}

        {encounter.vitals && (
          <section className="mt-6 text-sm">
            <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">{t("consultation.print.vitalsSummary")}</h2>
            <p>
              H: {dec(encounter.vitals.heightCm)} cm · W: {dec(encounter.vitals.weightKg)} kg · T: {dec(encounter.vitals.temperatureC)} °C ·
              P: {encounter.vitals.pulseBpm ?? "—"} · BP: {encounter.vitals.systolicBp ?? "—"}/{encounter.vitals.diastolicBp ?? "—"} ·
              SpO₂: {encounter.vitals.spo2Percent ?? "—"}% · BMI: {dec(encounter.vitals.bmi)}
            </p>
          </section>
        )}

        {encounter.diagnoses.length > 0 && (
          <section className="mt-6 text-sm">
            <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">{t("consultation.print.diagnosisList")}</h2>
            <ul className="list-disc ps-5 space-y-1">
              {encounter.diagnoses.map((row, index) => (
                <li key={index}>
                  {row.diagnosisText}
                  {row.icdCode ? ` (${row.icdCode})` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        {encounter.medicines.length > 0 && (
          <section className="mt-6 text-sm">
            <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">{t("consultation.print.medicineList")}</h2>
            <ol className="list-decimal ps-5 space-y-2">
              {encounter.medicines.map((row, index) => (
                <li key={index}>
                  <span className="font-medium">{row.medicineText}{row.strength ? ` ${row.strength}` : ""}</span>
                  {" — "}
                  {[row.dose, row.frequency, row.duration].filter(Boolean).join(", ")}
                  {row.instructions ? `. ${row.instructions}` : ""}
                </li>
              ))}
            </ol>
          </section>
        )}

        {encounter.investigations.length > 0 && (
          <section className="mt-6 text-sm">
            <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">{t("consultation.print.investigationList")}</h2>
            <ul className="list-disc ps-5 space-y-1">
              {encounter.investigations.map((row, index) => (
                <li key={index}>{row.investigationText}{row.priority ? ` (${row.priority})` : ""}</li>
              ))}
            </ul>
          </section>
        )}

        {(encounter.generalAdvice || encounter.examinationNotes || encounter.clinicalNotes) && (
          <section className="mt-6 text-sm">
            <h2 className="text-xs font-semibold uppercase text-slate-500">{t("consultation.sections.clinicalNotes")}</h2>
            {encounter.examinationNotes && <p className="mt-1">{encounter.examinationNotes}</p>}
            {encounter.clinicalNotes && <p className="mt-1">{encounter.clinicalNotes}</p>}
            {encounter.generalAdvice && <p className="mt-1">{encounter.generalAdvice}</p>}
          </section>
        )}

        {(encounter.followUpDate || encounter.followUpInstructions) && (
          <section className="mt-6 text-sm">
            <h2 className="text-xs font-semibold uppercase text-slate-500">{t("consultation.print.followUp")}</h2>
            {encounter.followUpDate && <p className="mt-1">{new Date(encounter.followUpDate).toLocaleDateString()}</p>}
            {encounter.followUpInstructions && <p>{encounter.followUpInstructions}</p>}
          </section>
        )}

        <footer className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
          {t("consultation.print.footer")}
        </footer>
      </article>
    </div>
  );
}
