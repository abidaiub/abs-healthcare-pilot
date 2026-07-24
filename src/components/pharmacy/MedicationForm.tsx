"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import {
  createMedicationAction,
  updateMedicationAction,
  type MedicationActionResult,
} from "@/app/actions/tenant-medications";
import { Badge, Button, Card, CardBody, Input, Select, Textarea } from "@/components/ui";
import type { MedicationCatalogStatus } from "@/generated/prisma/client";
import { MEDICATION_STATUS_I18N_KEYS } from "@/lib/medication/constants";
import { useI18n } from "@/lib/i18n/client";

type ReferenceOption = { id: string; displayName: string; code?: string };
type GenericOption = { id: string; genericName: string; genericCode: string };
type ManufacturerOption = { id: string; name: string };
type BranchOption = { id: string; code: string; name: string };

export type MedicationFormValues = {
  brandName: string;
  genericId: string;
  manufacturerId: string;
  categoryId: string;
  dosageFormId: string;
  routeId: string;
  unitId: string;
  genericDisplayName: string;
  strengthValue: string;
  strengthUnit: string;
  denominatorValue: string;
  denominatorUnit: string;
  routeCode: string;
  sku: string;
  barcode: string;
  packSize: string;
  packDescription: string;
  defaultDose: string;
  defaultFrequency: string;
  defaultDuration: string;
  defaultInstructions: string;
  isPrescriptionEnabled: boolean;
  isControlledMedicine: boolean;
  requiresPrescription: boolean;
  branchIds: string[];
};

const STRENGTH_UNITS = ["mg", "g", "mcg", "ml", "iu", "%"];

