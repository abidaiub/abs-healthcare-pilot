import { PortalReadinessPanel } from "@/components/operational-readiness/PortalReadinessPanel";
import { ReadinessPageShell } from "@/components/operational-readiness/ReadinessPageShell";
import { READINESS_RESOURCE } from "@/lib/operational-readiness/constants";
import { getOrInitPortalSettings } from "@/lib/operational-readiness/queries";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

export default async function PortalReadinessPage() {
  const session = await requireTenantPermission(READINESS_RESOURCE);
  const [settings, canEdit] = await Promise.all([
    getOrInitPortalSettings(session.tenantId, session.user.name),
    hasTenantPermission(
      session.tenantId,
      session.userId,
      READINESS_RESOURCE,
      "canEdit",
    ),
  ]);

  return (
    <ReadinessPageShell
      screenKey="readinessPortal"
      description="Portal enabled, self-registration, PDF download, QR verification, notification, password policy."
    >
      <PortalReadinessPanel
        canEdit={canEdit}
        settings={{
          portalEnabled: settings.portalEnabled,
          selfRegistration: settings.selfRegistration,
          downloadPdfEnabled: settings.downloadPdfEnabled,
          qrVerificationEnabled: settings.qrVerificationEnabled,
          notificationEnabled: settings.notificationEnabled,
          passwordMinLength: settings.passwordMinLength,
          passwordRequireMixed: settings.passwordRequireMixed,
        }}
      />
    </ReadinessPageShell>
  );
}
