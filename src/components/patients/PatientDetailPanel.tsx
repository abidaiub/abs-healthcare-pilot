"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  activatePatientAction,
  deactivatePatientAction,
} from "@/app/actions/tenant-patients";
import { Badge, Button, Card, CardBody } from "@/components/ui";
import {
  BLOOD_GROUP_I18N_KEYS,
  MARITAL_STATUS_I18N_KEYS,
  PATIENT_GENDER_I18N_KEYS,
} from "@/lib/patient/constants";
import { formatPatientDisplayAge } from "@/lib/patient/normalize";
import { useI18n } from "@/lib/i18n/client";

type PatientDetail = {
  id: string;
  patientNumber: string;
  fullName: string;
  preferredName: string | null;
  gender: keyof typeof PATIENT_GENDER_I18N_KEYS;
  dateOfBirth: Date | null;
  estimatedAge: number | null;
  ageAsOfDate: Date | null;
  bloodGroup: keyof typeof BLOOD_GROUP_I18N_KEYS | null;
  maritalStatus: keyof typeof MARITAL_STATUS_I18N_KEYS | null;
  nationality: string | null;
  mobile: string | null;
  alternateMobile: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  district: string | null;
  postalCode: string | null;
  nationalId: string | null;
  passportNumber: string | null;
  occupation: string | null;
  religion: string | null;
  notes: string | null;
  guardianName: string | null;
  guardianRelation: string | null;
  guardianMobile: string | null;
  emergencyContactName: string | null;
  emergencyContactRelation: string | null;
  emergencyContactMobile: string | null;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  updatedAt: Date;
  registrationBranch: { code: string; name: string };
};

function maskIdentifier(value: string | null): string {
  if (!value) return "—";
  if (value.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value || "—"}</dd>
    </div>
  );
}

