"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  checkPatientDuplicatesAction,
  createPatientAction,
  updatePatientAction,
  type PatientActionResult,
} from "@/app/actions/tenant-patients";
import { Badge, Button, Card, CardBody, Input, Select, Textarea } from "@/components/ui";
import {
  BLOOD_GROUPS,
  BLOOD_GROUP_I18N_KEYS,
  DUPLICATE_MATCH_I18N_KEYS,
  MARITAL_STATUSES,
  MARITAL_STATUS_I18N_KEYS,
  PATIENT_GENDERS,
  PATIENT_GENDER_I18N_KEYS,
} from "@/lib/patient/constants";
import type { DuplicateMatch } from "@/lib/patient/duplicates";
import { useI18n } from "@/lib/i18n/client";

type PatientFormValues = {
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  gender: string;
  dateOfBirth: string;
  estimatedAge: string;
  useEstimatedAge: boolean;
  bloodGroup: string;
  maritalStatus: string;
  nationality: string;
  countryCode: string;
  mobile: string;
  alternateMobile: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  postalCode: string;
  nationalId: string;
  passportNumber: string;
  occupation: string;
  religion: string;
  notes: string;
  guardianName: string;
  guardianRelation: string;
  guardianMobile: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactMobile: string;
};

const EMPTY_FORM: PatientFormValues = {
  firstName: "",
  middleName: "",
  lastName: "",
  preferredName: "",
  gender: "UNKNOWN",
  dateOfBirth: "",
  estimatedAge: "",
  useEstimatedAge: false,
  bloodGroup: "",
  maritalStatus: "",
  nationality: "",
  countryCode: "BD",
  mobile: "",
  alternateMobile: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  district: "",
  postalCode: "",
  nationalId: "",
  passportNumber: "",
  occupation: "",
  religion: "",
  notes: "",
  guardianName: "",
  guardianRelation: "",
  guardianMobile: "",
  emergencyContactName: "",
  emergencyContactRelation: "",
  emergencyContactMobile: "",
};

