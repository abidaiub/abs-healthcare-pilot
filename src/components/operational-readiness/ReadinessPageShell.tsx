import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { ReadinessWizardNav } from "@/components/operational-readiness/ReadinessWizardNav";
import type { ReactNode } from "react";

export function ReadinessPageShell({
  screenKey,
  description,
  children,
}: {
  screenKey: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <ModulePageHeader screenKey={screenKey as never} description={description} />
      <ReadinessWizardNav />
      {children}
    </div>
  );
}
