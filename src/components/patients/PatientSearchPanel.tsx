"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import {
  PATIENT_GENDERS,
  PATIENT_GENDER_I18N_KEYS,
} from "@/lib/patient/constants";
import type { PatientListRow } from "@/lib/patient/queries";
import { useI18n } from "@/lib/i18n/client";

type BranchOption = { id: string; code: string; name: string };

type PatientSearchPanelProps = {
  patients: PatientListRow[];
  total: number;
  page: number;
  totalPages: number;
  branches: BranchOption[];
  canCreate: boolean;
};

export function PatientSearchPanel({
  patients,
  total,
  page,
  totalPages,
  branches,
  canCreate,
}: PatientSearchPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "all";
  const gender = searchParams.get("gender") ?? "all";
  const registrationBranchId = searchParams.get("registrationBranchId") ?? "all";

  function updateFilters(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    router.push(`/patients?${params.toString()}`);
  }

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) params.delete("page");
    else params.set("page", String(nextPage));
    startTransition(() => {
      router.push(`/patients?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label={t("patient.filters.search")}
              name="search"
              defaultValue={search}
              placeholder={t("patient.filters.searchPlaceholder")}
              onBlur={(e) => updateFilters({ search: e.target.value })}
            />
            <Select
              label={t("patient.filters.status")}
              value={status}
              onChange={(e) => updateFilters({ status: e.target.value })}
            >
              <option value="all">{t("patient.filters.allStatuses")}</option>
              <option value="active">{t("patient.status.active")}</option>
              <option value="inactive">{t("patient.status.inactive")}</option>
            </Select>
            <Select
              label={t("patient.filters.gender")}
              value={gender}
              onChange={(e) => updateFilters({ gender: e.target.value })}
            >
              <option value="all">{t("patient.filters.allGenders")}</option>
              {PATIENT_GENDERS.map((value) => (
                <option key={value} value={value}>
                  {t(PATIENT_GENDER_I18N_KEYS[value])}
                </option>
              ))}
            </Select>
            <Select
              label={t("patient.filters.registrationBranch")}
              value={registrationBranchId}
              onChange={(e) => updateFilters({ registrationBranchId: e.target.value })}
            >
              <option value="all">{t("patient.filters.allBranches")}</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.code} — {branch.name}
                </option>
              ))}
            </Select>
          </div>
          {canCreate && (
            <div className="flex justify-end">
              <Link href="/patients/new">
                <Button type="button">{t("patient.actions.register")}</Button>
              </Link>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{t("patient.list.title")}</h2>
            <p className="text-sm text-slate-500">
              {total} {t("patient.list.total")}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{t("patient.fields.patientNumber")}</th>
                <th className="px-4 py-3">{t("patient.fields.fullName")}</th>
                <th className="px-4 py-3">{t("patient.fields.mobile")}</th>
                <th className="px-4 py-3">{t("patient.fields.gender")}</th>
                <th className="px-4 py-3">{t("patient.fields.ageDisplay")}</th>
                <th className="px-4 py-3">{t("patient.list.registrationBranch")}</th>
                <th className="px-4 py-3">{t("patient.fields.status")}</th>
                <th className="px-4 py-3">{t("patient.fields.lastUpdated")}</th>
                <th className="px-4 py-3 text-end">{t("patient.list.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 text-sm font-medium text-teal-700">
                    {patient.patientNumber}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {patient.fullName}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{patient.mobile ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {t(PATIENT_GENDER_I18N_KEYS[patient.gender])}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{patient.displayAge}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {patient.registrationBranchCode}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={patient.isActive ? "success" : "warning"}>
                      {patient.isActive
                        ? t("patient.status.active")
                        : t("patient.status.inactive")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(patient.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Link
                      href={`/patients/${patient.id}`}
                      className="text-sm font-medium text-teal-700 hover:text-teal-800"
                    >
                      {t("patient.actions.view")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {patients.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            {t("patient.list.empty")}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-sm">
            <span>
              {t("patient.list.page")} {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={page <= 1 || pending}
                onClick={() => goToPage(page - 1)}
              >
                {t("patient.list.previousPage")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={page >= totalPages || pending}
                onClick={() => goToPage(page + 1)}
              >
                {t("patient.list.nextPage")}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
