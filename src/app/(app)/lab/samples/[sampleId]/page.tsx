import Link from "next/link";
import { notFound } from "next/navigation";
import { ModulePageHeader } from "@/components/layout/ModulePageHeader";
import { LabSampleDetailPanel } from "@/components/laboratory/LabSampleDetailPanel";
import { getLabSampleByIdAction } from "@/app/actions/tenant-lab-orders";
import { getServerI18n } from "@/lib/i18n/server";
import { hasTenantPermission, requireTenantPermission } from "@/lib/rbac/auth";

type PageProps = { params: Promise<{ sampleId: string }> };

export default async function LabSampleDetailPage({ params }: PageProps) {
  const session = await requireTenantPermission("/lab/orders");
  const { t } = await getServerI18n(session);
  const { sampleId } = await params;
  const sample = await getLabSampleByIdAction(sampleId).catch(() => null);
  if (!sample) notFound();

  const [canCollect, canPrint] = await Promise.all([
    hasTenantPermission(session.tenantId, session.userId, "/lab/collection", "canEdit"),
    hasTenantPermission(session.tenantId, session.userId, "/lab/samples/label", "canPrint"),
  ]);

  return (
    <div className="space-y-6">
      <ModulePageHeader
        screenKey="labSampleDetail"
        description={t("laboratory.sample.description")}
        action={
          canPrint ? (
            <Link href={`/lab/samples/${sampleId}/label`}>
              <span className="inline-flex rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white">
                {t("laboratory.actions.printLabel")}
              </span>
            </Link>
          ) : undefined
        }
      />
      <LabSampleDetailPanel sample={sample} canCollect={canCollect} />
    </div>
  );
}
