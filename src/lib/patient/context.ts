import { prisma } from "@/lib/db";
import { resolveCurrentBranch } from "@/lib/branch/resolve";
import type { SessionContext } from "@/lib/session";
import { isTenantSession } from "@/lib/session";

export async function resolveRegistrationBranch(session: SessionContext) {
  if (!isTenantSession(session)) {
    return { ok: false as const, errorCode: "PATIENT_BRANCH_REQUIRED" };
  }

  const resolved = await resolveCurrentBranch({
    tenantId: session.tenantId,
    userId: session.userId,
    sessionBranchId: session.branchId,
  });

  if (!resolved.branch) {
    return { ok: false as const, errorCode: "PATIENT_BRANCH_REQUIRED" };
  }

  const branch = await prisma.branch.findFirst({
    where: {
      id: resolved.branch.id,
      tenantId: session.tenantId,
      isActive: true,
    },
    select: { id: true, code: true, name: true },
  });

  if (!branch) {
    return { ok: false as const, errorCode: "PATIENT_BRANCH_INACTIVE" };
  }

  return { ok: true as const, branch };
}
