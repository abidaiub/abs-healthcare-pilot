"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  addPrescriptionMedicineAction,
  cancelPrescriptionAction,
  finalizePrescriptionAction,
  removePrescriptionMedicineAction,
  syncPrescriptionFromEncounterAction,
  updatePrescriptionDraftAction,
} from "@/app/actions/tenant-prescriptions";
import { Badge, Button, Card, CardBody, Input, Select, Textarea } from "@/components/ui";
import type { PrescriptionDurationUnit, PrescriptionStatus } from "@/lib/prescription/types";
import type { DiagnosisType } from "@/lib/consultation/types";
import {
  FREQUENCY_I18N_KEYS,
  PRESCRIPTION_STATUS_I18N_KEYS,
  STRUCTURED_FREQUENCIES,
} from "@/lib/prescription/constants";
import { useI18n } from "@/lib/i18n/client";
import { PATIENT_GENDER_I18N_KEYS } from "@/lib/patient/constants";
import { formatPatientDisplayAge } from "@/lib/patient/normalize";

function dateInputValue(value: Date | null | undefined): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function formatDuration(
  durationValue: number | null,
  durationUnit: PrescriptionDurationUnit | null,
  durationText: string | null,
): string {
  if (durationText) return durationText;
  if (!durationValue || !durationUnit) return "";
  return `${durationValue} ${durationUnit.toLowerCase()}(s)`;
}

export type PrescriptionEditorData = {
  id: string;
  prescriptionNumber: string;
  status: PrescriptionStatus;
  versionNumber: number;
  generalAdvice: string | null;
  clinicalSummary: string | null;
  followUpDate: Date | null;
  followUpIntervalDays: number | null;
  followUpInstructions: string | null;
  patient: {
    patientNumber: string;
    fullName: string;
    gender: keyof typeof PATIENT_GENDER_I18N_KEYS;
    dateOfBirth: Date | null;
    estimatedAge: number | null;
  };
  doctor: { doctorCode: string; doctorName: string; specialty: string | null; degree: string | null };
  branch: { code: string; name: string };
  department: { name: string } | null;
  encounter: { id: string; encounterNumber: string; status: string };
  medicines: {
    id: string;
    medicineName: string;
    genericName: string | null;
    strength: string | null;
    dose: string | null;
    route: string | null;
    frequency: string | null;
    durationValue: number | null;
    durationUnit: PrescriptionDurationUnit | null;
    durationText: string | null;
    quantity: string | null;
    foodTiming: string | null;
    instructions: string | null;
  }[];
  diagnoses: {
    diagnosisType: DiagnosisType;
    diagnosisText: string;
    icdCode: string | null;
  }[];
  investigations: {
    investigationText: string;
    priority: string | null;
    instructions: string | null;
  }[];
};

const DURATION_UNITS: PrescriptionDurationUnit[] = ["DAY", "WEEK", "MONTH"];

