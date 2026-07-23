import { notFound } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { PatientDetailPanel } from "@/components/patients/PatientDetailPanel";
import { getPatientById } from "@/lib/patient/queries";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission, hasTenantPermission } from "@/lib/rbac/auth";

type PageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function PatientDetailPage({ params }: PageProps) {
  const session = await requireTenantPermission("/patients");
  const { t } = await getServerI18n(session);
  const { patientId } = await params;

  const patient = await getPatientById(session.tenantId, patientId);
  if (!patient) notFound();

  const canEdit = await hasTenantPermission(
    session.tenantId,
    session.userId,
    "/patients/new",
    "canEdit",
  );

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="patientDetail"
        description={t("patient.detail.description")}
      />
      <PatientDetailPanel patient={patient} canEdit={canEdit} />
    </div>
  );
}
