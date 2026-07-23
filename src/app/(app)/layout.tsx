import { AppShell } from "@/components/layout/AppShell";
import { I18nProvider, LocaleDocument } from "@/lib/i18n/client";
import { getServerI18n, toClientI18nPack } from "@/lib/i18n/server";
import { requireSession } from "@/lib/auth";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const i18n = await getServerI18n(session);

  return (
    <I18nProvider initial={toClientI18nPack(i18n)}>
      <LocaleDocument locale={i18n.locale} direction={i18n.direction} />
      <AppShell session={session}>{children}</AppShell>
    </I18nProvider>
  );
}
