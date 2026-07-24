import { notFound } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { ConsultationDetailPanel } from "@/components/consultations/ConsultationDetailPanel";
import { getEncounterAction } from "@/app/actions/tenant-consultations";
import { findCurrentPrescriptionForEncounterAction } from "@/app/actions/tenant-prescriptions";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ encounterId: string }> };

export default async function ConsultationDetailPage({ params }: PageProps) {
  const session = await requireTenantPermission("/consultations");
  const { t } = await getServerI18n(session);
  const { encounterId } = await params;
  const encounter = await getEncounterAction(encounterId);
  if (!encounter) notFound();

  const [canPrint, canReopen, encounterPrescription, canCreatePrescription] = await Promise.all([
    hasTenantPermission(session.tenantId, session.userId, "/consultations/print", "canPrint"),
    hasTenantPermission(session.tenantId, session.userId, "/consultations/reopen", "canApprove"),
    findCurrentPrescriptionForEncounterAction(encounterId),
    hasTenantPermission(session.tenantId, session.userId, "/prescriptions/new", "canCreate"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="consultationDetail" description={t("consultation.detail.description")} />
      <ConsultationDetailPanel
        encounter={encounter}
        canPrint={canPrint}
        canReopen={canReopen}
        encounterPrescription={encounterPrescription ? { id: encounterPrescription.id, status: encounterPrescription.status } : null}
        canCreatePrescription={canCreatePrescription}
      />
    </div>
  );
}
