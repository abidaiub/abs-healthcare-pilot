import { VerificationPanel } from "@/components/diagnostic/VerificationPanel";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireSession } from "@/lib/auth";

export default async function VerificationPage() {
  await requireSession();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="verification"
        description="Senior technologist and pathologist verification queue with critical value governance."
      />
      <VerificationPanel />
    </div>
  );
}
