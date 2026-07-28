"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  deactivateDoctorScheduleAction,
  saveDoctorScheduleAction,
  setDoctorSchedulePublishedAction,
} from "@/app/actions/tenant-doctor-schedules";
import { Badge, Button, Card, CardBody, Input, Select } from "@/components/ui";
import {
  DAYS_OF_WEEK,
  DAY_OF_WEEK_I18N_KEYS,
  SLOT_DURATION_OPTIONS,
  generateShiftSlots,
  type DayOfWeek,
} from "@/lib/doctor-schedule/constants";
import type { DoctorScheduleRow, ScheduleDoctorOption } from "@/lib/doctor-schedule/queries";
import { useI18n } from "@/lib/i18n/client";

type Props = {
  schedules: DoctorScheduleRow[];
  doctors: ScheduleDoctorOption[];
  branchLabel: string;
  canEdit: boolean;
  canPublish: boolean;
  canDelete: boolean;
};

const EMPTY_FORM = {
  scheduleId: "",
  expectedStateVersion: "",
  doctorId: "",
  dayOfWeek: "0",
  startTime: "09:00",
  endTime: "13:00",
  slotDuration: "30",
  chamber: "",
};

export function DoctorSchedulePanel({
  schedules,
  doctors,
  branchLabel,
  canEdit,
  canPublish,
  canDelete,
}: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ ...EMPTY_FORM, doctorId: doctors[0]?.id ?? "" });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isEditing = Boolean(form.scheduleId);

  const doctorOptions = useMemo(() => {
    if (!isEditing || !form.doctorId) return doctors;
    if (doctors.some((doctor) => doctor.id === form.doctorId)) return doctors;
    const row = schedules.find((schedule) => schedule.id === form.scheduleId);
    if (!row) return doctors;
    return [
      {
        id: row.doctorId,
        doctorCode: row.doctorCode,
        doctorName: row.doctorName,
        specialty: null,
      },
      ...doctors,
    ];
  }, [doctors, form.doctorId, form.scheduleId, isEditing, schedules]);

  const previewSlots = useMemo(
    () => generateShiftSlots(form.startTime, form.endTime, Number(form.slotDuration)),
    [form.startTime, form.endTime, form.slotDuration],
  );

  function updateForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm({ ...EMPTY_FORM, doctorId: doctors[0]?.id ?? "" });
    setError(null);
  }

  function showError(errorCode: string) {
    setNotice(null);
    setError(t(`doctorSchedule.errors.${errorCode}`, t("doctorSchedule.errors.generic")));
  }

  function handleSave() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await saveDoctorScheduleAction({
        scheduleId: form.scheduleId || undefined,
        expectedStateVersion: form.expectedStateVersion
          ? Number(form.expectedStateVersion)
          : undefined,
        doctorId: form.doctorId,
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        slotDuration: Number(form.slotDuration),
        chamber: form.chamber,
      });

      if (!result.ok) {
        showError(result.errorCode);
        return;
      }
      resetForm();
      setNotice(t("doctorSchedule.messages.saved"));
      router.refresh();
    });
  }

  function handlePublish(row: DoctorScheduleRow, next: boolean) {
    if (!next && !window.confirm(t("doctorSchedule.messages.confirmUnpublish"))) return;
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await setDoctorSchedulePublishedAction(
        row.id,
        next,
        row.stateVersion,
      );
      if (!result.ok) {
        showError(result.errorCode);
        return;
      }
      setNotice(
        next
          ? t("doctorSchedule.messages.published")
          : t("doctorSchedule.messages.unpublished"),
      );
      router.refresh();
    });
  }

  function handleDeactivate(row: DoctorScheduleRow) {
    if (!window.confirm(t("doctorSchedule.messages.confirmDeactivate"))) return;
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await deactivateDoctorScheduleAction(row.id, row.stateVersion);
      if (!result.ok) {
        showError(result.errorCode);
        return;
      }
      setNotice(t("doctorSchedule.messages.deactivated"));
      router.refresh();
    });
  }

  function handleEdit(row: DoctorScheduleRow) {
    setError(null);
    setNotice(null);
    setForm({
      scheduleId: row.id,
      expectedStateVersion: String(row.stateVersion),
      doctorId: row.doctorId,
      dayOfWeek: String(row.dayOfWeek),
      startTime: row.startTime,
      endTime: row.endTime,
      slotDuration: String(row.slotDuration),
      chamber: row.chamber ?? "",
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-900">
            {t("doctorSchedule.sections.list")}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {t("doctorSchedule.hints.branchScope")} — {branchLabel}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{t("doctorSchedule.fields.doctor")}</th>
                <th className="px-4 py-3">{t("doctorSchedule.fields.dayOfWeek")}</th>
                <th className="px-4 py-3">{t("doctorSchedule.fields.startTime")}</th>
                <th className="px-4 py-3">{t("doctorSchedule.fields.endTime")}</th>
                <th className="px-4 py-3">{t("doctorSchedule.fields.slotDuration")}</th>
                <th className="px-4 py-3">{t("doctorSchedule.fields.slots")}</th>
                <th className="px-4 py-3">{t("doctorSchedule.fields.chamber")}</th>
                <th className="px-4 py-3">{t("doctorSchedule.fields.state")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    {t("doctorSchedule.messages.empty")}
                  </td>
                </tr>
              ) : (
                schedules.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="px-4 py-3">
                      <span className="font-medium">{row.doctorName}</span>
                      <span className="ml-2 font-mono text-xs text-slate-500">
                        {row.doctorCode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t(DAY_OF_WEEK_I18N_KEYS[row.dayOfWeek as DayOfWeek])}
                    </td>
                    <td className="px-4 py-3 font-mono">{row.startTime}</td>
                    <td className="px-4 py-3 font-mono">{row.endTime}</td>
                    <td className="px-4 py-3">{row.slotDuration}</td>
                    <td className="px-4 py-3">{row.slotCount}</td>
                    <td className="px-4 py-3 text-slate-600">{row.chamber ?? "—"}</td>
                    <td className="px-4 py-3">
                      {!row.isActive ? (
                        <Badge>{t("doctorSchedule.state.inactive")}</Badge>
                      ) : row.isPublished ? (
                        <Badge variant="success">{t("doctorSchedule.state.published")}</Badge>
                      ) : (
                        <Badge variant="warning">{t("doctorSchedule.state.draft")}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {canEdit && row.isActive && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleEdit(row)}
                            disabled={pending}
                          >
                            {t("doctorSchedule.actions.edit")}
                          </Button>
                        )}
                        {canPublish && row.isActive && (
                          <Button
                            type="button"
                            variant={row.isPublished ? "secondary" : "primary"}
                            onClick={() => handlePublish(row, !row.isPublished)}
                            disabled={pending}
                          >
                            {row.isPublished
                              ? t("doctorSchedule.actions.unpublish")
                              : t("doctorSchedule.actions.publish")}
                          </Button>
                        )}
                        {canDelete && row.isActive && (
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => handleDeactivate(row)}
                            disabled={pending}
                          >
                            {t("doctorSchedule.actions.deactivate")}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {canEdit && (
        <Card>
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="text-sm font-semibold text-slate-900">
              {t("doctorSchedule.sections.form")}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{t("doctorSchedule.hints.publish")}</p>
          </div>
          <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Select
                label={t("doctorSchedule.fields.doctor")}
                value={form.doctorId}
                onChange={(e) => updateForm("doctorId", e.target.value)}
                disabled={isEditing}
              >
                {doctorOptions.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.doctorCode} — {doctor.doctorName}
                  </option>
                ))}
              </Select>
              {isEditing && (
                <p className="text-xs text-slate-500">
                  {t("doctorSchedule.hints.doctorImmutable")}
                </p>
              )}
            </div>
            <Select
              label={t("doctorSchedule.fields.dayOfWeek")}
              value={form.dayOfWeek}
              onChange={(e) => updateForm("dayOfWeek", e.target.value)}
            >
              {DAYS_OF_WEEK.map((day) => (
                <option key={day} value={String(day)}>
                  {t(DAY_OF_WEEK_I18N_KEYS[day])}
                </option>
              ))}
            </Select>
            <Select
              label={t("doctorSchedule.fields.slotDuration")}
              value={form.slotDuration}
              onChange={(e) => updateForm("slotDuration", e.target.value)}
            >
              {SLOT_DURATION_OPTIONS.map((minutes) => (
                <option key={minutes} value={String(minutes)}>
                  {minutes}
                </option>
              ))}
            </Select>
            <Input
              label={t("doctorSchedule.fields.startTime")}
              type="time"
              value={form.startTime}
              onChange={(e) => updateForm("startTime", e.target.value)}
              required
            />
            <Input
              label={t("doctorSchedule.fields.endTime")}
              type="time"
              value={form.endTime}
              onChange={(e) => updateForm("endTime", e.target.value)}
              required
            />
            <Input
              label={t("doctorSchedule.fields.chamber")}
              value={form.chamber}
              onChange={(e) => updateForm("chamber", e.target.value)}
            />
            <p className="text-sm text-slate-600 sm:col-span-2 lg:col-span-3">
              {previewSlots.length > 0
                ? t("doctorSchedule.hints.slotPreview").replace(
                    "{count}",
                    String(previewSlots.length),
                  )
                : t("doctorSchedule.hints.noSlots")}
            </p>
            {error && <p className="text-sm text-rose-600 sm:col-span-full">{error}</p>}
            {notice && <p className="text-sm text-teal-700 sm:col-span-full">{notice}</p>}
          </CardBody>
          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <Button type="button" variant="secondary" onClick={resetForm} disabled={pending}>
              {t("doctorSchedule.actions.cancelEdit")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={pending || !form.doctorId || previewSlots.length === 0}
            >
              {t("doctorSchedule.actions.save")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
