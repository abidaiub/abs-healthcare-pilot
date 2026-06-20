import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { DoctorWorklistPanel } from "@/components/doctor/DoctorWorklistPanel";
import { requireSession } from "@/lib/auth";
import { DOCTORS, getDoctorWorklist } from "@/lib/sample-data";

export default async function DoctorWorklistPage() {
  const session = await requireSession();

  const doctor =
    DOCTORS.find((d) => d.code === session.user.employeeCode) ?? DOCTORS[0];

  const items = getDoctorWorklist(doctor.code);

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="doctorWorklist"
        description={`Queue management for ${doctor.name}`}
      />
      <DoctorWorklistPanel
        doctorName={doctor.name}
        doctorCode={doctor.code}
        department={doctor.department}
        branchName={session.branchName}
        items={items}
      />
    </div>
  );
}
