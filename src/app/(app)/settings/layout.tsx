import { DiagnosticSetupNav, Layer2Banner } from "@/components/diagnostic-setup/DiagnosticSetupShell";
import { requireTenantSession } from "@/lib/auth";

export default async function DiagnosticSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireTenantSession();

  return (
    <div className="space-y-6">
      <Layer2Banner tenantName={session.tenantName} />
      <div className="flex flex-col gap-6 lg:flex-row">
        <DiagnosticSetupNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
