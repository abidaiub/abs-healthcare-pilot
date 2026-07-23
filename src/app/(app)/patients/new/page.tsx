import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { PatientForm } from "@/components/patients/PatientForm";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission, hasTenantPermission } from "@/lib/rbac/auth";

export default async function PatientRegistrationPage() {
  const session = await requireTenantPermission("/patients/new", "canCreate");
  const { t } = await getServerI18n(session);
  const canOverrideDuplicates = await hasTenantPermission(
    session.tenantId,
    session.userId,
    "/patients/new",
    "canApprove",
  );

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="patientRegistration"
        description={t("patient.list.description")}
      />
      <PatientForm
        mode="create"
        branchLabel={`${session.branchCode ?? ""} — ${session.branchName}`}
        canOverrideDuplicates={canOverrideDuplicates}
      />
    </div>
  );
}
