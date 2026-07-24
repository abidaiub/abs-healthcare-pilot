import { prisma } from "@/lib/db";

export type ReportReleasePolicy = {
  enforceBillingClearance: boolean;
  enforceQualityClearance: boolean;
  enforceCriticalAcknowledgement: boolean;
};

export async function loadReportReleasePolicy(tenantId: string): Promise<ReportReleasePolicy> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      labReportReleaseEnforceBillingClearance: true,
      labReportReleaseEnforceQualityClearance: true,
      labReportReleaseEnforceCriticalAck: true,
    },
  });

  return {
    enforceBillingClearance: tenant?.labReportReleaseEnforceBillingClearance ?? false,
    enforceQualityClearance: tenant?.labReportReleaseEnforceQualityClearance ?? false,
    enforceCriticalAcknowledgement: tenant?.labReportReleaseEnforceCriticalAck ?? false,
  };
}