export function PatientDetailPanel({
  patient,
  canEdit,
}: {
  patient: PatientDetail;
  canEdit: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function runLifecycle(action: () => Promise<{ ok: boolean; errorCode?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(t(`patient.errors.${result.errorCode}`, t("patient.errors.generic")));
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  const displayAge = formatPatientDisplayAge(patient);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={patient.isActive ? "success" : "warning"}>
            {patient.isActive ? t("patient.status.active") : t("patient.status.inactive")}
          </Badge>
          <span className="font-mono text-sm font-semibold text-teal-700">
            {patient.patientNumber}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Link href={`/patients/${patient.id}/edit`}>
              <Button type="button" variant="secondary">
                {t("patient.actions.edit")}
              </Button>
            </Link>
          )}
          {canEdit && patient.isActive && (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                runLifecycle(() =>
                  deactivatePatientAction(patient.id).then((r) => ({
                    ok: r.ok,
                    errorCode: r.ok ? undefined : r.errorCode,
                  })),
                )
              }
            >
              {t("patient.actions.deactivate")}
            </Button>
          )}
          {canEdit && !patient.isActive && (
            <Button
              type="button"
              disabled={pending}
              onClick={() =>
                runLifecycle(() =>
                  activatePatientAction(patient.id).then((r) => ({
                    ok: r.ok,
                    errorCode: r.ok ? undefined : r.errorCode,
                  })),
                )
              }
            >
              {t("patient.actions.activate")}
            </Button>
          )}
          <Link href="/patients">
            <Button type="button" variant="ghost">
              {t("patient.actions.backToList")}
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardBody className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow label={t("patient.fields.fullName")} value={patient.fullName} />
          <DetailRow
            label={t("patient.fields.preferredName")}
            value={patient.preferredName ?? "—"}
          />
          <DetailRow
            label={t("patient.fields.gender")}
            value={t(PATIENT_GENDER_I18N_KEYS[patient.gender])}
          />
          <DetailRow label={t("patient.fields.ageDisplay")} value={displayAge} />
          <DetailRow
            label={t("patient.fields.dateOfBirth")}
            value={patient.dateOfBirth ? patient.dateOfBirth.toLocaleDateString() : "—"}
          />
          <DetailRow
            label={t("patient.fields.bloodGroup")}
            value={patient.bloodGroup ? t(BLOOD_GROUP_I18N_KEYS[patient.bloodGroup]) : "—"}
          />
          <DetailRow
            label={t("patient.fields.maritalStatus")}
            value={
              patient.maritalStatus ? t(MARITAL_STATUS_I18N_KEYS[patient.maritalStatus]) : "—"
            }
          />
          <DetailRow
            label={t("patient.fields.registrationBranch")}
            value={`${patient.registrationBranch.code} — ${patient.registrationBranch.name}`}
          />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("patient.sections.contact")}</h2>
        </div>
        <CardBody className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow label={t("patient.fields.mobile")} value={patient.mobile ?? "—"} />
          <DetailRow
            label={t("patient.fields.alternateMobile")}
            value={patient.alternateMobile ?? "—"}
          />
          <DetailRow label={t("patient.fields.email")} value={patient.email ?? "—"} />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("patient.sections.address")}</h2>
        </div>
        <CardBody className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow label={t("patient.fields.addressLine1")} value={patient.addressLine1 ?? "—"} />
          <DetailRow label={t("patient.fields.addressLine2")} value={patient.addressLine2 ?? "—"} />
          <DetailRow label={t("patient.fields.city")} value={patient.city ?? "—"} />
          <DetailRow label={t("patient.fields.district")} value={patient.district ?? "—"} />
          <DetailRow label={t("patient.fields.postalCode")} value={patient.postalCode ?? "—"} />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("patient.sections.guardian")}</h2>
        </div>
        <CardBody className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow label={t("patient.fields.guardianName")} value={patient.guardianName ?? "—"} />
          <DetailRow
            label={t("patient.fields.guardianRelation")}
            value={patient.guardianRelation ?? "—"}
          />
          <DetailRow
            label={t("patient.fields.guardianMobile")}
            value={patient.guardianMobile ?? "—"}
          />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {t("patient.sections.emergency")}
          </h2>
        </div>
        <CardBody className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow
            label={t("patient.fields.emergencyContactName")}
            value={patient.emergencyContactName ?? "—"}
          />
          <DetailRow
            label={t("patient.fields.emergencyContactRelation")}
            value={patient.emergencyContactRelation ?? "—"}
          />
          <DetailRow
            label={t("patient.fields.emergencyContactMobile")}
            value={patient.emergencyContactMobile ?? "—"}
          />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {t("patient.sections.identifiers")}
          </h2>
        </div>
        <CardBody className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow
            label={t("patient.fields.nationalId")}
            value={maskIdentifier(patient.nationalId)}
          />
          <DetailRow
            label={t("patient.fields.passportNumber")}
            value={maskIdentifier(patient.passportNumber)}
          />
          <DetailRow label={t("patient.fields.nationality")} value={patient.nationality ?? "—"} />
          <DetailRow label={t("patient.fields.occupation")} value={patient.occupation ?? "—"} />
          <DetailRow label={t("patient.fields.religion")} value={patient.religion ?? "—"} />
        </CardBody>
      </Card>

      {patient.notes && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("patient.sections.notes")}</h2>
          </div>
          <CardBody>
            <p className="text-sm text-slate-700">{patient.notes}</p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-3 text-sm text-slate-600">
          <DetailRow
            label={t("patient.detail.createdBy")}
            value={patient.createdBy ?? "—"}
          />
          <DetailRow
            label={t("patient.detail.updatedBy")}
            value={patient.updatedBy ?? "—"}
          />
          <DetailRow
            label={t("patient.detail.auditMeta")}
            value={new Date(patient.updatedAt).toLocaleString()}
          />
        </CardBody>
      </Card>

      <p className="text-sm text-slate-500">{t("patient.detail.noOperationalRecords")}</p>
    </div>
  );
}
