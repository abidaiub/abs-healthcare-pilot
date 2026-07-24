import { verifyReportTokenAction } from "@/app/actions/tenant-lab-report-release";
import { Card, CardBody } from "@/components/ui";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function PublicReportVerificationPage({ params }: PageProps) {
  const { token } = await params;
  const result = await verifyReportTokenAction(token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-lg">
        <div className="border-b border-slate-100 px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-900">Report Verification</h1>
          <p className="mt-1 text-sm text-slate-500">ABSHealthcareLite diagnostic report authenticity check</p>
        </div>
        <CardBody className="space-y-4 text-sm">
          {!result.ok ? (
            <p className="text-rose-700">Verification failed: {result.errorCode}</p>
          ) : (
            <>
              <p><strong>Report number:</strong> {result.reportNumber}</p>
              <p><strong>Release status:</strong> {result.releaseStatus}</p>
              <p><strong>Verification validity:</strong> {result.isValid ? "Valid" : "Not valid"}</p>
              <p><strong>Version:</strong> {result.versionNumber}</p>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
