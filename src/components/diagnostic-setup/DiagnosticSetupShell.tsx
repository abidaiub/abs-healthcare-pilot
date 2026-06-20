"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";
import { DIAGNOSTIC_SETUP_NAV } from "@/lib/diagnostic-master-data";

export function DiagnosticSetupNav() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 lg:w-56">
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Diagnostic Setup
        </p>
        <nav className="mt-2 space-y-0.5">
          {DIAGNOSTIC_SETUP_NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-teal-50 text-teal-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export function Layer2Banner({ tenantName }: { tenantName: string }) {
  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
        Layer 2 — Diagnostic Master Management
      </p>
      <p className="mt-1 text-sm text-teal-900">
        {tenantName} · Configure diagnostic masters before billing and LIS. Data
        loaded from Prisma for this tenant.
      </p>
    </div>
  );
}
