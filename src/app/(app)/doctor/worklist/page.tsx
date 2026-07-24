import Link from "next/link";
import type { ComponentProps } from "react";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { ConsultationWorklistPanel } from "@/components/consultations/ConsultationWorklistPanel";
import { listConsultationWorklistAction } from "@/app/actions/tenant-consultations";
import { getCurrentBranchCookie, resolveCurrentBranch } from "@/lib/branch/resolve";
import { prisma } from "@/lib/db";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function DoctorWorklistPage() {
  const session = await requireTenantPermission("/doctor/worklist");
  const { t } = await getServerI18n(session);
  const cookieBranchId = await getCurrentBranchCookie();
  const branchResult = await resolveCurrentBranch({
    tenantId: session.tenantId,
    userId: session.userId,
    sessionBranchId: session.branchId,
    cookieBranchId,
  });

  const doctor = await prisma.doctor.findFirst({
    where: { tenantId: session.tenantId, userId: session.userId, isActive: true },
    select: {
      id: true,
      doctorCode: true,
      doctorName: true,
      department: { select: { name: true } },
    },
  });

  const [worklist, canStart] = await Promise.all([
    listConsultationWorklistAction({
      branchId: branchResult.branch?.id,
      doctorId: doctor?.id,
    }),
    hasTenantPermission(session.tenantId, session.userId, "/consultations/start", "canCreate"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey="doctorWorklist" description={t("consultation.worklist.description")} />
      <ConsultationWorklistPanel
        rows={worklist as ComponentProps<typeof ConsultationWorklistPanel>["rows"]}
        branchName={branchResult.branch?.name ?? session.branchName}
        doctorName={doctor?.doctorName}
        doctorCode={doctor?.doctorCode}
        departmentName={doctor?.department?.name}
        canStart={canStart}
      />
    </div>
  );
}
