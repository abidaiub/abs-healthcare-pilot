import type { LabReportSnapshot } from "@/lib/laboratory-report-release/snapshot";

export function renderReportHtml(snapshot: LabReportSnapshot, options?: { watermark?: string | null }): string {
  const watermark = options?.watermark ?? null;
  const resultRows = snapshot.results
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.parameterName)}</td>
          <td class="value">${escapeHtml(item.valueDisplay)}${item.unit ? ` ${escapeHtml(item.unit)}` : ""}</td>
          <td>${escapeHtml(item.referenceRange ?? "—")}</td>
          <td>${escapeHtml(item.abnormalFlag)}${item.isCritical ? " *" : ""}</td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(snapshot.reportNumber)}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; color: #111827; margin: 0; padding: 24px; }
    .sheet { max-width: 820px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 32px; position: relative; }
    .watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      font-size: 72px; font-weight: 700; color: rgba(148,163,184,.25); transform: rotate(-20deg); pointer-events: none; }
    header { text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 16px; margin-bottom: 20px; }
    h1 { margin: 0; font-size: 22px; }
    .meta { font-size: 12px; color: #4b5563; margin-top: 4px; }
    section { margin-bottom: 18px; }
    section h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #0f766e; margin: 0 0 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
    th { background: #f8fafc; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
    .value { font-weight: 600; }
    footer { margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #4b5563; }
    .signature { margin-top: 24px; }
    .amended { color: #7c3aed; font-weight: 700; }
    @media print {
      body { padding: 0; }
      .sheet { border: none; max-width: none; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    ${watermark ? `<div class="watermark">${escapeHtml(watermark)}</div>` : ""}
    <header>
      <h1>${escapeHtml(snapshot.tenant.name)}</h1>
      <div class="meta">${escapeHtml(snapshot.branch.name)} · ${escapeHtml(snapshot.branch.code)}</div>
      <div class="meta">Laboratory Diagnostic Report</div>
    </header>

    <section>
      <h2>Report</h2>
      <div class="grid">
        <div><strong>Report No:</strong> ${escapeHtml(snapshot.reportNumber)}</div>
        <div><strong>Version:</strong> ${snapshot.versionNumber}</div>
        <div><strong>Order No:</strong> ${escapeHtml(snapshot.order.orderNumber)}</div>
        <div><strong>Released:</strong> ${snapshot.releasedAt ? escapeHtml(new Date(snapshot.releasedAt).toLocaleString()) : "—"}</div>
      </div>
      ${snapshot.isAmended ? `<p class="amended">Amended report${snapshot.amendmentReason ? `: ${escapeHtml(snapshot.amendmentReason)}` : ""}</p>` : ""}
    </section>

    <section>
      <h2>Patient</h2>
      <div class="grid">
        <div><strong>Name:</strong> ${escapeHtml(snapshot.patient.fullName)}</div>
        <div><strong>MRN:</strong> ${escapeHtml(snapshot.patient.patientNumber)}</div>
        <div><strong>Gender:</strong> ${escapeHtml(snapshot.patient.gender)}</div>
        <div><strong>Age:</strong> ${escapeHtml(snapshot.patient.ageDisplay)}</div>
      </div>
    </section>

    <section>
      <h2>Sample & Test</h2>
      <div class="grid">
        <div><strong>Accession:</strong> ${escapeHtml(snapshot.sample.accessionNumber)}</div>
        <div><strong>Test:</strong> ${escapeHtml(snapshot.test.testName)}</div>
        <div><strong>Sample type:</strong> ${escapeHtml(snapshot.sample.sampleType ?? "—")}</div>
        <div><strong>Department:</strong> ${escapeHtml(snapshot.test.departmentName ?? "—")}</div>
      </div>
    </section>

    <section>
      <h2>Results</h2>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Result</th>
            <th>Reference</th>
            <th>Flag</th>
          </tr>
        </thead>
        <tbody>${resultRows}</tbody>
      </table>
      ${snapshot.reportNote ? `<p><strong>Report note:</strong> ${escapeHtml(snapshot.reportNote)}</p>` : ""}
    </section>

    <section class="signature">
      <h2>Verification</h2>
      <p><strong>${escapeHtml(snapshot.verifier.displayName)}</strong></p>
      ${snapshot.verifier.designation ? `<p>${escapeHtml(snapshot.verifier.designation)}</p>` : ""}
      ${snapshot.verifier.registrationNumber ? `<p>Reg: ${escapeHtml(snapshot.verifier.registrationNumber)}</p>` : ""}
      <p>Verified: ${escapeHtml(new Date(snapshot.verifier.verifiedAt).toLocaleString())}</p>
      ${snapshot.verifier.verificationComment ? `<p>${escapeHtml(snapshot.verifier.verificationComment)}</p>` : ""}
    </section>

    <footer>
      <div>This report was generated electronically. Scan QR token for authenticity verification.</div>
    </footer>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
