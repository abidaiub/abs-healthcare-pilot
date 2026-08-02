"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { READINESS_WIZARD_STEPS } from "@/lib/operational-readiness/constants";
import { cn } from "@/components/ui";

export function ReadinessWizardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3">
      {READINESS_WIZARD_STEPS.map((step) => {
        const active =
          pathname === step.href ||
          (step.href !== "/settings/readiness" && pathname.startsWith(step.href));
        return (
          <Link
            key={step.key}
            href={step.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              active
                ? "bg-teal-700 text-white"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100",
            )}
          >
            {step.label}
          </Link>
        );
      })}
    </nav>
  );
}
