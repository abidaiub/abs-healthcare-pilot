"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { BranchSwitcher, type SwitchableBranchOption } from "@/components/layout/BranchSwitcher";
import { Badge, Button, cn } from "@/components/ui";
import { useI18n } from "@/lib/i18n/client";
import { getNavGroups } from "@/lib/navigation";
import { clearMockSessionClient } from "@/lib/mock-session";
import { isHostSession, type SessionContext } from "@/lib/session";

export function Sidebar({ session }: { session: SessionContext }) {
  const pathname = usePathname();
  const navGroups = getNavGroups(session);
  const hostMode = isHostSession(session);
  const { t } = useI18n();

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-slate-900 text-white">
      <div className="border-b border-slate-800 px-5 py-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-400">
          ABSHealthcareLite
        </p>
        <h1 className="mt-1 text-lg font-semibold">
          {hostMode ? t("common.shell.hostConsole") : t("common.shell.tenantWorkspace")}
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          {session.tenantName}
        </p>
        {!hostMode && (
          <p className="text-xs text-slate-500">{session.branchName}</p>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.titleKey}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {t(group.titleKey)}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active =
                  item.href === "/patients"
                    ? pathname === "/patients"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-teal-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white",
                    )}
                  >
                    <span className="text-base opacity-80">{item.icon}</span>
                    {t(`navigation.${item.labelKey}`)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 px-5 py-4">
        <p className="text-sm font-medium">{session.user.name}</p>
        <p className="text-xs text-slate-400">
          {session.user.role} · {session.user.employeeCode}
        </p>
      </div>
    </aside>
  );
}

export function TopBar({
  session,
  switchableBranches = [],
}: {
  session: SessionContext;
  switchableBranches?: SwitchableBranchOption[];
}) {
  const hostMode = isHostSession(session);
  const { t } = useI18n();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
            {hostMode ? t("common.labels.platformHost") : session.branchCode}
          </p>
          <p className="text-sm text-slate-600">
            {hostMode
              ? `${session.tenantName} · ${session.tenantCode}`
              : `${session.branchName} · ${session.tenantCode}`}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {!hostMode && (
            <BranchSwitcher
              currentBranchId={session.branchId}
              branches={switchableBranches}
            />
          )}
          <LanguageSwitcher compact />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">
              {session.user.name}
            </p>
            <p className="text-xs text-slate-500">{session.user.role}</p>
          </div>
          <form
            action={async () => {
              clearMockSessionClient();
              await logoutAction();
            }}
          >
            <Button type="submit" variant="secondary">
              {t("common.actions.signOut")}
            </Button>
          </form>
        </div>
      </div>

      {!hostMode && (
        <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 bg-slate-50/80 px-6 py-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">{t("common.labels.companyTenant")}</span>
            <Badge variant="info">{session.tenantName}</Badge>
            <span className="font-mono text-slate-600">{session.tenantCode}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">{t("common.labels.branch")}</span>
            <Badge>{session.branchName}</Badge>
            <span className="font-mono text-slate-600">{session.branchCode}</span>
          </div>
        </div>
      )}
    </header>
  );
}

export function AppShell({
  session,
  switchableBranches = [],
  children,
}: {
  session: SessionContext;
  switchableBranches?: SwitchableBranchOption[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar session={session} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar session={session} switchableBranches={switchableBranches} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
