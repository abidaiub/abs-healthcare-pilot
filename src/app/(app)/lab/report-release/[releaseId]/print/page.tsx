import { notFound } from "next/navigation";
import { getReportSnapshotForPrintAction } from "@/app/actions/tenant-lab-report-release";
import { requireTenantPermission } from "@/lib/rbac/auth";
import { renderReportHtml } from "@/lib/laboratory-report-release/render-html";

type PageProps = {
  params: Promise<{ releaseId: string }>;
  searchParams: Promise<{ auto?: string }>;
};

export default async function ReportReleasePrintPage({ params, searchParams }: PageProps) {
  await requireTenantPermission("/lab/report-release/print", "canPrint");
  const { releaseId } = await params;
  const query = await searchParams;

  const payload = await getReportSnapshotForPrintAction(releaseId).catch(() => null);
  if (!payload || payload.release.status !== "RELEASED" || !payload.snapshot) {
    notFound();
  }

  const html = renderReportHtml(payload.snapshot, {
    watermark: payload.snapshot.isAmended ? "AMENDED" : null,
  });

  const autoPrint = query.auto === "1";

  return (
    <div className="min-h-screen bg-white p-4 print:p-0">
      <iframe
        title={payload.snapshot.reportNumber}
        className="h-[1100px] w-full border border-slate-200 print:h-auto print:border-0"
        srcDoc={html}
      />
      {autoPrint ? (
        <script
          dangerouslySetInnerHTML={{
            __html: "window.addEventListener('load', () => setTimeout(() => window.print(), 400));",
          }}
        />
      ) : null}
    </div>
  );
}
