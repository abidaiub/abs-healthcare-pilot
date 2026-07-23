"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_I18N_KEYS,
} from "@/lib/appointment/constants";
import type { AppointmentListRow } from "@/lib/appointment/queries";
import { useI18n } from "@/lib/i18n/client";

type BranchOption = { id: string; code: string; name: string };
type DoctorOption = { id: string; doctorCode: string; doctorName: string };

export function AppointmentListPanel({
  appointments,
  total,
  page,
  totalPages,
  branches,
  doctors,
  canCreate,
}: {
  appointments: AppointmentListRow[];
  total: number;
  page: number;
  totalPages: number;
  branches: BranchOption[];
  doctors: DoctorOption[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "all";
  const doctorId = searchParams.get("doctorId") ?? "all";
  const branchId = searchParams.get("branchId") ?? "all";
  const appointmentDate = searchParams.get("appointmentDate") ?? "";

  function updateFilters(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    router.push(`/appointments?${params.toString()}`);
  }

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) params.delete("page");
    else params.set("page", String(nextPage));
    startTransition(() => router.push(`/appointments?${params.toString()}`));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Input
            label={t("appointment.filters.search")}
            defaultValue={search}
            placeholder={t("appointment.filters.searchPlaceholder")}
            onBlur={(e) => updateFilters({ search: e.target.value })}
          />
          <Select
            label={t("appointment.filters.status")}
            value={status}
            onChange={(e) => updateFilters({ status: e.target.value })}
          >
            <option value="all">{t("appointment.filters.allStatuses")}</option>
            {APPOINTMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {t(APPOINTMENT_STATUS_I18N_KEYS[value])}
              </option>
            ))}
          </Select>
          <Select
            label={t("appointment.filters.doctor")}
            value={doctorId}
            onChange={(e) => updateFilters({ doctorId: e.target.value })}
          >
            <option value="all">{t("appointment.filters.allDoctors")}</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.doctorCode} — {doctor.doctorName}
              </option>
            ))}
          </Select>
          <Select
            label={t("appointment.filters.branch")}
            value={branchId}
            onChange={(e) => updateFilters({ branchId: e.target.value })}
          >
            <option value="all">{t("appointment.filters.allBranches")}</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.code} — {branch.name}
              </option>
            ))}
          </Select>
          <Input
            label={t("appointment.filters.date")}
            type="date"
            defaultValue={appointmentDate}
            onBlur={(e) => updateFilters({ appointmentDate: e.target.value })}
          />
        </CardBody>
      </Card>

      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{t("appointment.list.title")}</h2>
            <p className="text-sm text-slate-500">
              {total} {t("appointment.list.total")}
            </p>
          </div>
          {canCreate && (
            <Link href="/appointments/new">
              <Button type="button">{t("appointment.actions.book")}</Button>
            </Link>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{t("appointment.fields.appointmentNumber")}</th>
                <th className="px-4 py-3">{t("appointment.fields.patient")}</th>
                <th className="px-4 py-3">{t("appointment.fields.doctor")}</th>
                <th className="px-4 py-3">{t("appointment.fields.appointmentDate")}</th>
                <th className="px-4 py-3">{t("appointment.fields.timeSlot")}</th>
                <th className="px-4 py-3">{t("appointment.fields.queueToken")}</th>
                <th className="px-4 py-3">{t("appointment.fields.status")}</th>
                <th className="px-4 py-3 text-end">{t("appointment.actions.view")}</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-teal-700">{row.appointmentNumber}</td>
                  <td className="px-4 py-3 text-sm">{row.patientName}</td>
                  <td className="px-4 py-3 text-sm">{row.doctorName}</td>
                  <td className="px-4 py-3 text-sm">{new Date(row.appointmentDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">{row.timeSlot ?? "—"}</td>
                  <td className="px-4 py-3 text-sm">{row.queueToken ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="info">{t(APPOINTMENT_STATUS_I18N_KEYS[row.status])}</Badge>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Link href={`/appointments/${row.id}`} className="text-sm font-medium text-teal-700">
                      {t("appointment.actions.view")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {appointments.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-slate-500">{t("appointment.list.empty")}</div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-sm">
            <span>
              {t("appointment.list.page")} {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" disabled={page <= 1 || pending} onClick={() => goToPage(page - 1)}>
                {t("appointment.list.previousPage")}
              </Button>
              <Button type="button" variant="secondary" disabled={page >= totalPages || pending} onClick={() => goToPage(page + 1)}>
                {t("appointment.list.nextPage")}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
