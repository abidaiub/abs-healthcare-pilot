import { formatMinorForDb } from "@/lib/billing/money";
import { getOutstandingDueMinor } from "@/lib/billing/queries";
import type { ReportReleasePolicy } from "@/lib/laboratory-report-release/policy";
import { prisma } from "@/lib/db";

/**
 * Marks a billing hold as automatically applied from an outstanding invoice balance.
 * Only holds carrying this marker are auto-cleared; a hold placed by staff stays until
 * staff clear it.
 */
export const SYSTEM_BILLING_HOLD_PREFIX = "SYSTEM_BILLING_DUE";

export type BillingHoldSyncOutcome = {
  changed: boolean;
  holdActive: boolean;
  dueAmount: string;
};

function isSystemHold(reason: string | null): boolean {
  return Boolean(reason?.startsWith(SYSTEM_BILLING_HOLD_PREFIX));
}

/**
 * Reconciles the MOD-24 billing hold against real MOD-10 invoice due for the release's
 * order. This reuses the approved hold mechanism instead of introducing a second blocker,
 * so `evaluateReportReleaseEligibility` needs no change.
 */
export async function syncBillingHoldFromInvoice(input: {
  tenantId: string;
  releaseId: string;
  policy: ReportReleasePolicy;
  actorUserId: string;
}): Promise<BillingHoldSyncOutcome> {
  const release = await prisma.labReportRelease.findFirst({
    where: { id: input.releaseId, tenantId: input.tenantId },
    select: {
      id: true,
      billingHoldActive: true,
      billingHoldReason: true,
      labResult: {
        select: { labOrderId: true, labOrder: { select: { patientId: true } } },
      },
    },
  });

  if (!release?.labResult) {
    return { changed: false, holdActive: false, dueAmount: "0.00" };
  }

  if (!input.policy.enforceBillingClearance) {
    return {
      changed: false,
      holdActive: release.billingHoldActive,
      dueAmount: "0.00",
    };
  }

  const dueMinor = await getOutstandingDueMinor(
    prisma,
    input.tenantId,
    release.labResult.labOrder.patientId,
    release.labResult.labOrderId,
  );
  const dueAmount = formatMinorForDb(dueMinor);
  const now = new Date();

  if (dueMinor > 0 && !release.billingHoldActive) {
    await prisma.labReportRelease.update({
      where: { id: release.id },
      data: {
        billingHoldActive: true,
        billingHoldReason: `${SYSTEM_BILLING_HOLD_PREFIX}: outstanding balance ${dueAmount}`,
        billingHoldAt: now,
        billingHoldById: input.actorUserId,
        billingHoldClearedAt: null,
        billingHoldClearedById: null,
        billingHoldClearReason: null,
        stateVersion: { increment: 1 },
      },
    });
    return { changed: true, holdActive: true, dueAmount };
  }

  if (dueMinor === 0 && release.billingHoldActive && isSystemHold(release.billingHoldReason)) {
    await prisma.labReportRelease.update({
      where: { id: release.id },
      data: {
        billingHoldActive: false,
        billingHoldClearedAt: now,
        billingHoldClearedById: input.actorUserId,
        billingHoldClearReason: `${SYSTEM_BILLING_HOLD_PREFIX}: balance settled`,
        stateVersion: { increment: 1 },
      },
    });
    return { changed: true, holdActive: false, dueAmount };
  }

  return { changed: false, holdActive: release.billingHoldActive, dueAmount };
}
