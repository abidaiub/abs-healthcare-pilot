import {
  DiagnosticSetupNav,
  Layer2Banner,
} from "@/components/diagnostic-setup/DiagnosticSetupShell";
import { requireTenantSession } from "@/lib/auth";
import {
  DIAGNOSTIC_SETUP_NAV,
  SECURITY_SETUP_NAV,
} from "@/lib/diagnostic-master-data";
import { canViewNavHref } from "@/lib/navigation";
import { getEffectivePermissionsForUser } from "@/lib/rbac/queries";

export default async function DiagnosticSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireTenantSession();
  const permissions = await getEffectivePermissionsForUser(
    session.tenantId,
    session.userId,
  );

  const securityItems = SECURITY_SETUP_NAV.filter((item) =>
    canViewNavHref(permissions, item.href),
  ).map((item) => ({ href: item.href, label: item.label }));

  const diagnosticItems = DIAGNOSTIC_SETUP_NAV.filter((item) =>
    canViewNavHref(permissions, item.href),
  ).map((item) => ({ href: item.href, label: item.label }));

  return (
    <div className="space-y-6">
      <Layer2Banner tenantName={session.tenantName} />
      <div className="flex flex-col gap-6 lg:flex-row">
        <DiagnosticSetupNav
          securityItems={securityItems}
          diagnosticItems={diagnosticItems}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