function decimalToInput(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

export function medicationRecordToFormValues(item: {
  brandName: string;
  genericId: string | null;
  manufacturerId: string | null;
  categoryId: string | null;
  dosageFormId: string | null;
  routeId: string | null;
  unitId: string | null;
  genericDisplayName: string | null;
  strengthValue: unknown;
  strengthUnit: string | null;
  denominatorValue: unknown;
  denominatorUnit: string | null;
  routeCode: string | null;
  sku: string | null;
  barcode: string | null;
  packSize: string | null;
  packDescription: string | null;
  defaultDose: string | null;
  defaultFrequency: string | null;
  defaultDuration: string | null;
  defaultInstructions: string | null;
  isPrescriptionEnabled: boolean;
  isControlledMedicine: boolean;
  requiresPrescription: boolean;
  branchMappings?: { branchId: string }[];
}): MedicationFormValues {
  return {
    brandName: item.brandName,
    genericId: item.genericId ?? "",
    manufacturerId: item.manufacturerId ?? "",
    categoryId: item.categoryId ?? "",
    dosageFormId: item.dosageFormId ?? "",
    routeId: item.routeId ?? "",
    unitId: item.unitId ?? "",
    genericDisplayName: item.genericDisplayName ?? "",
    strengthValue: decimalToInput(item.strengthValue),
    strengthUnit: item.strengthUnit ?? "",
    denominatorValue: decimalToInput(item.denominatorValue),
    denominatorUnit: item.denominatorUnit ?? "",
    routeCode: item.routeCode ?? "",
    sku: item.sku ?? "",
    barcode: item.barcode ?? "",
    packSize: item.packSize ?? "",
    packDescription: item.packDescription ?? "",
    defaultDose: item.defaultDose ?? "",
    defaultFrequency: item.defaultFrequency ?? "",
    defaultDuration: item.defaultDuration ?? "",
    defaultInstructions: item.defaultInstructions ?? "",
    isPrescriptionEnabled: item.isPrescriptionEnabled,
    isControlledMedicine: item.isControlledMedicine,
    requiresPrescription: item.requiresPrescription,
    branchIds: item.branchMappings?.map((row) => row.branchId) ?? [],
  };
}

function appendFormValues(formData: FormData, values: MedicationFormValues) {
  formData.set("brandName", values.brandName);
  if (values.genericId) formData.set("genericId", values.genericId);
  if (values.manufacturerId) formData.set("manufacturerId", values.manufacturerId);
  if (values.categoryId) formData.set("categoryId", values.categoryId);
  if (values.dosageFormId) formData.set("dosageFormId", values.dosageFormId);
  if (values.routeId) formData.set("routeId", values.routeId);
  if (values.unitId) formData.set("unitId", values.unitId);
  if (values.genericDisplayName) formData.set("genericDisplayName", values.genericDisplayName);
  if (values.strengthValue) formData.set("strengthValue", values.strengthValue);
  if (values.strengthUnit) formData.set("strengthUnit", values.strengthUnit);
  if (values.denominatorValue) formData.set("denominatorValue", values.denominatorValue);
  if (values.denominatorUnit) formData.set("denominatorUnit", values.denominatorUnit);
  if (values.routeCode) formData.set("routeCode", values.routeCode);
  if (values.sku) formData.set("sku", values.sku);
  if (values.barcode) formData.set("barcode", values.barcode);
  if (values.packSize) formData.set("packSize", values.packSize);
  if (values.packDescription) formData.set("packDescription", values.packDescription);
  if (values.defaultDose) formData.set("defaultDose", values.defaultDose);
  if (values.defaultFrequency) formData.set("defaultFrequency", values.defaultFrequency);
  if (values.defaultDuration) formData.set("defaultDuration", values.defaultDuration);
  if (values.defaultInstructions) formData.set("defaultInstructions", values.defaultInstructions);
  if (values.isPrescriptionEnabled) formData.set("isPrescriptionEnabled", "true");
  if (values.isControlledMedicine) formData.set("isControlledMedicine", "true");
  if (values.requiresPrescription) formData.set("requiresPrescription", "true");
  if (values.branchIds.length) formData.set("branchIds", values.branchIds.join(","));
}

function handleMedicationResult(
  result: MedicationActionResult,
  t: (key: string, fallback?: string) => string,
): string | null {
  if (!result.ok) {
    return t(`pharmacy.errors.${result.errorCode}`, t("pharmacy.errors.generic"));
  }
  return null;
}

export function MedicationForm({
  mode,
  medicationId,
  internalCode,
  status,
  initialValues,
  generics,
  manufacturers,
  referenceData,
  branches,
  canEdit,
}: {
  mode: "create" | "edit";
  medicationId?: string;
  internalCode?: string;
  status?: MedicationCatalogStatus;
  initialValues?: MedicationFormValues;
  generics: GenericOption[];
  manufacturers: ManufacturerOption[];
  referenceData: {
    dosageForms: ReferenceOption[];
    routes: ReferenceOption[];
    categories: ReferenceOption[];
    units: ReferenceOption[];
  };
  branches: BranchOption[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [values, setValues] = useState<MedicationFormValues>(
    initialValues ?? {
      brandName: "",
      genericId: "",
      manufacturerId: "",
      categoryId: "",
      dosageFormId: "",
      routeId: "",
      unitId: "",
      genericDisplayName: "",
      strengthValue: "",
      strengthUnit: "",
      denominatorValue: "",
      denominatorUnit: "",
      routeCode: "",
      sku: "",
      barcode: "",
      packSize: "",
      packDescription: "",
      defaultDose: "",
      defaultFrequency: "",
      defaultDuration: "",
      defaultInstructions: "",
      isPrescriptionEnabled: true,
      isControlledMedicine: false,
      requiresPrescription: true,
      branchIds: [],
    },
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const disabled = !canEdit || pending;

  const selectedGenericName = useMemo(
    () => generics.find((row) => row.id === values.genericId)?.genericName ?? "",
    [generics, values.genericId],
  );

  function updateField<K extends keyof MedicationFormValues>(key: K, value: MedicationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleBranch(branchId: string) {
    setValues((current) => ({
      ...current,
      branchIds: current.branchIds.includes(branchId)
        ? current.branchIds.filter((id) => id !== branchId)
        : [...current.branchIds, branchId],
    }));
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData();
    appendFormValues(formData, values);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createMedicationAction(formData)
          : await updateMedicationAction(medicationId!, formData);
      const message = handleMedicationResult(result, t);
      if (message) {
        setError(message);
        return;
      }
      setError(null);
      if (!result.ok) return;
      const nextId = result.medicationId ?? medicationId;
      router.push(nextId ? `/pharmacy/medications/${nextId}` : "/pharmacy/medications");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {mode === "edit" && internalCode && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-semibold text-teal-700">{internalCode}</span>
          {status && (
            <Badge variant={status === "ACTIVE" ? "success" : status === "DRAFT" ? "info" : "default"}>
              {t(MEDICATION_STATUS_I18N_KEYS[status])}
            </Badge>
          )}
        </div>
      )}

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("pharmacy.sections.identity")}</h2>
        </div>
        <CardBody className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Input
            label={t("pharmacy.fields.brandName")}
            value={values.brandName}
            onChange={(event) => updateField("brandName", event.target.value)}
            required
            disabled={disabled}
          />
          <Select
            label={t("pharmacy.fields.genericName")}
            value={values.genericId}
            onChange={(event) => updateField("genericId", event.target.value)}
            disabled={disabled}
          >
            <option value="">—</option>
            {generics.map((row) => (
              <option key={row.id} value={row.id}>
                {row.genericName} ({row.genericCode})
              </option>
            ))}
          </Select>
          <Input
            label={t("pharmacy.fields.genericDisplayName")}
            value={values.genericDisplayName}
            onChange={(event) => updateField("genericDisplayName", event.target.value)}
            placeholder={selectedGenericName}
            disabled={disabled}
          />
          <Select
            label={t("pharmacy.fields.manufacturer")}
            value={values.manufacturerId}
            onChange={(event) => updateField("manufacturerId", event.target.value)}
            disabled={disabled}
          >
            <option value="">—</option>
            {manufacturers.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </Select>
          <Select
            label={t("pharmacy.fields.category")}
            value={values.categoryId}
            onChange={(event) => updateField("categoryId", event.target.value)}
            disabled={disabled}
          >
            <option value="">—</option>
            {referenceData.categories.map((row) => (
              <option key={row.id} value={row.id}>
                {row.displayName}
              </option>
            ))}
          </Select>
          <Select
            label={t("pharmacy.fields.dosageForm")}
            value={values.dosageFormId}
            onChange={(event) => updateField("dosageFormId", event.target.value)}
            disabled={disabled}
          >
            <option value="">—</option>
            {referenceData.dosageForms.map((row) => (
              <option key={row.id} value={row.id}>
                {row.displayName}
              </option>
            ))}
          </Select>
          <Select
            label={t("pharmacy.fields.route")}
            value={values.routeId}
            onChange={(event) => updateField("routeId", event.target.value)}
            disabled={disabled}
          >
            <option value="">—</option>
            {referenceData.routes.map((row) => (
              <option key={row.id} value={row.id}>
                {row.displayName}
              </option>
            ))}
          </Select>
          <Select
            label={t("pharmacy.fields.unit")}
            value={values.unitId}
            onChange={(event) => updateField("unitId", event.target.value)}
            disabled={disabled}
          >
            <option value="">—</option>
            {referenceData.units.map((row) => (
              <option key={row.id} value={row.id}>
                {row.displayName}
              </option>
            ))}
          </Select>
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("pharmacy.sections.strength")}</h2>
        </div>
        <CardBody className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Input
            label={t("pharmacy.fields.strengthValue")}
            type="number"
            step="any"
            value={values.strengthValue}
            onChange={(event) => updateField("strengthValue", event.target.value)}
            disabled={disabled}
          />
          <Select
            label={t("pharmacy.fields.strengthUnit")}
            value={values.strengthUnit}
            onChange={(event) => updateField("strengthUnit", event.target.value)}
            disabled={disabled}
          >
            <option value="">—</option>
            {STRENGTH_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </Select>
          <Input
            label={t("pharmacy.fields.denominatorValue")}
            type="number"
            step="any"
            value={values.denominatorValue}
            onChange={(event) => updateField("denominatorValue", event.target.value)}
            disabled={disabled}
          />
          <Input
            label={t("pharmacy.fields.denominatorUnit")}
            value={values.denominatorUnit}
            onChange={(event) => updateField("denominatorUnit", event.target.value)}
            disabled={disabled}
          />
          <Input
            label={t("pharmacy.fields.routeCode")}
            value={values.routeCode}
            onChange={(event) => updateField("routeCode", event.target.value)}
            disabled={disabled}
            className="md:col-span-2"
          />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("pharmacy.sections.packaging")}</h2>
        </div>
        <CardBody className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Input label={t("pharmacy.fields.sku")} value={values.sku} onChange={(event) => updateField("sku", event.target.value)} disabled={disabled} />
          <Input label={t("pharmacy.fields.barcode")} value={values.barcode} onChange={(event) => updateField("barcode", event.target.value)} disabled={disabled} />
          <Input label={t("pharmacy.fields.packSize")} value={values.packSize} onChange={(event) => updateField("packSize", event.target.value)} disabled={disabled} />
          <Textarea label={t("pharmacy.fields.packDescription")} value={values.packDescription} onChange={(event) => updateField("packDescription", event.target.value)} disabled={disabled} rows={2} className="md:col-span-2 lg:col-span-3" />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("pharmacy.sections.defaults")}</h2>
        </div>
        <CardBody className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Input label={t("pharmacy.fields.defaultDose")} value={values.defaultDose} onChange={(event) => updateField("defaultDose", event.target.value)} disabled={disabled} />
          <Input label={t("pharmacy.fields.defaultFrequency")} value={values.defaultFrequency} onChange={(event) => updateField("defaultFrequency", event.target.value)} disabled={disabled} />
          <Input label={t("pharmacy.fields.defaultDuration")} value={values.defaultDuration} onChange={(event) => updateField("defaultDuration", event.target.value)} disabled={disabled} />
          <Textarea label={t("pharmacy.fields.defaultInstructions")} value={values.defaultInstructions} onChange={(event) => updateField("defaultInstructions", event.target.value)} disabled={disabled} rows={2} className="md:col-span-2 lg:col-span-3" />
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("pharmacy.sections.flags")}</h2>
        </div>
        <CardBody className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={values.isPrescriptionEnabled} onChange={(event) => updateField("isPrescriptionEnabled", event.target.checked)} disabled={disabled} />
            {t("pharmacy.fields.isPrescriptionEnabled")}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={values.isControlledMedicine} onChange={(event) => updateField("isControlledMedicine", event.target.checked)} disabled={disabled} />
            {t("pharmacy.fields.isControlledMedicine")}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={values.requiresPrescription} onChange={(event) => updateField("requiresPrescription", event.target.checked)} disabled={disabled} />
            {t("pharmacy.fields.requiresPrescription")}
          </label>
        </CardBody>
      </Card>

      {branches.length > 0 && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("pharmacy.sections.branches")}</h2>
          </div>
          <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => (
              <label key={branch.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={values.branchIds.includes(branch.id)}
                  onChange={() => toggleBranch(branch.id)}
                  disabled={disabled}
                />
                {branch.code} — {branch.name}
              </label>
            ))}
          </CardBody>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        {canEdit && (
          <Button type="submit" disabled={pending}>
            {t("pharmacy.actions.save")}
          </Button>
        )}
        <Link href={medicationId ? `/pharmacy/medications/${medicationId}` : "/pharmacy/medications"}>
          <Button type="button" variant="secondary">
            {t("pharmacy.actions.cancel")}
          </Button>
        </Link>
      </div>
    </form>
  );
}
