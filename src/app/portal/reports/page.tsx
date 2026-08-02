import { redirect } from "next/navigation";
import { getPortalReportsAction } from "@/app/actions/portal-reports";
import { PortalReportsPanel } from "@/components/portal/PortalReportsPanel";

export default async function PortalReportsPage() {
  const data = await getPortalReportsAction();
  if (!data) redirect("/portal/login");

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">My reports</h1>
        <p className="text-sm text-slate-600">
          Only reports released to you are shown here. Each download is recorded.
        </p>
      </div>
      <PortalReportsPanel data={data} />
    </main>
  );
}
