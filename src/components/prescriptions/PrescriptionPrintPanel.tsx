"use client";

import { useTransition } from "react";
import { printPrescriptionAction } from "@/app/actions/tenant-prescriptions";
import { Button } from "@/components/ui";
import type { PrescriptionDurationUnit } from "@/lib/prescription/types";
import type { DiagnosisType } from "@/lib/consultation/types";
import { useI18n } from "@/lib/i18n/client";
import { PATIENT_GENDER_I18N_KEYS } from "@/lib/patient/constants";
import { formatPatientDisplayAge } from "@/lib/patient/normalize";

function formatDuration(
  durationValue: number | null,
  durationUnit: PrescriptionDurationUnit | null,
  durationText: string | null,
): string {
  if (durationText) return durationText;
  if (!durationValue || !durationUnit) return "";
  return `${durationValue} ${durationUnit.toLowerCase()}(s)`;
}

export type PrescriptionPrintData = {
  id: string;
  prescriptionNumber: string;
  versionNumber: number;
  prescribedAt: Date;
  generalAdvice: string | null;
  clinicalSummary: string | null;
  followUpDate: Date | null;
  followUpInstructions: string | null;
  patient: {
    patientNumber: string;
    fullName: string;
    gender: keyof typeof PATIENT_GENDER_I18N_KEYS;
    dateOfBirth: Date | null;
    estimatedAge: number | null;
  };
  doctor: { doctorName: string; specialty: string | null; degree: string | null };
  branch: { code: string; name: string };
  medicines: {
    medicineName: string;
    strength: string | null;
    dose: string | null;
    frequency: string | null;
    durationValue: number | null;
    durationUnit: PrescriptionDurationUnit | null;
    durationText: string | null;
    instructions: string | null;
  }[];
  diagnoses: { diagnosisType: DiagnosisType; diagnosisText: string; icdCode: string | null }[];
  investigations: { investigationText: string; priority: string | null }[];
};

export function PrescriptionPrintPanel({
  prescription,
  isReprint = false,
}: {
  prescription: PrescriptionPrintData;
  isReprint?: boolean;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  function handlePrint() {
    startTransition(async () => {
      await printPrescriptionAction(prescription.id, isReprint);
      window.print();
    });
  }

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button type="button" disabled={pending} onClick={handlePrint}>
          {isReprint ? t("prescription.actions.reprint") : t("prescription.print.printButton")}
        </Button>
      </div>

      <article className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 print:border-0 print:p-0">
        <header className="border-b border-slate-200 pb-4 text-center">
          <h1 className="text-xl font-bold text-slate-900">{prescription.branch.name}</h1>
          <p className="text-sm text-slate-600">{prescription.branch.code}</p>
          <p className="mt-3 text-lg font-semibold">{t("prescription.print.title")}</p>
          <p className="text-sm text-slate-500">{t("prescription.print.subtitle")}</p>
          <p className="mt-2 font-mono text-sm text-teal-700">{prescription.prescriptionNumber}</p>
          <p className="text-xs text-slate-500">
            {new Date(prescription.prescribedAt).toLocaleDateString()}
            {prescription.versionNumber > 1 ? ` · v${prescription.versionNumber}` : ""}
          </p>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">{t("prescription.print.patientInfo")}</h2>
            <p className="font-medium">{prescription.patient.fullName}</p>
            <p>{prescription.patient.patientNumber}</p>
            <p>
              {formatPatientDisplayAge({ ...prescription.patient, ageAsOfDate: null })} /{" "}
              {t(PATIENT_GENDER_I18N_KEYS[prescription.patient.gender])}
            </p>
          </div>
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">{t("prescription.print.doctorInfo")}</h2>
            <p className="font-medium">{prescription.doctor.doctorName}</p>
            {prescription.doctor.degree && <p>{prescription.doctor.degree}</p>}
            {prescription.doctor.specialty && <p>{prescription.doctor.specialty}</p>}
          </div>
        </section>

        {prescription.clinicalSummary && (
          <section className="mt-6 text-sm">
            <h2 className="text-xs font-semibold uppercase text-slate-500">{t("prescription.fields.clinicalSummary")}</h2>
            <p className="mt-1">{prescription.clinicalSummary}</p>
          </section>
        )}

        {prescription.diagnoses.length > 0 && (
          <section className="mt-6 text-sm">
            <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">{t("prescription.print.diagnosisList")}</h2>
            <ul className="list-disc ps-5 space-y-1">
              {prescription.diagnoses.map((row, index) => (
                <li key={index}>
                  {row.diagnosisText}
                  {row.icdCode ? ` (${row.icdCode})` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        {prescription.medicines.length > 0 && (
          <section className="mt-6 text-sm">
            <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">{t("prescription.print.medicineList")}</h2>
            <ol className="list-decimal ps-5 space-y-2">
              {prescription.medicines.map((row, index) => (
                <li key={index}>
                  <span className="font-medium">
                    {row.medicineName}
                    {row.strength ? ` ${row.strength}` : ""}
                  </span>
                  {" — "}
                  {[row.dose, row.frequency, formatDuration(row.durationValue, row.durationUnit, row.durationText)]
                    .filter(Boolean)
                    .join(", ")}
                  {row.instructions ? `. ${row.instructions}` : ""}
                </li>
              ))}
            </ol>
          </section>
        )}

        {prescription.investigations.length > 0 && (
          <section className="mt-6 text-sm">
            <h2 className="mb-2 text-xs font-semibold uppercase text-slate-500">{t("prescription.print.investigationList")}</h2>
            <ul className="list-disc ps-5 space-y-1">
              {prescription.investigations.map((row, index) => (
                <li key={index}>
                  {row.investigationText}
                  {row.priority ? ` (${row.priority})` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        {(prescription.generalAdvice || prescription.followUpDate || prescription.followUpInstructions) && (
          <section className="mt-6 text-sm">
            <h2 className="text-xs font-semibold uppercase text-slate-500">{t("prescription.print.followUp")}</h2>
            {prescription.generalAdvice && <p className="mt-1">{prescription.generalAdvice}</p>}
            {prescription.followUpDate && (
              <p className="mt-1">{new Date(prescription.followUpDate).toLocaleDateString()}</p>
            )}
            {prescription.followUpInstructions && <p>{prescription.followUpInstructions}</p>}
          </section>
        )}

        <footer className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
          {t("prescription.print.footer")}
        </footer>
      </article>
    </div>
  );
}
