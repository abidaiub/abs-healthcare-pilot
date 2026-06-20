export const PLATFORM_STATS = [
  { label: "Hospitals", value: "18" },
  { label: "Users", value: "1,240" },
  { label: "Patients", value: "86.5K" },
  { label: "Modules", value: "32" },
] as const;

const KEY_FEATURES = [
  {
    title: "Multilingual Support",
    description: "English, Bangla, Arabic, and extensible locale packs.",
  },
  {
    title: "AI Ready",
    description: "Structured for clinical decision support and automation.",
  },
  {
    title: "Telemedicine Ready",
    description: "Virtual consult, queue, and remote follow-up workflows.",
  },
  {
    title: "PostgreSQL Ready",
    description: "Enterprise-grade multi-tenant data architecture.",
  },
] as const;

export function LoginBrandingPanel({
  headline = "Unified platform for hospitals, diagnostics, and healthcare groups",
  description = "Manage tenants, branches, clinical workflows, billing, and reporting from a single host-controlled environment.",
}: {
  headline?: string;
  description?: string;
}) {
  return (
    <div className="hidden w-1/2 bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <span className="text-lg font-bold tracking-tight">AB</span>
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">ABSHealthcareLite</p>
            <p className="text-xs text-teal-200">
              Multi-Tenant Hospital &amp; Diagnostic ERP
            </p>
          </div>
        </div>

        <h1 className="mt-10 max-w-lg text-3xl font-semibold leading-tight">
          {headline}
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-teal-100">
          {description}
        </p>

        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-200">
            Key Features
          </p>
          <ul className="mt-4 space-y-4">
            {KEY_FEATURES.map((feature) => (
              <li key={feature.title} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" />
                <div>
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-teal-200">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-200">
          Platform Statistics
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {PLATFORM_STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
              <p className="mt-0.5 text-xs text-teal-200">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
