import { PatientPortalAdminPanel } from "@/components/portal/PatientPortalAdminPanel";
import { SetupErrorState } from "@/components/diagnostic-setup/SetupDataStates";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { prisma } from "@/lib/db";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";
import { listPortalAccountsAction } from "@/app/actions/tenant-patient-portal";

export default async function PatientPortalSettingsPage() {
  const session = await requireTenantPermission("/settings/patient-portal");
  const { t } = await getServerI18n(session);

  let data: {
    accounts: Awaited<ReturnType<typeof listPortalAccountsAction>>;
    patients: Array<{ id: string; patientNumber: string; fullName: string }>;
    canEnroll: boolean;
    canSuspend: boolean;
    canDelegate: boolean;
  } | null = null;
  let loadError: string | null = null;

  try {
    const [accounts, patients, canEnroll, canSuspend, canDelegate] = await Promise.all([
      listPortalAccountsAction(),
      prisma.patient.findMany({
        where: { tenantId: session.tenantId, isActive: true },
        select: { id: true, patientNumber: true, fullName: true },
        orderBy: [{ patientNumber: "asc" }],
        take: 300,
      }),
      hasTenantPermission(
        session.tenantId,
        session.userId,
        "/settings/patient-portal/accounts",
        "canEdit",
      ),
      hasTenantPermission(
        session.tenantId,
        session.userId,
        "/settings/patient-portal/accounts",
        "canApprove",
      ),
      hasTenantPermission(
        session.tenantId,
        session.userId,
        "/settings/patient-portal/delegation",
        "canApprove",
      ),
    ]);
    data = { accounts, patients, canEnroll, canSuspend, canDelegate };
  } catch (error) {
    loadError = error instanceof Error ? error.message : t("portalAdmin.errors.generic");
  }

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="patientPortalAdmin"
        description={t(
          "portalAdmin.description",
          "Enroll patient portal accounts and record guardian / family delegations with consent.",
        )}
      />
      {data ? (
        <PatientPortalAdminPanel
          accounts={data.accounts}
          patients={data.patients}
          canEnroll={data.canEnroll}
          canSuspend={data.canSuspend}
          canDelegate={data.canDelegate}
        />
      ) : (
        <SetupErrorState message={loadError ?? t("portalAdmin.errors.generic")} />
      )}
    </div>
  );
}
