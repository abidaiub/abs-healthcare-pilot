import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { PatientRegistrationForm } from "@/components/patients/PatientRegistrationForm";
import { requireSession } from "@/lib/auth";

export default async function PatientRegistrationPage() {
  const session = await requireSession();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="patientRegistration"
        description={`Capture demographics, identity, and emergency contact for ${session.tenantName}`}
      />
      <PatientRegistrationForm session={session} />
    </div>
  );
}
