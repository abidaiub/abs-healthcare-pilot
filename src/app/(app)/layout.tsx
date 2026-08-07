import { AppShell } from "@/components/layout/AppShell";
import { I18nProvider, LocaleDocument } from "@/lib/i18n/client";
import { getServerI18n, toClientI18nPack } from "@/lib/i18n/server";
import { requireSession } from "@/lib/auth";
import { enrichSessionBranchContext, listSwitchableBranches } from "@/lib/branch/resolve";
import { resolveAuthorizedNavGroups } from "@/lib/navigation-resolve";
import { isTenantSession } from "@/lib/session";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const baseSession = await requireSession();
  const session = await enrichSessionBranchContext(baseSession);
  const i18n = await getServerI18n(session);
  const [switchableBranches, navGroups] = await Promise.all([
    isTenantSession(session)
      ? listSwitchableBranches(session.tenantId, session.userId)
      : Promise.resolve([]),
    resolveAuthorizedNavGroups(session),
  ]);

  return (
    <I18nProvider initial={toClientI18nPack(i18n)}>
      <LocaleDocument locale={i18n.locale} direction={i18n.direction} />
      <AppShell
        session={session}
        navGroups={navGroups}
        switchableBranches={switchableBranches}
      >
        {children}
      </AppShell>
    </I18nProvider>
  );
}
