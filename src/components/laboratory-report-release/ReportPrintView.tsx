"use client";

import { useEffect } from "react";
import type { LabReportSnapshot } from "@/lib/laboratory-report-release/snapshot";

type ReportPrintViewProps = {
  snapshot: LabReportSnapshot;
  html: string;
  verificationUrl?: string | null;
  autoPrint?: boolean;
};

export function ReportPrintView({ snapshot, html, verificationUrl, autoPrint }: ReportPrintViewProps) {
  useEffect(() => {
    if (autoPrint) {
      const timer = window.setTimeout(() => window.print(), 300);
      return () => window.clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <div className="space-y-4">
      <div className="no-print rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {snapshot.reportNumber} · v{snapshot.versionNumber}
        {verificationUrl ? (
          <span className="ml-3 text-xs">QR: {verificationUrl}</span>
        ) : null}
      </div>
      <div dangerouslySetInnerHTML={{ __html: html.replace(/^[\s\S]*<body>/, "").replace(/<\/body>[\s\S]*$/, "") }} />
    </div>
  );
}
