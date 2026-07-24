"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  cancelPrescriptionAction,
  createPrescriptionRevisionAction,
  finalizePrescriptionAction,
} from "@/app/actions/tenant-prescriptions";
import { Badge, Button, Card, CardBody, Textarea } from "@/components/ui";
import type { PrescriptionDurationUnit, PrescriptionStatus } from "@/lib/prescription/types";
import type { DiagnosisType } from "@/lib/consultation/types";
import { PRESCRIPTION_STATUS_I18N_KEYS, isPrescriptionEditable } from "@/lib/prescription/constants";
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

export type PrescriptionDetailData = {
  id: string;
  prescriptionNumber: string;
  status: PrescriptionStatus;
  versionNumber: number;
  isCurrentVersion: boolean;
  prescribedAt: Date;
  finalizedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  revisionReason: string | null;
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
  encounter: { id: string; encounterNumber: string };
  appointment: { appointmentNumber: string } | null;
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

export function PrescriptionDetailPanel({
  prescription,
  canEdit,
  canFinalize,
  canCancel,
  canRevise,
  canPrint,
}: {
  prescription: PrescriptionDetailData;
  canEdit: boolean;
  canFinalize: boolean;
  canCancel: boolean;
  canRevise: boolean;
  canPrint: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [revisionReason, setRevisionReason] = useState("");
  const [pending, startTransition] = useTransition();
  const editable = isPrescriptionEditable(prescription.status);

  function handleError(result: { ok: boolean; errorCode?: string }) {
    if (!result.ok) {
      setError(t(`prescription.errors.${result.errorCode}`, t("prescription.errors.generic")));
      return false;
    }
    setError(null);
    return true;
  }

  function finalize() {
    startTransition(async () => {
      const result = await finalizePrescriptionAction(prescription.id);
      if (!result.ok) {
        handleError(result);
        return;
      }
      router.refresh();
    });
  }

  function cancelPrescription() {
    startTransition(async () => {
      const result = await cancelPrescriptionAction(prescription.id, cancelReason);
      if (!result.ok) {
        handleError(result);
        return;
      }
      router.push("/prescriptions");
    });
  }

  function createRevision() {
    startTransition(async () => {
      const result = await createPrescriptionRevisionAction(prescription.id, revisionReason);
      if (!result.ok) {
        handleError(result);
        return;
      }
      if (result.prescriptionId) {
        router.push(`/prescriptions/${result.prescriptionId}/edit`);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-semibold text-teal-700">{prescription.prescriptionNumber}</span>
          <Badge variant={prescription.status === "FINALIZED" ? "success" : prescription.status === "DRAFT" ? "info" : "default"}>
            {t(PRESCRIPTION_STATUS_I18N_KEYS[prescription.status])}
          </Badge>
          <span className="text-xs text-slate-500">v{prescription.versionNumber}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && canEdit && (
            <Link href={`/prescriptions/${prescription.id}/edit`}>
              <Button type="button">{t("prescription.actions.editDraft")}</Button>
            </Link>
          )}
          {canFinalize && prescription.status === "DRAFT" && (
            <Button type="button" disabled={pending} onClick={finalize}>
              {t("prescription.actions.finalize")}
            </Button>
          )}
          {canPrint && prescription.status === "FINALIZED" && (
            <Link href={`/prescriptions/${prescription.id}/print`}>
              <Button type="button" variant="secondary">{t("prescription.actions.print")}</Button>
            </Link>
          )}
          <Link href={`/prescriptions/${prescription.id}/history`}>
            <Button type="button" variant="ghost">{t("prescription.actions.history")}</Button>
          </Link>
          <Link href="/prescriptions">
            <Button type="button" variant="ghost">{t("prescription.actions.backToList")}</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {canRevise && prescription.status === "FINALIZED" && prescription.isCurrentVersion && (
        <Card>
          <CardBody className="space-y-3">
            <Textarea
              label={t("prescription.fields.revisionReason")}
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              rows={2}
            />
            <Button type="button" disabled={pending} onClick={createRevision}>
              {t("prescription.actions.revise")}
            </Button>
          </CardBody>
        </Card>
      )}

      {canCancel && (prescription.status === "DRAFT" || prescription.status === "FINALIZED") && (
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

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div><dt className="text-xs uppercase text-slate-500">{t("prescription.fields.patient")}</dt><dd>{prescription.patient.fullName} ({prescription.patient.patientNumber})</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("prescription.fields.ageSex")}</dt><dd>{formatPatientDisplayAge({ ...prescription.patient, ageAsOfDate: null })} / {t(PATIENT_GENDER_I18N_KEYS[prescription.patient.gender])}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("prescription.fields.doctor")}</dt><dd>{prescription.doctor.doctorName}{prescription.doctor.degree ? `, ${prescription.doctor.degree}` : ""}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("prescription.fields.prescribedAt")}</dt><dd>{new Date(prescription.prescribedAt).toLocaleString()}</dd></div>
          {prescription.finalizedAt && (
            <div><dt className="text-xs uppercase text-slate-500">{t("prescription.fields.finalizedAt")}</dt><dd>{new Date(prescription.finalizedAt).toLocaleString()}</dd></div>
          )}
          <div><dt className="text-xs uppercase text-slate-500">{t("prescription.fields.encounter")}</dt><dd className="font-mono">{prescription.encounter.encounterNumber}</dd></div>
          {prescription.appointment && (
            <div><dt className="text-xs uppercase text-slate-500">{t("prescription.fields.appointment")}</dt><dd>{prescription.appointment.appointmentNumber}</dd></div>
          )}
        </CardBody>
      </Card>

      {(prescription.clinicalSummary || prescription.generalAdvice) && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("prescription.sections.clinicalSummary")}</h2>
          </div>
          <CardBody className="space-y-3 text-sm">
            {prescription.clinicalSummary && <p>{prescription.clinicalSummary}</p>}
            {prescription.generalAdvice && <p>{prescription.generalAdvice}</p>}
          </CardBody>
        </Card>
      )}

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
              </p>
            ))}
          </CardBody>
        </Card>
      )}

      {prescription.medicines.length > 0 && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("prescription.sections.medicines")}</h2>
          </div>
          <CardBody className="space-y-3 text-sm">
            {prescription.medicines.map((row, index) => (
              <div key={index}>
                <p className="font-medium">{index + 1}. {row.medicineName}{row.strength ? ` ${row.strength}` : ""}</p>
                <p className="text-slate-600">
                  {[row.dose, row.frequency, formatDuration(row.durationValue, row.durationUnit, row.durationText)].filter(Boolean).join(" · ")}
                </p>
                {row.instructions && <p className="text-slate-500">{row.instructions}</p>}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

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

      {(prescription.followUpDate || prescription.followUpIntervalDays || prescription.followUpInstructions) && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("prescription.sections.followUp")}</h2>
          </div>
          <CardBody className="text-sm space-y-2">
            {prescription.followUpDate && <p>{new Date(prescription.followUpDate).toLocaleDateString()}</p>}
            {prescription.followUpIntervalDays && <p>{prescription.followUpIntervalDays} days</p>}
            {prescription.followUpInstructions && <p>{prescription.followUpInstructions}</p>}
          </CardBody>
        </Card>
      )}

      {prescription.cancellationReason && (
        <Card>
          <CardBody className="text-sm">
            <p className="text-xs uppercase text-slate-500">{t("prescription.fields.cancellationReason")}</p>
            <p className="mt-1">{prescription.cancellationReason}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
