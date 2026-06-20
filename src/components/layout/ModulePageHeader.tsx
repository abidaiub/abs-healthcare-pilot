import { PageHeader } from "@/components/ui";
import {
  getModuleBreadcrumb,
  SCREENS,
  type ScreenDefinition,
} from "@/lib/module-registry";
import type { ReactNode } from "react";

export function ModulePageHeader({
  screenKey,
  description,
  action,
}: {
  screenKey: keyof typeof SCREENS;
  description?: string;
  action?: ReactNode;
}) {
  const screen: ScreenDefinition = SCREENS[screenKey];
  const breadcrumb = getModuleBreadcrumb(screenKey);

  return (
    <div className="space-y-1 border-b border-slate-200 pb-6">
      <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
        {breadcrumb}
      </p>
      <PageHeader
        title={screen.screenName}
        description={description ?? screen.workflowRef}
        action={action}
      />
    </div>
  );
}
