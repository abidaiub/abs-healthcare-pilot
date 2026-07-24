import { notFound } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { MedicationDetailPanel } from "@/components/pharmacy/MedicationDetailPanel";
import { getMedicationByIdAction } from "@/app/actions/tenant-medications";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ medicationId: string }> };

export default async function MedicationDetailPage({ params }: PageProps) {
  const session = await requireTenantPermission("/pharmacy/medications");
  const { t } = await getServerI18n(session);
  const { medicationId } = await params;

  let medication;
  try {
    medication = await getMedicationByIdAction(medicationId);
  } catch {
    notFound();
  }

  const canEdit = await hasTenantPermission(
    session.tenantId,
    session.userId,
    "/pharmacy/medications/edit",
    "canEdit",
  );

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="medicationDetail" description={t("pharmacy.detail.description")} />
      <MedicationDetailPanel medication={medication} canEdit={canEdit} />
    </div>
  );
}
