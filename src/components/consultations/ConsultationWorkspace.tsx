"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  addEncounterDiagnosisAction,
  addInvestigationAdviceAction,
  addMedicineAdviceAction,
  completeConsultationAction,
  removeEncounterDiagnosisAction,
  removeInvestigationAdviceAction,
  removeMedicineAdviceAction,
  saveConsultationDraftAction,
  updateEncounterVitalsAction,
} from "@/app/actions/tenant-consultations";
import { Badge, Button, Card, CardBody, Input, Select, Textarea } from "@/components/ui";
import type { ClinicalEncounterStatus, DiagnosisType } from "@/lib/consultation/types";
import { ENCOUNTER_STATUS_I18N_KEYS } from "@/lib/consultation/constants";
import { useI18n } from "@/lib/i18n/client";
import { PATIENT_GENDER_I18N_KEYS } from "@/lib/patient/constants";
import { formatPatientDisplayAge } from "@/lib/patient/normalize";

type DecimalLike = { toString(): string } | null;

function dec(value: DecimalLike | undefined): string {
  if (value == null) return "";
  const n = Number(value.toString());
  return Number.isNaN(n) ? "" : String(n);
}

function dateInputValue(value: Date | null | undefined): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

type EncounterData = {
  id: string;
  encounterNumber: string;
  status: ClinicalEncounterStatus;
  consultationDate: Date;
  chiefComplaint: string | null;
  historyOfPresentIllness: string | null;
  pastMedicalHistory: string | null;
  pastSurgicalHistory: string | null;
  allergyNotes: string | null;
  familyHistory: string | null;
  socialHistory: string | null;
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
    respiratoryRate: number | null;
    systolicBp: number | null;
    diastolicBp: number | null;
    spo2Percent: number | null;
    bloodGlucoseMgDl: DecimalLike;
    bmi: DecimalLike;
    notes: string | null;
  } | null;
  diagnoses: {
    id: string;
    diagnosisType: DiagnosisType;
    diagnosisText: string;
    icdCode: string | null;
    notes: string | null;
  }[];
  medicines: {
    id: string;
    medicineText: string;
    strength: string | null;
    dose: string | null;
    route: string | null;
    frequency: string | null;
    duration: string | null;
    quantity: string | null;
    instructions: string | null;
    foodTiming: string | null;
  }[];
  investigations: {
    id: string;
    investigationText: string;
    priority: string | null;
    instructions: string | null;
    clinicalNote: string | null;
  }[];
};

const DIAGNOSIS_TYPES: DiagnosisType[] = ["PRIMARY", "SECONDARY", "PROVISIONAL", "CONFIRMED"];

