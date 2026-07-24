import { notFound, redirect } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { PrescriptionEditor } from "@/components/prescriptions/PrescriptionEditor";
import { getPrescriptionAction } from "@/app/actions/tenant-prescriptions";
import { isPrescriptionEditable } from "@/lib/prescription/constants";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ prescriptionId: string }> };

export default async function PrescriptionEditPage({ params }: PageProps) {
  const session = await requireTenantPermission("/prescriptions");
  const { t } = await getServerI18n(session);
  const { prescriptionId } = await params;
  const prescription = await getPrescriptionAction(prescriptionId);
  if (!prescription) notFound();

  if (!isPrescriptionEditable(prescription.status)) {
    redirect(`/prescriptions/${prescriptionId}`);
  }

  const [canEdit, canFinalize, canCancel] = await Promise.all([
    hasTenantPermission(session.tenantId, session.userId, "/prescriptions/edit", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/prescriptions/finalize", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/prescriptions/cancel", "canEdit"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="prescriptionEdit" description={t("prescription.edit.description")} />
      <PrescriptionEditor
        prescription={prescription}
        canEdit={canEdit}
        canFinalize={canFinalize}
        canCancel={canCancel}
      />
    </div>
  );
}
