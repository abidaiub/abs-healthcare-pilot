import Link from "next/link";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { AppointmentListPanel } from "@/components/appointments/AppointmentListPanel";
import { Button } from "@/components/ui";
import {
  listAppointmentBranchOptions,
  listAppointments,
  listAppointmentDoctorOptions,
} from "@/lib/appointment/queries";
import { resolveAppointmentBranch } from "@/lib/appointment/context";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission, hasTenantPermission } from "@/lib/rbac/auth";
import type { AppointmentStatus } from "@/generated/prisma/client";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AppointmentsPage({ searchParams }: PageProps) {
  const session = await requireTenantPermission("/appointments");
  const { t } = await getServerI18n(session);
  const params = await searchParams;
  const branchResult = await resolveAppointmentBranch(session);

  const page = Number(readParam(params, "page") ?? "1") || 1;
  const search = readParam(params, "search") ?? "";
  const statusRaw = readParam(params, "status") ?? "all";
  const doctorId = readParam(params, "doctorId") ?? "all";
  const branchId = readParam(params, "branchId") ?? "all";
  const appointmentDate = readParam(params, "appointmentDate") ?? "";

  const status =
    statusRaw && statusRaw !== "all" ? (statusRaw as AppointmentStatus) : ("all" as const);

  const branchScope = branchResult.ok ? branchResult.branch.id : undefined;
  const [result, branches, doctors, canCreate] = await Promise.all([
    listAppointments(session.tenantId, {
      search,
      status,
      doctorId,
      branchId: branchId === "all" && branchScope ? branchScope : branchId,
      appointmentDate,
      page,
      pageSize: 20,
    }),
    listAppointmentBranchOptions(session.tenantId),
    branchResult.ok
      ? listAppointmentDoctorOptions(session.tenantId, branchResult.branch.id)
      : Promise.resolve([]),
    hasTenantPermission(session.tenantId, session.userId, "/appointments/new", "canCreate"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="appointmentList"
        description={t("appointment.list.description")}
        action={
          canCreate ? (
            <Link href="/appointments/new">
              <Button type="button">{t("appointment.actions.book")}</Button>
            </Link>
          ) : undefined
        }
      />
      <AppointmentListPanel
        appointments={result.rows}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        branches={branches}
        doctors={doctors.map((d) => ({ id: d.id, doctorCode: d.doctorCode, doctorName: d.doctorName }))}
        canCreate={canCreate}
      />
    </div>
  );
}
