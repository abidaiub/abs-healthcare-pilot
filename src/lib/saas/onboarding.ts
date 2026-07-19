import type { TenantDetailRecord } from "@/lib/saas/types";

export type OnboardingEvaluation = {
  steps: Array<{
    id: string;
    label: string;
    state: "completed" | "pending" | "blocked";
    detail: string;
  }>;
  canActivate: boolean;
  blockers: string[];
};

export function evaluateTenantOnboarding(
  tenant: TenantDetailRecord,
): OnboardingEvaluation {
  const steps = [
    {
      id: "profile",
      label: "Tenant profile",
      state: tenant.contactPerson && tenant.contactEmail && tenant.code
        ? ("completed" as const)
        : ("pending" as const),
      detail: "Core organization and contact fields",
    },
    {
      id: "subscription",
      label: "Subscription / license",
      state: tenant.subscription ? ("completed" as const) : ("pending" as const),
      detail: tenant.subscription
        ? `${tenant.subscription.packageName} (${tenant.subscription.subscriptionStatus})`
        : "Assign a subscription package",
    },
    {
      id: "limits",
      label: "Usage limits",
      state: tenant.usageLimits ? ("completed" as const) : ("pending" as const),
      detail: tenant.usageLimits
        ? `${tenant.usageLimits.maxUsers} users · ${tenant.usageLimits.maxBranches} branches`
        : "Configure usage limits",
    },
    {
      id: "modules",
      label: "Module assignment",
      state:
        tenant.modules.filter((m) => m.isEnabled).length > 0
          ? ("completed" as const)
          : ("pending" as const),
      detail: `${tenant.modules.filter((m) => m.isEnabled).length} enabled modules`,
    },
    {
      id: "admin",
      label: "Initial tenant admin",
      state: tenant.primaryAdmin.id ? ("completed" as const) : ("pending" as const),
      detail: tenant.primaryAdmin.id
        ? tenant.primaryAdmin.email
        : "Create primary tenant admin user",
    },
    {
      id: "branch",
      label: "First branch",
      state:
        tenant.branches.length > 0 ? ("completed" as const) : ("pending" as const),
      detail:
        tenant.branches.length > 0
          ? `${tenant.branches.length} branch(es) configured`
          : "Create at least one branch",
    },
    {
      id: "branding",
      label: "Branding / settings",
      state:
        tenant.branding.logoUrl || tenant.branding.reportFooterText
          ? ("completed" as const)
          : ("pending" as const),
      detail: "Logo or report footer configured",
    },
  ];

  const blockers: string[] = [];
  if (!tenant.subscription) blockers.push("Subscription is required");
  if (!tenant.usageLimits) blockers.push("Usage limits are required");
  if (!tenant.primaryAdmin.id) blockers.push("Primary tenant admin is required");
  if (tenant.branches.length === 0) blockers.push("At least one branch is required");
  if (!tenant.contactPerson || !tenant.contactEmail) {
    blockers.push("Primary contact fields are required");
  }

  const canActivate = blockers.length === 0;

  return { steps, canActivate, blockers };
}
