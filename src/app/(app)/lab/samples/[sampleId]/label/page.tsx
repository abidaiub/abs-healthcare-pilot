import { notFound } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { LabSampleLabelPanel } from "@/components/laboratory/LabSampleLabelPanel";
import { getLabSampleByIdAction } from "@/app/actions/tenant-lab-orders";
import { generateSampleLabelCodes } from "@/lib/laboratory/barcode";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ sampleId: string }> };

export default async function LabSampleLabelPage({ params }: PageProps) {
  const session = await requireTenantPermission("/lab/samples/label", "canPrint");
  const { t } = await getServerI18n(session);
  const { sampleId } = await params;
  const sample = await getLabSampleByIdAction(sampleId).catch(() => null);
  if (!sample) notFound();

  const [canPrint, codes] = await Promise.all([
    hasTenantPermission(session.tenantId, session.userId, "/lab/samples/label", "canPrint"),
    generateSampleLabelCodes(sample.barcodeValue),
  ]);

  const sampleTestIds = new Set(sample.sampleTests.map((row) => row.labOrderTestId));
  const departments = [
    ...new Set(
      sample.labOrder.tests
        .filter((test) => sampleTestIds.has(test.id))
        .map((test) => test.department?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  ];

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="labSampleLabel" description={t("laboratory.label.description")} />
      <LabSampleLabelPanel
        sample={{
          id: sample.id,
          accessionNumber: sample.accessionNumber,
          barcodeValue: sample.barcodeValue,
          collectedAt: sample.collectedAt ? sample.collectedAt.toISOString().slice(0, 16).replace("T", " ") : null,
          tenantName: session.tenantName,
          branchName: sample.labOrder.branch.name,
          branchCode: sample.labOrder.branch.code,
          priority: sample.labOrder.priority,
          departments,
          labOrder: {
            orderNumber: sample.labOrder.orderNumber,
            patient: {
              patientNumber: sample.labOrder.patient.patientNumber,
              fullName: sample.labOrder.patient.fullName,
            },
          },
          sampleType: sample.sampleType
            ? { sampleType: sample.sampleType.sampleType }
            : null,
          sampleContainer: sample.sampleContainer
            ? { containerType: sample.sampleContainer.containerType }
            : null,
        }}
        codes={codes}
        canPrint={canPrint}
      />
    </div>
  );
}
