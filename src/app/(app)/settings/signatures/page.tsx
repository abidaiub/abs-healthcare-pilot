import { SignatureTemplatesPanel } from "@/components/diagnostic-setup/SignatureTemplatesPanel";
import { SetupErrorState } from "@/components/diagnostic-setup/SetupDataStates";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireTenantSession } from "@/lib/auth";
import { listSignatureTemplates } from "@/lib/diagnostic/queries";

export default async function SignaturesPage() {
  const session = await requireTenantSession();

  try {
    const items = await listSignatureTemplates(session.tenantId, session.branchId);
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="signatureTemplates" description="Report signature templates by tenant, branch, department, and doctor." />
        <SignatureTemplatesPanel items={items} />
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-6">
        <ModulePageHeader screenKey="signatureTemplates" description="Signature templates." />
        <SetupErrorState message={error instanceof Error ? error.message : "Failed to load templates."} />
      </div>
    );
  }
}
