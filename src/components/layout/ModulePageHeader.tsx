import { PageHeader } from "@/components/ui";
import { getServerI18n } from "@/lib/i18n/server";
import {
  getModuleBreadcrumb,
  SCREENS,
  type ScreenDefinition,
} from "@/lib/module-registry";
import { getSession } from "@/lib/auth";
import type { ReactNode } from "react";

export async function ModulePageHeader({
  screenKey,
  description,
  action,
}: {
  screenKey: keyof typeof SCREENS;
  description?: string;
  action?: ReactNode;
}) {
  const session = await getSession();
  const { t } = await getServerI18n(session);
  const screen: ScreenDefinition = SCREENS[screenKey];
  const title = t(`screens.${screenKey}.title`, screen.screenName);
  const breadcrumb = t(
    `screens.${screenKey}.breadcrumb`,
    getModuleBreadcrumb(screenKey),
  );

  return (
    <div className="space-y-1 border-b border-slate-200 pb-6">
      <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
        {breadcrumb}
      </p>
      <PageHeader
        title={title}
        description={description ?? screen.workflowRef}
        action={action}
      />
    </div>
  );
}
