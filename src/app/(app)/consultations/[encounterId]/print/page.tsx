import { notFound } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { ConsultationPrintPanel } from "@/components/consultations/ConsultationPrintPanel";
import { getEncounterAction } from "@/app/actions/tenant-consultations";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ encounterId: string }> };

export default async function ConsultationPrintPage({ params }: PageProps) {
  await requireTenantPermission("/consultations/print", "canPrint");
  const session = await requireTenantPermission("/consultations");
  const { t } = await getServerI18n(session);
  const { encounterId } = await params;
  const encounter = await getEncounterAction(encounterId);
  if (!encounter) notFound();

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="consultationPrint" description={t("consultation.print.description")} />
      <ConsultationPrintPanel encounter={encounter} />
    </div>
  );
}
