import { redirect } from "next/navigation";
import { startConsultationAction } from "@/app/actions/tenant-consultations";
import { requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = {
  searchParams: Promise<{ appointmentId?: string }>;
};

export default async function StartConsultationPage({ searchParams }: PageProps) {
  await requireTenantPermission("/consultations/start", "canCreate");
  const params = await searchParams;
  const appointmentId = params.appointmentId?.trim();

  if (!appointmentId) {
    redirect("/consultations");
  }

  const result = await startConsultationAction(appointmentId);

  if (!result.ok || !result.encounterId) {
    redirect(`/appointments/${appointmentId}`);
  }

  redirect(`/consultations/${result.encounterId}/edit`);
}
