import { redirect } from "next/navigation";
import { createPrescriptionDraftAction } from "@/app/actions/tenant-prescriptions";
import { requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = {
  searchParams: Promise<{ encounterId?: string }>;
};

export default async function NewPrescriptionPage({ searchParams }: PageProps) {
  await requireTenantPermission("/prescriptions/new", "canCreate");
  const params = await searchParams;
  const encounterId = params.encounterId?.trim();

  if (!encounterId) {
    redirect("/prescriptions");
  }

  const result = await createPrescriptionDraftAction(encounterId);

  if (!result.ok || !result.prescriptionId) {
    redirect(`/consultations/${encounterId}`);
  }

  redirect(`/prescriptions/${result.prescriptionId}/edit`);
}
