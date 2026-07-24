import { notFound, redirect } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { ConsultationWorkspace } from "@/components/consultations/ConsultationWorkspace";
import { getEncounterAction } from "@/app/actions/tenant-consultations";
import { isEncounterEditable } from "@/lib/consultation/constants";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ encounterId: string }> };

export default async function ConsultationEditPage({ params }: PageProps) {
  const session = await requireTenantPermission("/consultations");
  const { t } = await getServerI18n(session);
  const { encounterId } = await params;
  const encounter = await getEncounterAction(encounterId);
  if (!encounter) notFound();

  if (!isEncounterEditable(encounter.status)) {
    redirect(`/consultations/${encounterId}`);
  }

  const [canEdit, canComplete, canReopen] = await Promise.all([
    hasTenantPermission(session.tenantId, session.userId, "/consultations/edit", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/consultations/complete", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/consultations/reopen", "canApprove"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="consultationEdit" description={t("consultation.edit.description")} />
      <ConsultationWorkspace
        encounter={encounter}
        canEdit={canEdit}
        canComplete={canComplete}
        canReopen={canReopen}
      />
    </div>
  );
}
