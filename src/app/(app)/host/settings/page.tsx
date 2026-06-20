import { Card, CardBody } from "@/components/ui";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { requireHostSession } from "@/lib/auth";

const SETTINGS = [
  {
    title: "Platform branding",
    description: "Logo, color theme, and customer-facing portal labels.",
  },
  {
    title: "Subscription billing",
    description: "Plan tiers, tenant billing cycles, and invoice templates.",
  },
  {
    title: "Security policies",
    description: "Password rules, session timeout, and MFA requirements.",
  },
  {
    title: "Data residency",
    description: "Region selection and backup retention for tenant data.",
  },
] as const;

export default async function SaasSettingsPage() {
  await requireHostSession();

  return (
    <div className="space-y-8">
      <ModulePageHeader
        screenKey="saasSettings"
        description="Configure SaaS platform defaults and host-level policies."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {SETTINGS.map((setting) => (
          <Card key={setting.title}>
            <CardBody>
              <p className="font-medium text-slate-900">{setting.title}</p>
              <p className="mt-2 text-sm text-slate-600">{setting.description}</p>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                Visual mock only
              </p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
