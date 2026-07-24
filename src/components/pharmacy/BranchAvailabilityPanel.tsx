"use client";

import { useMemo, useState, useTransition } from "react";
import {
  getMedicationByIdAction,
  listMedicationsAction,
  updateBranchMedicationAvailabilityAction,
} from "@/app/actions/tenant-medications";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import { useI18n } from "@/lib/i18n/client";

type MedicationOption = {
  id: string;
  internalCode: string;
  brandName: string;
  displayStrength: string | null;
};

type BranchOption = {
  id: string;
  code: string;
  name: string;
};

type BranchMapping = {
  branchId: string;
  isAvailable: boolean;
  branch: { code: string; name: string };
};

export function BranchAvailabilityPanel({
  medications: initialMedications,
  branches,
  canEdit,
}: {
  medications: MedicationOption[];
  branches: BranchOption[];
  canEdit: boolean;
}) {
  const { t } = useI18n();
  const [medications, setMedications] = useState(initialMedications);
  const [query, setQuery] = useState("");
  const [medicationId, setMedicationId] = useState(initialMedications[0]?.id ?? "");
  const [mappings, setMappings] = useState<BranchMapping[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedMedication = useMemo(
    () => medications.find((row) => row.id === medicationId) ?? null,
    [medications, medicationId],
  );

  function searchMedications() {
    startTransition(async () => {
      const rows = await listMedicationsAction({ query: query.trim() || undefined, status: "ACTIVE" });
      setMedications(
        rows.map((row: MedicationOption) => ({
          id: row.id,
          internalCode: row.internalCode,
          brandName: row.brandName,
          displayStrength: row.displayStrength,
        })),
      );
    });
  }

  function loadMappings(nextMedicationId: string) {
    setMedicationId(nextMedicationId);
    if (!nextMedicationId) {
      setMappings([]);
      return;
    }
    startTransition(async () => {
      try {
        const item = await getMedicationByIdAction(nextMedicationId);
        setMappings(
          item.branchMappings.map((row: { branchId: string; isAvailable: boolean; branch: { code: string; name: string } }) => ({
            branchId: row.branchId,
            isAvailable: row.isAvailable,
            branch: row.branch,
          })),
        );
        setError(null);
      } catch {
        setError(t("pharmacy.errors.MEDICATION_NOT_FOUND"));
      }
    });
  }

  function toggleAvailability(branchId: string, isAvailable: boolean) {
    if (!medicationId || !canEdit) return;
    startTransition(async () => {
      const result = await updateBranchMedicationAvailabilityAction({
        medicationId,
        branchId,
        isAvailable,
      });
      if (!result.ok) {
        setError(t(`pharmacy.errors.${result.errorCode}`, t("pharmacy.errors.generic")));
        return;
      }
      setError(null);
      setMessage(t("pharmacy.messages.availabilityUpdated"));
      setMappings((current) =>
        current.map((row) => (row.branchId === branchId ? { ...row, isAvailable } : row)),
      );
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>
      )}

      <Card>
        <CardBody className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <Input
            label={t("pharmacy.fields.query")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("pharmacy.fields.brandName")}
          />
          <Button type="button" disabled={pending} onClick={searchMedications}>
            {t("pharmacy.fields.search")}
          </Button>
          <Select
            label={t("pharmacy.fields.medication")}
            value={medicationId}
            onChange={(event) => loadMappings(event.target.value)}
            disabled={pending}
          >
            <option value="">—</option>
            {medications.map((row) => (
              <option key={row.id} value={row.id}>
                {row.internalCode} — {row.brandName}
                {row.displayStrength ? ` (${row.displayStrength})` : ""}
              </option>
            ))}
          </Select>
        </CardBody>
      </Card>

      {selectedMedication && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">
              {selectedMedication.internalCode} — {selectedMedication.brandName}
            </h2>
          </div>
          <CardBody className="space-y-3">
            {branches.map((branch) => {
              const mapping = mappings.find((row) => row.branchId === branch.id);
              const isAvailable = mapping?.isAvailable ?? false;
              return (
                <div key={branch.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-sm font-medium">{branch.code} — {branch.name}</p>
                    <Badge variant={isAvailable ? "success" : "default"}>
                      {isAvailable ? t("pharmacy.fields.available") : t("pharmacy.status.inactive")}
                    </Badge>
                  </div>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => toggleAvailability(branch.id, !isAvailable)}
                    >
                      {t("pharmacy.actions.toggleAvailability")}
                    </Button>
                  )}
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
