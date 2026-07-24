import { notFound, redirect } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { PrescriptionDetailPanel } from "@/components/prescriptions/PrescriptionDetailPanel";
import { getPrescriptionAction } from "@/app/actions/tenant-prescriptions";
import { isPrescriptionEditable } from "@/lib/prescription/constants";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ prescriptionId: string }> };

export default async function PrescriptionDetailPage({ params }: PageProps) {
  const session = await requireTenantPermission("/prescriptions");
  const { t } = await getServerI18n(session);
  const { prescriptionId } = await params;
  const prescription = await getPrescriptionAction(prescriptionId);
  if (!prescription) notFound();

  if (isPrescriptionEditable(prescription.status)) {
    redirect(`/prescriptions/${prescriptionId}/edit`);
  }

  const [canEdit, canFinalize, canCancel, canRevise, canPrint] = await Promise.all([
    hasTenantPermission(session.tenantId, session.userId, "/prescriptions/edit", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/prescriptions/finalize", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/prescriptions/cancel", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/prescriptions/revise", "canApprove"),
    hasTenantPermission(session.tenantId, session.userId, "/prescriptions/print", "canPrint"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="prescriptionDetail" description={t("prescription.detail.description")} />
      <PrescriptionDetailPanel
        prescription={prescription}
        canEdit={canEdit}
        canFinalize={canFinalize}
        canCancel={canCancel}
        canRevise={canRevise}
        canPrint={canPrint}
      />
    </div>
  );
}
