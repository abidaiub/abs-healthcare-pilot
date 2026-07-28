import { DoctorSchedulePanel } from "@/components/doctor-schedule/DoctorSchedulePanel";
import { SetupErrorState } from "@/components/diagnostic-setup/SetupDataStates";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { listBranchDoctorOptions, listDoctorSchedules } from "@/lib/doctor-schedule/queries";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function DoctorSchedulesPage() {
  const session = await requireTenantPermission("/settings/doctor-schedules");
  const { t } = await getServerI18n(session);

  if (!session.branchId) {
    return (
      <div className="space-y-6">
        <ModulePageHeader
          screenKey="doctorSchedules"
          description={t("doctorSchedule.description")}
        />
        <SetupErrorState
          message={t("doctorSchedule.errors.DOCTOR_SCHEDULE_BRANCH_REQUIRED")}
        />
      </div>
    );
  }

  const branchId = session.branchId;

  let data: {
    schedules: Awaited<ReturnType<typeof listDoctorSchedules>>;
    doctors: Awaited<ReturnType<typeof listBranchDoctorOptions>>;
    canEdit: boolean;
    canPublish: boolean;
    canDelete: boolean;
  } | null = null;
  let loadError: string | null = null;

  try {
    const [schedules, doctors, canEdit, canPublish, canDelete] = await Promise.all([
      listDoctorSchedules(session.tenantId, branchId),
      listBranchDoctorOptions(session.tenantId, branchId),
      hasTenantPermission(session.tenantId, session.userId, "/settings/doctor-schedules", "canEdit"),
      hasTenantPermission(
        session.tenantId,
        session.userId,
        "/settings/doctor-schedules",
        "canApprove",
      ),
      hasTenantPermission(
        session.tenantId,
        session.userId,
        "/settings/doctor-schedules",
        "canDelete",
      ),
    ]);
    data = { schedules, doctors, canEdit, canPublish, canDelete };
  } catch (error) {
    loadError = error instanceof Error ? error.message : t("doctorSchedule.errors.generic");
  }

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="doctorSchedules" description={t("doctorSchedule.description")} />
      {data ? (
        <DoctorSchedulePanel
          schedules={data.schedules}
          doctors={data.doctors}
          branchLabel={session.branchName}
          canEdit={data.canEdit && data.doctors.length > 0}
          canPublish={data.canPublish}
          canDelete={data.canDelete}
        />
      ) : (
        <SetupErrorState message={loadError ?? t("doctorSchedule.errors.generic")} />
      )}
    </div>
  );
}
