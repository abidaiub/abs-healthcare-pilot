import { notFound } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { PatientForm, patientRecordToFormValues } from "@/components/patients/PatientForm";
import { getPatientById } from "@/lib/patient/queries";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function PatientEditPage({ params }: PageProps) {
  const session = await requireTenantPermission("/patients/new", "canEdit");
  const { t } = await getServerI18n(session);
  const { patientId } = await params;

  const patient = await getPatientById(session.tenantId, patientId);
  if (!patient) notFound();

  const canOverrideDuplicates = await hasTenantPermission(
    session.tenantId,
    session.userId,
    "/patients/new",
    "canApprove",
  );

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="patientEdit"
        description={t("patient.edit.description")}
      />
      <PatientForm
        mode="edit"
        patientId={patient.id}
        patientNumber={patient.patientNumber}
        branchLabel={`${patient.registrationBranch.code} — ${patient.registrationBranch.name}`}
        initialValues={patientRecordToFormValues(patient)}
        canOverrideDuplicates={canOverrideDuplicates}
      />
    </div>
  );
}
