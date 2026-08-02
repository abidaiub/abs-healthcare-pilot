import { DoctorSetupReadinessPanel } from "@/components/operational-readiness/DoctorSetupReadinessPanel";
import { ReadinessPageShell } from "@/components/operational-readiness/ReadinessPageShell";
import { prisma } from "@/lib/db";
import { READINESS_RESOURCE } from "@/lib/operational-readiness/constants";
import { requireTenantPermission } from "@/lib/rbac/auth";

export default async function DoctorSetupReadinessPage() {
  const session = await requireTenantPermission(READINESS_RESOURCE);

  const doctors = await prisma.doctor.findMany({
    where: { tenantId: session.tenantId },
    include: {
      department: { select: { name: true } },
      doctorSchedules: {
        where: { isActive: true, isPublished: true },
        select: { id: true },
      },
    },
    orderBy: { doctorName: "asc" },
  });

  return (
    <ReadinessPageShell
      screenKey="readinessDoctors"
      description="Doctor master, speciality, registration, schedules, and verification permission."
    >
      <DoctorSetupReadinessPanel
        doctors={doctors.map((d) => ({
          id: d.id,
          doctorCode: d.doctorCode,
          doctorName: d.doctorName,
          specialty: d.specialty,
          bmdcNo: d.bmdcNo,
          departmentName: d.department?.name ?? "—",
          isVerifying: d.isVerifying,
          isPathologist: d.isPathologist,
          publishedSchedules: d.doctorSchedules.length,
          isActive: d.isActive,
        }))}
      />
    </ReadinessPageShell>
  );
}