function formatDateInput(value: Date | null | undefined): string {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

function buildInitialValues(initial?: Partial<PatientFormValues>): PatientFormValues {
  return { ...EMPTY_FORM, ...initial };
}

type PatientFormProps = {
  mode: "create" | "edit";
  patientId?: string;
  patientNumber?: string;
  branchLabel: string;
  initialValues?: Partial<PatientFormValues>;
  canOverrideDuplicates?: boolean;
};

export function PatientForm({
  mode,
  patientId,
  patientNumber,
  branchLabel,
  initialValues,
  canOverrideDuplicates = false,
}: PatientFormProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [form, setForm] = useState<PatientFormValues>(() => buildInitialValues(initialValues));
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [overrideDuplicateWarning, setOverrideDuplicateWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState<{ patientId: string; patientNumber: string } | null>(
    null,
  );

  const hasCritical = useMemo(
    () => duplicates.some((match) => match.severity === "critical"),
    [duplicates],
  );

  function updateField<K extends keyof PatientFormValues>(key: K, value: PatientFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildFormData(): FormData {
    const formData = new FormData();
    for (const [key, value] of Object.entries(form)) {
      if (key === "useEstimatedAge") {
        formData.set(key, value ? "true" : "false");
      } else {
        formData.set(key, String(value ?? ""));
      }
    }
    formData.set("overrideDuplicateWarning", overrideDuplicateWarning ? "true" : "false");
    return formData;
  }

  function translateError(result: PatientActionResult | { ok: false; errorCode: string }) {
    if (result.ok) return null;
    return t(`patient.errors.${result.errorCode}`, t("patient.errors.generic"));
  }

  function handleDuplicateCheck() {
    startTransition(async () => {
      const result = await checkPatientDuplicatesAction(buildFormData(), patientId);
      if (!result.ok) {
        setError(translateError(result));
        return;
      }
      setDuplicates(result.duplicates);
      setError(null);
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    startTransition(async () => {
      const formData = buildFormData();
      const result =
        mode === "create"
          ? await createPatientAction(formData)
          : await updatePatientAction(patientId!, formData);

      if (!result.ok) {
        if (result.duplicates) setDuplicates(result.duplicates);
        setError(translateError(result));
        return;
      }

      setError(null);
      if (mode === "create" && result.patientId && result.patientNumber) {
        setSubmitted({ patientId: result.patientId, patientNumber: result.patientNumber });
        return;
      }

      router.push(`/patients/${result.patientId}`);
      router.refresh();
    });
  }

  if (submitted) {
    return (
      <Card>
        <CardBody className="space-y-4 py-10 text-center">
          <Badge variant="success">{t("patient.messages.created")}</Badge>
          <p className="text-sm text-slate-500">
            {t("patient.messages.assignedNumber")}:{" "}
            <span className="font-semibold text-slate-900">{submitted.patientNumber}</span>
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={`/patients/${submitted.patientId}`}>
              <Button type="button">{t("patient.actions.view")}</Button>
            </Link>
            <Button type="button" variant="secondary" onClick={() => router.push("/patients/new")}>
              {t("patient.actions.register")}
            </Button>
            <Link href="/patients">
              <Button type="button" variant="ghost">
                {t("patient.actions.backToList")}
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {t("patient.sections.identity")}
              </h2>
              <p className="text-sm text-slate-500">
                {t("patient.messages.currentBranch")}: {branchLabel}
              </p>
            </div>
            {patientNumber && (
              <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
                  {t("patient.fields.patientNumber")}
                </p>
                <p className="font-mono font-semibold text-teal-900">{patientNumber}</p>
              </div>
            )}
          </div>
        </div>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("patient.fields.firstName")}
            name="firstName"
            value={form.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            required
          />
          <Input
            label={t("patient.fields.middleName")}
            name="middleName"
            value={form.middleName}
            onChange={(e) => updateField("middleName", e.target.value)}
          />
          <Input
            label={t("patient.fields.lastName")}
            name="lastName"
            value={form.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
          />
          <Input
            label={t("patient.fields.preferredName")}
            name="preferredName"
            value={form.preferredName}
            onChange={(e) => updateField("preferredName", e.target.value)}
          />
          <Select
            label={t("patient.fields.gender")}
            name="gender"
            value={form.gender}
            onChange={(e) => updateField("gender", e.target.value)}
          >
            {PATIENT_GENDERS.map((value) => (
              <option key={value} value={value}>
                {t(PATIENT_GENDER_I18N_KEYS[value])}
              </option>
            ))}
          </Select>
          <Select
            label={t("patient.fields.bloodGroup")}
            name="bloodGroup"
            value={form.bloodGroup}
            onChange={(e) => updateField("bloodGroup", e.target.value)}
          >
            <option value="">{t("patient.bloodGroup.unknown")}</option>
            {BLOOD_GROUPS.map((value) => (
              <option key={value} value={value}>
                {t(BLOOD_GROUP_I18N_KEYS[value])}
              </option>
            ))}
          </Select>
          <Select
            label={t("patient.fields.maritalStatus")}
            name="maritalStatus"
            value={form.maritalStatus}
            onChange={(e) => updateField("maritalStatus", e.target.value)}
          >
            <option value="">{t("patient.maritalStatus.unknown")}</option>
            {MARITAL_STATUSES.map((value) => (
              <option key={value} value={value}>
                {t(MARITAL_STATUS_I18N_KEYS[value])}
              </option>
            ))}
          </Select>
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("patient.sections.dob")}</h2>
        </div>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.useEstimatedAge}
              onChange={(e) => updateField("useEstimatedAge", e.target.checked)}
              className="rounded border-slate-300"
            />
            {t("patient.fields.useEstimatedAge")}
          </label>
          {form.useEstimatedAge ? (
            <Input
              label={t("patient.fields.estimatedAge")}
              name="estimatedAge"
              type="number"
              min={0}
              max={130}
              value={form.estimatedAge}
              onChange={(e) => updateField("estimatedAge", e.target.value)}
            />
          ) : (
            <Input
              label={t("patient.fields.dateOfBirth")}
              name="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => updateField("dateOfBirth", e.target.value)}
            />
          )}
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("patient.sections.contact")}</h2>
        </div>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("patient.fields.mobile")}
            name="mobile"
            value={form.mobile}
            onChange={(e) => updateField("mobile", e.target.value)}
          />
          <Input
            label={t("patient.fields.alternateMobile")}
            name="alternateMobile"
            value={form.alternateMobile}
            onChange={(e) => updateField("alternateMobile", e.target.value)}
          />
          <Input
            label={t("patient.fields.email")}
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("patient.sections.address")}</h2>
        </div>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("patient.fields.addressLine1")}
            name="addressLine1"
            value={form.addressLine1}
            onChange={(e) => updateField("addressLine1", e.target.value)}
          />
          <Input
            label={t("patient.fields.addressLine2")}
            name="addressLine2"
            value={form.addressLine2}
            onChange={(e) => updateField("addressLine2", e.target.value)}
          />
          <Input
            label={t("patient.fields.city")}
            name="city"
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
          />
          <Input
            label={t("patient.fields.district")}
            name="district"
            value={form.district}
            onChange={(e) => updateField("district", e.target.value)}
          />
          <Input
            label={t("patient.fields.postalCode")}
            name="postalCode"
            value={form.postalCode}
            onChange={(e) => updateField("postalCode", e.target.value)}
          />
          <Input
            label={t("patient.fields.countryCode")}
            name="countryCode"
            value={form.countryCode}
            onChange={(e) => updateField("countryCode", e.target.value)}
          />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("patient.sections.guardian")}</h2>
        </div>
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <Input
            label={t("patient.fields.guardianName")}
            name="guardianName"
            value={form.guardianName}
            onChange={(e) => updateField("guardianName", e.target.value)}
          />
          <Input
            label={t("patient.fields.guardianRelation")}
            name="guardianRelation"
            value={form.guardianRelation}
            onChange={(e) => updateField("guardianRelation", e.target.value)}
          />
          <Input
            label={t("patient.fields.guardianMobile")}
            name="guardianMobile"
            value={form.guardianMobile}
            onChange={(e) => updateField("guardianMobile", e.target.value)}
          />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {t("patient.sections.emergency")}
          </h2>
        </div>
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <Input
            label={t("patient.fields.emergencyContactName")}
            name="emergencyContactName"
            value={form.emergencyContactName}
            onChange={(e) => updateField("emergencyContactName", e.target.value)}
          />
          <Input
            label={t("patient.fields.emergencyContactRelation")}
            name="emergencyContactRelation"
            value={form.emergencyContactRelation}
            onChange={(e) => updateField("emergencyContactRelation", e.target.value)}
          />
          <Input
            label={t("patient.fields.emergencyContactMobile")}
            name="emergencyContactMobile"
            value={form.emergencyContactMobile}
            onChange={(e) => updateField("emergencyContactMobile", e.target.value)}
          />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {t("patient.sections.identifiers")}
          </h2>
        </div>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("patient.fields.nationalId")}
            name="nationalId"
            value={form.nationalId}
            onChange={(e) => updateField("nationalId", e.target.value)}
          />
          <Input
            label={t("patient.fields.passportNumber")}
            name="passportNumber"
            value={form.passportNumber}
            onChange={(e) => updateField("passportNumber", e.target.value)}
          />
          <Input
            label={t("patient.fields.nationality")}
            name="nationality"
            value={form.nationality}
            onChange={(e) => updateField("nationality", e.target.value)}
          />
          <Input
            label={t("patient.fields.occupation")}
            name="occupation"
            value={form.occupation}
            onChange={(e) => updateField("occupation", e.target.value)}
          />
          <Input
            label={t("patient.fields.religion")}
            name="religion"
            value={form.religion}
            onChange={(e) => updateField("religion", e.target.value)}
          />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("patient.sections.notes")}</h2>
        </div>
        <CardBody>
          <Textarea
            label={t("patient.fields.notes")}
            name="notes"
            rows={3}
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("patient.sections.duplicate")}</h2>
        </div>
        <CardBody className="space-y-4">
          <Button type="button" variant="secondary" disabled={pending} onClick={handleDuplicateCheck}>
            {t("patient.actions.checkDuplicates")}
          </Button>
          {duplicates.length === 0 && (
            <p className="text-sm text-slate-500">{t("patient.duplicate.none")}</p>
          )}
          {duplicates.length > 0 && (
            <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
              <p className="font-medium text-amber-900">
                {hasCritical ? t("patient.duplicate.critical") : t("patient.duplicate.warning")}
              </p>
              <ul className="space-y-2">
                {duplicates.map((match) => (
                  <li key={`${match.patientId}-${match.matchType}`} className="text-amber-900">
                    {match.patientNumber} — {match.fullName} (
                    {t(DUPLICATE_MATCH_I18N_KEYS[match.matchType])})
                  </li>
                ))}
              </ul>
              {(!hasCritical || canOverrideDuplicates) && (
                <label className="flex items-center gap-2 text-sm text-amber-900">
                  <input
                    type="checkbox"
                    checked={overrideDuplicateWarning}
                    onChange={(e) => setOverrideDuplicateWarning(e.target.checked)}
                    className="rounded border-amber-300"
                  />
                  {t("patient.duplicate.continue")}
                </label>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <Link href={patientId ? `/patients/${patientId}` : "/patients"}>
          <Button type="button" variant="secondary">
            {t("patient.actions.cancel")}
          </Button>
        </Link>
        <Button type="submit" disabled={pending}>
          {t("patient.actions.save")}
        </Button>
      </div>
    </form>
  );
}

export function patientRecordToFormValues(patient: {
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  preferredName: string | null;
  gender: string;
  dateOfBirth: Date | null;
  estimatedAge: number | null;
  bloodGroup: string | null;
  maritalStatus: string | null;
  nationality: string | null;
  countryCode: string | null;
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
}): Partial<PatientFormValues> {
  return {
    firstName: patient.firstName,
    middleName: patient.middleName ?? "",
    lastName: patient.lastName ?? "",
    preferredName: patient.preferredName ?? "",
    gender: patient.gender,
    dateOfBirth: formatDateInput(patient.dateOfBirth),
    estimatedAge: patient.estimatedAge != null ? String(patient.estimatedAge) : "",
    useEstimatedAge: patient.dateOfBirth == null && patient.estimatedAge != null,
    bloodGroup: patient.bloodGroup ?? "",
    maritalStatus: patient.maritalStatus ?? "",
    nationality: patient.nationality ?? "",
    countryCode: patient.countryCode ?? "BD",
    mobile: patient.mobile ?? "",
    alternateMobile: patient.alternateMobile ?? "",
    email: patient.email ?? "",
    addressLine1: patient.addressLine1 ?? "",
    addressLine2: patient.addressLine2 ?? "",
    city: patient.city ?? "",
    district: patient.district ?? "",
    postalCode: patient.postalCode ?? "",
    nationalId: patient.nationalId ?? "",
    passportNumber: patient.passportNumber ?? "",
    occupation: patient.occupation ?? "",
    religion: patient.religion ?? "",
    notes: patient.notes ?? "",
    guardianName: patient.guardianName ?? "",
    guardianRelation: patient.guardianRelation ?? "",
    guardianMobile: patient.guardianMobile ?? "",
    emergencyContactName: patient.emergencyContactName ?? "",
    emergencyContactRelation: patient.emergencyContactRelation ?? "",
    emergencyContactMobile: patient.emergencyContactMobile ?? "",
  };
}