export function PrescriptionEditor({
  prescription,
  canEdit,
  canFinalize,
  canCancel,
}: {
  prescription: PrescriptionEditorData;
  canEdit: boolean;
  canFinalize: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [pending, startTransition] = useTransition();
  const disabled = !canEdit || pending;

  function handleError(result: { ok: boolean; errorCode?: string; duplicateWarning?: boolean }) {
    if (!result.ok) {
      setError(t(`prescription.errors.${result.errorCode}`, t("prescription.errors.generic")));
      return false;
    }
    setError(null);
    if (result.duplicateWarning) {
      setWarning(t("prescription.messages.duplicateMedicineWarning"));
    } else {
      setWarning(null);
    }
    router.refresh();
    return true;
  }

  function submitDraft(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      handleError(await updatePrescriptionDraftAction(prescription.id, formData));
    });
  }

  function submitMedicine(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      if (handleError(await addPrescriptionMedicineAction(prescription.id, formData))) {
        e.currentTarget.reset();
      }
    });
  }

  function syncFromEncounter() {
    startTransition(async () => {
      handleError(await syncPrescriptionFromEncounterAction(prescription.id));
    });
  }

  function removeMedicine(medicineId: string) {
    startTransition(async () => {
      handleError(await removePrescriptionMedicineAction(prescription.id, medicineId));
    });
  }

  function finalize() {
    startTransition(async () => {
      const result = await finalizePrescriptionAction(prescription.id);
      if (!result.ok) {
        handleError(result);
        return;
      }
      setError(null);
      router.push(`/prescriptions/${prescription.id}`);
    });
  }

  function cancelPrescription() {
    startTransition(async () => {
      const result = await cancelPrescriptionAction(prescription.id, cancelReason);
      if (!result.ok) {
        handleError(result);
        return;
      }
      setError(null);
      router.push("/prescriptions");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-semibold text-teal-700">{prescription.prescriptionNumber}</span>
          <Badge variant="info">{t(PRESCRIPTION_STATUS_I18N_KEYS[prescription.status])}</Badge>
          <span className="text-xs text-slate-500">v{prescription.versionNumber}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button type="button" variant="secondary" disabled={pending} onClick={syncFromEncounter}>
              {t("prescription.actions.syncFromEncounter")}
            </Button>
          )}
          <Link href={`/prescriptions/${prescription.id}`}>
            <Button type="button" variant="ghost">{t("prescription.actions.viewDetail")}</Button>
          </Link>
          {canFinalize && (
            <Button type="button" disabled={pending} onClick={finalize}>
              {t("prescription.actions.finalize")}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {warning && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{warning}</div>
      )}

      {!canEdit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("prescription.messages.notEditable")}
        </div>
      )}

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("prescription.sections.patientSummary")}</h2>
        </div>
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div><dt className="text-xs uppercase text-slate-500">{t("prescription.fields.patient")}</dt><dd>{prescription.patient.fullName} ({prescription.patient.patientNumber})</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("prescription.fields.ageSex")}</dt><dd>{formatPatientDisplayAge({ ...prescription.patient, ageAsOfDate: null })} / {t(PATIENT_GENDER_I18N_KEYS[prescription.patient.gender])}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("prescription.fields.doctor")}</dt><dd>{prescription.doctor.doctorName}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("prescription.fields.encounter")}</dt><dd className="font-mono">{prescription.encounter.encounterNumber}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("prescription.fields.branch")}</dt><dd>{prescription.branch.code} — {prescription.branch.name}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("prescription.fields.department")}</dt><dd>{prescription.department?.name ?? "—"}</dd></div>
        </CardBody>
      </Card>

      {prescription.diagnoses.length > 0 && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("prescription.sections.diagnosis")}</h2>
          </div>
          <CardBody className="space-y-2 text-sm">
            {prescription.diagnoses.map((row, index) => (
              <p key={index}>
                {row.diagnosisText}
                {row.icdCode ? ` (${row.icdCode})` : ""}
                {" — "}
                {t(`prescription.diagnosisType.${row.diagnosisType.toLowerCase()}`)}
              </p>
            ))}
          </CardBody>
        </Card>
      )}

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("prescription.sections.advice")}</h2>
        </div>
        <CardBody>
          <form onSubmit={submitDraft} className="grid gap-4 md:grid-cols-2">
            <Textarea label={t("prescription.fields.clinicalSummary")} name="clinicalSummary" defaultValue={prescription.clinicalSummary ?? ""} disabled={disabled} rows={2} className="md:col-span-2" />
            <Textarea label={t("prescription.fields.generalAdvice")} name="generalAdvice" defaultValue={prescription.generalAdvice ?? ""} disabled={disabled} rows={2} className="md:col-span-2" />
            <Input label={t("prescription.fields.followUpDate")} name="followUpDate" type="date" defaultValue={dateInputValue(prescription.followUpDate)} disabled={disabled} />
            <Input label={t("prescription.fields.followUpIntervalDays")} name="followUpIntervalDays" type="number" defaultValue={prescription.followUpIntervalDays ?? ""} disabled={disabled} />
            <Textarea label={t("prescription.fields.followUpInstructions")} name="followUpInstructions" defaultValue={prescription.followUpInstructions ?? ""} disabled={disabled} rows={2} className="md:col-span-2" />
            {canEdit && (
              <div className="md:col-span-2">
                <Button type="submit" disabled={pending}>{t("prescription.actions.saveDraft")}</Button>
              </div>
            )}
          </form>
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("prescription.sections.medicines")}</h2>
        </div>
        <CardBody className="space-y-4">
          {prescription.medicines.map((row, index) => (
            <div key={row.id} className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3 text-sm">
              <div>
                <p className="font-medium">{index + 1}. {row.medicineName}{row.strength ? ` ${row.strength}` : ""}</p>
                <p className="text-slate-600">
                  {[row.dose, row.frequency, formatDuration(row.durationValue, row.durationUnit, row.durationText)].filter(Boolean).join(" · ")}
                </p>
                {row.instructions && <p className="text-slate-500">{row.instructions}</p>}
              </div>
              {canEdit && (
                <Button type="button" variant="ghost" disabled={pending} onClick={() => removeMedicine(row.id)}>
                  {t("prescription.actions.remove")}
                </Button>
              )}
            </div>
          ))}

          {canEdit && (
            <form onSubmit={submitMedicine} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 border-t border-slate-100 pt-4">
              <Input label={t("prescription.fields.medicineName")} name="medicineName" required disabled={disabled} />
              <Input label={t("prescription.fields.genericName")} name="genericName" disabled={disabled} />
              <Input label={t("prescription.fields.strength")} name="strength" disabled={disabled} />
              <Input label={t("prescription.fields.dose")} name="dose" disabled={disabled} />
              <Input label={t("prescription.fields.route")} name="route" disabled={disabled} />
              <Select label={t("prescription.fields.frequency")} name="frequency" disabled={disabled} defaultValue="">
                <option value="">—</option>
                {STRUCTURED_FREQUENCIES.map((freq) => (
                  <option key={freq} value={freq}>{t(FREQUENCY_I18N_KEYS[freq])}</option>
                ))}
              </Select>
              <Input label={t("prescription.fields.durationValue")} name="durationValue" type="number" min={1} disabled={disabled} />
              <Select label={t("prescription.fields.durationUnit")} name="durationUnit" disabled={disabled} defaultValue="">
                <option value="">—</option>
                {DURATION_UNITS.map((unit) => (
                  <option key={unit} value={unit}>{t(`prescription.durationUnit.${unit.toLowerCase()}`)}</option>
                ))}
              </Select>
              <Input label={t("prescription.fields.quantity")} name="quantity" disabled={disabled} />
              <Input label={t("prescription.fields.foodTiming")} name="foodTiming" disabled={disabled} />
              <Textarea label={t("prescription.fields.instructions")} name="instructions" disabled={disabled} rows={2} className="sm:col-span-2 lg:col-span-3" />
              <div className="sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={pending}>{t("prescription.actions.addMedicine")}</Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>

      {prescription.investigations.length > 0 && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("prescription.sections.investigations")}</h2>
          </div>
          <CardBody className="space-y-2 text-sm">
            {prescription.investigations.map((row, index) => (
              <p key={index}>{row.investigationText}{row.priority ? ` (${row.priority})` : ""}</p>
            ))}
          </CardBody>
        </Card>
      )}

      {canCancel && (
        <Card>
          <CardBody className="space-y-3">
            <Textarea
              label={t("prescription.fields.cancellationReason")}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
            />
            <Button type="button" variant="secondary" disabled={pending} onClick={cancelPrescription}>
              {t("prescription.actions.cancel")}
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
