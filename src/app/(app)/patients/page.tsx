import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { PatientSearchPanel } from "@/components/patients/PatientSearchPanel";
import { requireSession } from "@/lib/auth";
import { PATIENTS } from "@/lib/sample-data";

export default async function PatientsPage() {
  const session = await requireSession();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="patientSearch"
        description={`Search-first workflow at ${session.branchName}`}
      />
      <PatientSearchPanel patients={PATIENTS} />
    </div>
  );
}
