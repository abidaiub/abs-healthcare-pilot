"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  activateMedicationAction,
  archiveMedicationAction,
  deactivateMedicationAction,
  restoreMedicationAction,
} from "@/app/actions/tenant-medications";
import { Badge, Button, Card, CardBody } from "@/components/ui";
import type { MedicationCatalogStatus } from "@/generated/prisma/client";
import { canTransitionMedicationStatus, MEDICATION_STATUS_I18N_KEYS } from "@/lib/medication/constants";
import { useI18n } from "@/lib/i18n/client";

export type MedicationDetailData = {
  id: string;
  internalCode: string;
  brandName: string;
  genericDisplayName: string | null;
  displayStrength: string | null;
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
  status: MedicationCatalogStatus;
  generic: { genericName: string; genericCode: string } | null;
  manufacturer: { name: string } | null;
  category: { displayName: string } | null;
  dosageForm: { displayName: string } | null;
  route: { displayName: string; code: string } | null;
  unit: { displayName: string } | null;
  branchMappings: { isAvailable: boolean; branch: { code: string; name: string } }[];
};

function statusVariant(status: MedicationCatalogStatus) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "DRAFT") return "info" as const;
  if (status === "INACTIVE") return "warning" as const;
  return "default" as const;
}

export function MedicationDetailPanel({
  medication,
  canEdit,
}: {
  medication: MedicationDetailData;
  canEdit: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function runStatusAction(action: () => Promise<{ ok: boolean; errorCode?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(t(`pharmacy.errors.${result.errorCode}`, t("pharmacy.errors.generic")));
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-semibold text-teal-700">{medication.internalCode}</span>
          <Badge variant={statusVariant(medication.status)}>
            {t(MEDICATION_STATUS_I18N_KEYS[medication.status])}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/pharmacy/medications">
            <Button type="button" variant="ghost">{t("pharmacy.actions.backToList")}</Button>
          </Link>
          {canEdit && (
            <Link href={`/pharmacy/medications/${medication.id}/edit`}>
              <Button type="button" variant="secondary">{t("pharmacy.actions.edit")}</Button>
            </Link>
          )}
          {canEdit && canTransitionMedicationStatus(medication.status, "ACTIVE") && (
            <Button type="button" disabled={pending} onClick={() => runStatusAction(() => activateMedicationAction(medication.id))}>
              {t("pharmacy.actions.activate")}
            </Button>
          )}
          {canEdit && canTransitionMedicationStatus(medication.status, "INACTIVE") && medication.status === "ACTIVE" && (
            <Button type="button" variant="secondary" disabled={pending} onClick={() => runStatusAction(() => deactivateMedicationAction(medication.id))}>
              {t("pharmacy.actions.deactivate")}
            </Button>
          )}
          {canEdit && canTransitionMedicationStatus(medication.status, "INACTIVE") && medication.status === "ARCHIVED" && (
            <Button type="button" variant="secondary" disabled={pending} onClick={() => runStatusAction(() => restoreMedicationAction(medication.id))}>
              {t("pharmacy.actions.restore")}
            </Button>
          )}
          {canEdit && canTransitionMedicationStatus(medication.status, "ARCHIVED") && (
            <Button type="button" variant="secondary" disabled={pending} onClick={() => runStatusAction(() => archiveMedicationAction(medication.id))}>
              {t("pharmacy.actions.archive")}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{medication.brandName}</h2>
        </div>
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div><dt className="text-xs uppercase text-slate-500">{t("pharmacy.fields.genericName")}</dt><dd>{medication.genericDisplayName ?? medication.generic?.genericName ?? "—"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("pharmacy.fields.manufacturer")}</dt><dd>{medication.manufacturer?.name ?? "—"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("pharmacy.fields.displayStrength")}</dt><dd>{medication.displayStrength ?? "—"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("pharmacy.fields.dosageForm")}</dt><dd>{medication.dosageForm?.displayName ?? "—"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("pharmacy.fields.route")}</dt><dd>{medication.route?.displayName ?? medication.routeCode ?? "—"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("pharmacy.fields.category")}</dt><dd>{medication.category?.displayName ?? "—"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("pharmacy.fields.sku")}</dt><dd>{medication.sku ?? "—"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("pharmacy.fields.barcode")}</dt><dd>{medication.barcode ?? "—"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("pharmacy.fields.packSize")}</dt><dd>{medication.packSize ?? "—"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("pharmacy.fields.defaultDose")}</dt><dd>{medication.defaultDose ?? "—"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("pharmacy.fields.defaultFrequency")}</dt><dd>{medication.defaultFrequency ?? "—"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">{t("pharmacy.fields.defaultDuration")}</dt><dd>{medication.defaultDuration ?? "—"}</dd></div>
          <div className="sm:col-span-2 lg:col-span-3"><dt className="text-xs uppercase text-slate-500">{t("pharmacy.fields.defaultInstructions")}</dt><dd>{medication.defaultInstructions ?? "—"}</dd></div>
        </CardBody>
      </Card>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{t("pharmacy.sections.flags")}</h2>
        </div>
        <CardBody className="flex flex-wrap gap-4 text-sm">
          <Badge variant={medication.isPrescriptionEnabled ? "success" : "default"}>{t("pharmacy.fields.isPrescriptionEnabled")}</Badge>
          <Badge variant={medication.isControlledMedicine ? "warning" : "default"}>{t("pharmacy.fields.isControlledMedicine")}</Badge>
          <Badge variant={medication.requiresPrescription ? "info" : "default"}>{t("pharmacy.fields.requiresPrescription")}</Badge>
        </CardBody>
      </Card>

      {medication.branchMappings.length > 0 && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">{t("pharmacy.sections.branches")}</h2>
          </div>
          <CardBody className="space-y-2 text-sm">
            {medication.branchMappings.map((row, index) => (
              <div key={index} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                <span>{row.branch.code} — {row.branch.name}</span>
                <Badge variant={row.isAvailable ? "success" : "default"}>
                  {row.isAvailable ? t("pharmacy.fields.available") : t("pharmacy.status.inactive")}
                </Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