export function ConsultationWorkspace({
  encounter,
  canEdit,
  canComplete,
}: {
  encounter: EncounterData;
  canEdit: boolean;
  canComplete: boolean;
  canReopen?: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const disabled = !canEdit || pending;

  function handleError(result: { ok: boolean; errorCode?: string }) {
    if (!result.ok) {
      setError(t(`consultation.errors.${result.errorCode}`, t("consultation.errors.generic")));
      return false;
    }
    setError(null);
    router.refresh();
    return true;
  }

  function submitDraft(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      handleError(await saveConsultationDraftAction(encounter.id, formData));
    });
  }

  function submitVitals(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      handleError(await updateEncounterVitalsAction(encounter.id, formData));
    });
  }

  function submitDiagnosis(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      if (handleError(await addEncounterDiagnosisAction(encounter.id, formData))) {
        e.currentTarget.reset();
      }
    });
  }

  function submitMedicine(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      if (handleError(await addMedicineAdviceAction(encounter.id, formData))) {
        e.currentTarget.reset();
      }
    });
  }

  function submitInvestigation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      if (handleError(await addInvestigationAdviceAction(encounter.id, formData))) {
        e.currentTarget.reset();
      }
    });
  }

  function removeDiagnosis(id: string) {
    startTransition(async () => {
      handleError(await removeEncounterDiagnosisAction(encounter.id, id));
    });
  }

  function removeMedicine(id: string) {
    startTransition(async () => {
      handleError(await removeMedicineAdviceAction(encounter.id, id));
    });
  }

  function removeInvestigation(id: string) {
    startTransition(async () => {
      handleError(await removeInvestigationAdviceAction(encounter.id, id));
    });
  }

  function completeConsultation() {
    startTransition(async () => {
      const result = await completeConsultationAction(encounter.id);
      if (!result.ok) {
        handleError(result);
        return;
      }
      setError(null);
      router.push(`/consultations/${encounter.id}`);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-semibold text-teal-700">{encounter.encounterNumber}</span>
          <Badge variant="info">{t(ENCOUNTER_STATUS_I18N_KEYS[encounter.status])}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/consultations/${encounter.id}`}>
            <Button type="button" variant="secondary">{t("consultation.actions.viewDetail")}</Button>
          </Link>
          {canComplete && (
            <Button type="button" disabled={pending} onClick={completeConsultation}>
              {t("consultation.actions.complete")}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!canEdit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("consultation.messages.notEditable")}
        </div>
      )}

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("consultation.sections.patientSummary")}</h2>
        </div>
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div><dt className="text-xs uppercase text-slate-500">{t("consultation.fields.patient")}</dt><dd>{encounter.patient.fullName} ({encounter.patient.patientNumber})</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("consultation.fields.ageSex")}</dt><dd>{formatPatientDisplayAge({ ...encounter.patient, ageAsOfDate: null })} / {t(PATIENT_GENDER_I18N_KEYS[encounter.patient.gender])}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("consultation.fields.doctor")}</dt><dd>{encounter.doctor.doctorName}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("consultation.fields.branch")}</dt><dd>{encounter.branch.code} — {encounter.branch.name}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("consultation.fields.department")}</dt><dd>{encounter.department?.name ?? "—"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("consultation.fields.queueToken")}</dt><dd>{encounter.appointment?.queueToken ?? "—"}</dd></div>
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("consultation.sections.complaintHistory")}</h2>
        </div>
        <CardBody>
          <form onSubmit={submitDraft} className="grid gap-4 md:grid-cols-2">
            <Textarea label={t("consultation.fields.chiefComplaint")} name="chiefComplaint" defaultValue={encounter.chiefComplaint ?? ""} disabled={disabled} rows={2} />
            <Textarea label={t("consultation.fields.historyOfPresentIllness")} name="historyOfPresentIllness" defaultValue={encounter.historyOfPresentIllness ?? ""} disabled={disabled} rows={2} />
            <Textarea label={t("consultation.fields.pastMedicalHistory")} name="pastMedicalHistory" defaultValue={encounter.pastMedicalHistory ?? ""} disabled={disabled} rows={2} />
            <Textarea label={t("consultation.fields.pastSurgicalHistory")} name="pastSurgicalHistory" defaultValue={encounter.pastSurgicalHistory ?? ""} disabled={disabled} rows={2} />
            <Textarea label={t("consultation.fields.allergyNotes")} name="allergyNotes" defaultValue={encounter.allergyNotes ?? ""} disabled={disabled} rows={2} />
            <Textarea label={t("consultation.fields.familyHistory")} name="familyHistory" defaultValue={encounter.familyHistory ?? ""} disabled={disabled} rows={2} />
            <Textarea label={t("consultation.fields.socialHistory")} name="socialHistory" defaultValue={encounter.socialHistory ?? ""} disabled={disabled} rows={2} />
            <Textarea label={t("consultation.fields.examinationNotes")} name="examinationNotes" defaultValue={encounter.examinationNotes ?? ""} disabled={disabled} rows={2} />
            <Textarea label={t("consultation.fields.clinicalNotes")} name="clinicalNotes" defaultValue={encounter.clinicalNotes ?? ""} disabled={disabled} rows={2} className="md:col-span-2" />
            <Textarea label={t("consultation.fields.generalAdvice")} name="generalAdvice" defaultValue={encounter.generalAdvice ?? ""} disabled={disabled} rows={2} className="md:col-span-2" />
            <Input label={t("consultation.fields.followUpDate")} name="followUpDate" type="date" defaultValue={dateInputValue(encounter.followUpDate)} disabled={disabled} />
            <Input label={t("consultation.fields.followUpIntervalDays")} name="followUpIntervalDays" type="number" defaultValue={encounter.followUpIntervalDays ?? ""} disabled={disabled} />
            <Textarea label={t("consultation.fields.followUpInstructions")} name="followUpInstructions" defaultValue={encounter.followUpInstructions ?? ""} disabled={disabled} rows={2} className="md:col-span-2" />
            {canEdit && (
              <div className="md:col-span-2">
                <Button type="submit" disabled={pending}>{t("consultation.actions.saveDraft")}</Button>
              </div>
            )}
          </form>
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("consultation.sections.vitals")}</h2>
        </div>
        <CardBody>
          <form onSubmit={submitVitals} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input label={t("consultation.fields.heightCm")} name="heightCm" type="number" step="0.1" defaultValue={dec(encounter.vitals?.heightCm)} disabled={disabled} />
            <Input label={t("consultation.fields.weightKg")} name="weightKg" type="number" step="0.1" defaultValue={dec(encounter.vitals?.weightKg)} disabled={disabled} />
            <Input label={t("consultation.fields.temperatureC")} name="temperatureC" type="number" step="0.1" defaultValue={dec(encounter.vitals?.temperatureC)} disabled={disabled} />
            <Input label={t("consultation.fields.pulseBpm")} name="pulseBpm" type="number" defaultValue={encounter.vitals?.pulseBpm ?? ""} disabled={disabled} />
            <Input label={t("consultation.fields.respiratoryRate")} name="respiratoryRate" type="number" defaultValue={encounter.vitals?.respiratoryRate ?? ""} disabled={disabled} />
            <Input label={t("consultation.fields.systolicBp")} name="systolicBp" type="number" defaultValue={encounter.vitals?.systolicBp ?? ""} disabled={disabled} />
            <Input label={t("consultation.fields.diastolicBp")} name="diastolicBp" type="number" defaultValue={encounter.vitals?.diastolicBp ?? ""} disabled={disabled} />
            <Input label={t("consultation.fields.spo2Percent")} name="spo2Percent" type="number" defaultValue={encounter.vitals?.spo2Percent ?? ""} disabled={disabled} />
            <Input label={t("consultation.fields.bloodGlucoseMgDl")} name="bloodGlucoseMgDl" type="number" step="0.1" defaultValue={dec(encounter.vitals?.bloodGlucoseMgDl)} disabled={disabled} />
            <Input label={t("consultation.fields.bmi")} value={dec(encounter.vitals?.bmi)} readOnly disabled />
            <Textarea label={t("consultation.fields.vitalsNotes")} name="vitalsNotes" defaultValue={encounter.vitals?.notes ?? ""} disabled={disabled} rows={2} className="sm:col-span-2 lg:col-span-4" />
            {canEdit && (
              <div className="sm:col-span-2 lg:col-span-4">
                <Button type="submit" disabled={pending}>{t("consultation.actions.saveVitals")}</Button>
              </div>
            )}
          </form>
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("consultation.sections.diagnosis")}</h2>
        </div>
        <CardBody className="space-y-4">
          {encounter.diagnoses.map((row) => (
            <div key={row.id} className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 px-4 py-3">
              <div>
                <p className="font-medium">{row.diagnosisText}</p>
                <p className="text-xs text-slate-500">
                  {t(`consultation.diagnosisType.${row.diagnosisType.toLowerCase()}`)}
                  {row.icdCode ? ` · ${row.icdCode}` : ""}
                </p>
                {row.notes && <p className="mt-1 text-sm text-slate-600">{row.notes}</p>}
              </div>
              {canEdit && (
                <Button type="button" variant="ghost" disabled={pending} onClick={() => removeDiagnosis(row.id)}>
                  {t("consultation.actions.remove")}
                </Button>
              )}
            </div>
          ))}
          {canEdit && (
            <form onSubmit={submitDiagnosis} className="grid gap-4 md:grid-cols-2">
              <Input label={t("consultation.fields.diagnosisText")} name="diagnosisText" required disabled={pending} />
              <Select label={t("consultation.fields.diagnosisType")} name="diagnosisType" defaultValue="PRIMARY" disabled={pending}>
                {DIAGNOSIS_TYPES.map((type) => (
                  <option key={type} value={type}>{t(`consultation.diagnosisType.${type.toLowerCase()}`)}</option>
                ))}
              </Select>
              <Input label={t("consultation.fields.icdCode")} name="icdCode" disabled={pending} />
              <Input label={t("consultation.fields.diagnosisNotes")} name="diagnosisNotes" disabled={pending} />
              <div className="md:col-span-2">
                <Button type="submit" disabled={pending}>{t("consultation.actions.addDiagnosis")}</Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("consultation.sections.medicines")}</h2>
        </div>
        <CardBody className="space-y-4">
          {encounter.medicines.map((row) => (
            <div key={row.id} className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 px-4 py-3">
              <div>
                <p className="font-medium">{row.medicineText}{row.strength ? ` ${row.strength}` : ""}</p>
                <p className="text-sm text-slate-600">
                  {[row.dose, row.route, row.frequency, row.duration].filter(Boolean).join(" · ") || "—"}
                </p>
                {row.instructions && <p className="mt-1 text-sm text-slate-500">{row.instructions}</p>}
              </div>
              {canEdit && (
                <Button type="button" variant="ghost" disabled={pending} onClick={() => removeMedicine(row.id)}>
                  {t("consultation.actions.remove")}
                </Button>
              )}
            </div>
          ))}
          {canEdit && (
            <form onSubmit={submitMedicine} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Input label={t("consultation.fields.medicineText")} name="medicineText" required disabled={pending} />
              <Input label={t("consultation.fields.strength")} name="strength" disabled={pending} />
              <Input label={t("consultation.fields.dose")} name="dose" disabled={pending} />
              <Input label={t("consultation.fields.route")} name="route" disabled={pending} />
              <Input label={t("consultation.fields.frequency")} name="frequency" disabled={pending} />
              <Input label={t("consultation.fields.duration")} name="duration" disabled={pending} />
              <Input label={t("consultation.fields.quantity")} name="quantity" disabled={pending} />
              <Input label={t("consultation.fields.foodTiming")} name="foodTiming" disabled={pending} />
              <Input label={t("consultation.fields.instructions")} name="instructions" disabled={pending} className="md:col-span-2" />
              <div className="md:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={pending}>{t("consultation.actions.addMedicine")}</Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("consultation.sections.investigations")}</h2>
        </div>
        <CardBody className="space-y-4">
          {encounter.investigations.map((row) => (
            <div key={row.id} className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 px-4 py-3">
              <div>
                <p className="font-medium">{row.investigationText}</p>
                {row.priority && <p className="text-xs text-slate-500">{row.priority}</p>}
                {row.instructions && <p className="mt-1 text-sm text-slate-600">{row.instructions}</p>}
              </div>
              {canEdit && (
                <Button type="button" variant="ghost" disabled={pending} onClick={() => removeInvestigation(row.id)}>
                  {t("consultation.actions.remove")}
                </Button>
              )}
            </div>
          ))}
          {canEdit && (
            <form onSubmit={submitInvestigation} className="grid gap-4 md:grid-cols-2">
              <Input label={t("consultation.fields.investigationText")} name="investigationText" required disabled={pending} />
              <Input label={t("consultation.fields.priority")} name="priority" disabled={pending} />
              <Input label={t("consultation.fields.instructions")} name="instructions" disabled={pending} />
              <Input label={t("consultation.fields.clinicalNote")} name="clinicalNote" disabled={pending} />
              <div className="md:col-span-2">
                <Button type="submit" disabled={pending}>{t("consultation.actions.addInvestigation")}</Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
