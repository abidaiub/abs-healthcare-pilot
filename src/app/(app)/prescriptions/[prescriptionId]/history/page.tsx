import { notFound } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { PrescriptionHistoryPanel } from "@/components/prescriptions/PrescriptionHistoryPanel";
import {
  getPrescriptionAction,
  listPrescriptionHistoryAction,
} from "@/app/actions/tenant-prescriptions";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ prescriptionId: string }> };

export default async function PrescriptionHistoryPage({ params }: PageProps) {
  await requireTenantPermission("/prescriptions/history");
  const session = await requireTenantPermission("/prescriptions");
  const { t } = await getServerI18n(session);
  const { prescriptionId } = await params;
  const current = await getPrescriptionAction(prescriptionId);
  if (!current) notFound();

  const versions = await listPrescriptionHistoryAction(current.prescriptionNumber);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="prescriptionHistory" description={t("prescription.history.description")} />
      <PrescriptionHistoryPanel rows={versions} prescriptionNumber={current.prescriptionNumber} />
    </div>
  );
}
