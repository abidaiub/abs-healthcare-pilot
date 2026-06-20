"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { Badge, cn, Select } from "@/components/ui";
import { getNavGroups } from "@/lib/navigation";
import { clearMockSessionClient } from "@/lib/mock-session";
import { isHostSession, type SessionContext } from "@/lib/session";

const LANGUAGES = [
  { code: "EN", label: "English" },
  { code: "BN", label: "বাংলা" },
  { code: "AR", label: "العربية" },
  { code: "UR", label: "اردو" },
  { code: "HI", label: "हिन्दी" },
] as const;

export function Sidebar({ session }: { session: SessionContext }) {
  const pathname = usePathname();
  const navGroups = getNavGroups(session);
  const hostMode = isHostSession(session);

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-slate-900 text-white">
      <div className="border-b border-slate-800 px-5 py-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-400">
          ABSHealthcareLite
        </p>
        <h1 className="mt-1 text-lg font-semibold">
          {hostMode ? "Host Console" : "Tenant Workspace"}
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
          <div key={group.title}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {group.title}
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
                    {item.label}
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

export function TopBar({ session }: { session: SessionContext }) {
  const hostMode = isHostSession(session);
  const [language, setLanguage] = useState("EN");

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
            {hostMode ? "Platform Host" : session.branchCode}
          </p>
          <p className="text-sm text-slate-600">
            {hostMode
              ? `${session.tenantName} · ${session.tenantCode}`
              : `${session.branchName} · ${session.tenantCode}`}
          </p>
        </div>

        <div className="flex items-center gap-4">
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
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      {!hostMode && (
        <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 bg-slate-50/80 px-6 py-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Company / Tenant</span>
            <Badge variant="info">{session.tenantName}</Badge>
            <span className="font-mono text-slate-600">{session.tenantCode}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Branch</span>
            <Badge>{session.branchName}</Badge>
            <span className="font-mono text-slate-600">{session.branchCode}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500">Language</span>
            <Select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-auto min-w-[100px] py-1.5 text-xs"
              aria-label="Language selector"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.code} — {lang.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}
    </header>
  );
}

export function AppShell({
  session,
  children,
}: {
  session: SessionContext;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar session={session} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar session={session} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
