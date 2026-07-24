import { notFound } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { LabSampleLabelPanel } from "@/components/laboratory/LabSampleLabelPanel";
import { getLabSampleByIdAction } from "@/app/actions/tenant-lab-orders";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ sampleId: string }> };

export default async function LabSampleLabelPage({ params }: PageProps) {
  const session = await requireTenantPermission("/lab/samples/label", "canPrint");
  const { t } = await getServerI18n(session);
  const { sampleId } = await params;
  const sample = await getLabSampleByIdAction(sampleId).catch(() => null);
  if (!sample) notFound();

  const canPrint = await hasTenantPermission(session.tenantId, session.userId, "/lab/samples/label", "canPrint");

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="labSampleLabel" description={t("laboratory.label.description")} />
      <LabSampleLabelPanel
        sample={{
          id: sample.id,
          accessionNumber: sample.accessionNumber,
          barcodeValue: sample.barcodeValue,
          labOrder: {
            orderNumber: sample.labOrder.orderNumber,
            patient: sample.labOrder.patient,
          },
          sampleType: sample.sampleType,
          sampleContainer: sample.sampleContainer,
        }}
        canPrint={canPrint}
      />
    </div>
  );
}
