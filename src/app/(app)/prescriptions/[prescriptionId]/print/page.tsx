import { notFound, redirect } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { PrescriptionPrintPanel } from "@/components/prescriptions/PrescriptionPrintPanel";
import { getPrescriptionAction } from "@/app/actions/tenant-prescriptions";
import { getServerI18n } from "@/lib/i18n/server";
import { requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = {
  params: Promise<{ prescriptionId: string }>;
  searchParams: Promise<{ reprint?: string }>;
};

export default async function PrescriptionPrintPage({ params, searchParams }: PageProps) {
  await requireTenantPermission("/prescriptions/print", "canPrint");
  const session = await requireTenantPermission("/prescriptions");
  const { t } = await getServerI18n(session);
  const { prescriptionId } = await params;
  const query = await searchParams;
  const prescription = await getPrescriptionAction(prescriptionId);
  if (!prescription) notFound();

  if (prescription.status !== "FINALIZED") {
    redirect(`/prescriptions/${prescriptionId}`);
  }

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="prescriptionPrint" description={t("prescription.print.description")} />
      <PrescriptionPrintPanel prescription={prescription} isReprint={query.reprint === "1"} />
    </div>
  );
}
