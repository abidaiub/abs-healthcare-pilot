import { CompanyProfilePanel } from "@/components/operational-readiness/CompanyProfilePanel";
import { ReadinessPageShell } from "@/components/operational-readiness/ReadinessPageShell";
import { READINESS_RESOURCE } from "@/lib/operational-readiness/constants";
import { getCompanyProfile } from "@/lib/operational-readiness/queries";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function CompanyProfileReadinessPage() {
  const session = await requireTenantPermission(READINESS_RESOURCE);
  const profile = await getCompanyProfile(session.tenantId);
  const canEdit = await hasTenantPermission(
    session.tenantId,
    session.userId,
    READINESS_RESOURCE,
    "canEdit",
  );

  return (
    <ReadinessPageShell
      screenKey="readinessCompanyProfile"
      description="Company name, contact, branding, invoice and report footers."
    >
      <CompanyProfilePanel profile={profile} canEdit={canEdit} />
    </ReadinessPageShell>
  );
}
