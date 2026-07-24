import type { LabReportSnapshot } from "@/lib/laboratory-report-release/snapshot";

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/**
 * Minimal server-side PDF generator (no browser print-to-PDF dependency).
 */
export function generateReportPdfBuffer(snapshot: LabReportSnapshot): Buffer {
  const lines: string[] = [
    snapshot.tenant.name,
    snapshot.branch.name,
    `Report: ${snapshot.reportNumber}`,
    `Patient: ${snapshot.patient.fullName} (${snapshot.patient.patientNumber})`,
    `Test: ${snapshot.test.testName}`,
    `Sample: ${snapshot.sample.accessionNumber}`,
    "",
    "Results:",
  ];

  for (const item of snapshot.results) {
    lines.push(
      `${item.parameterName}: ${item.valueDisplay}${item.unit ? ` ${item.unit}` : ""} [${item.abnormalFlag}]`,
    );
  }

  lines.push(
    "",
    `Verified by: ${snapshot.verifier.displayName}`,
    snapshot.verifier.verifiedAt ? `Verified at: ${snapshot.verifier.verifiedAt}` : "",
    snapshot.isAmended ? "AMENDED REPORT" : "",
  );

  const contentLines = lines
    .filter(Boolean)
    .map((line, index) => `BT /F1 10 Tf 50 ${780 - index * 14} Td (${escapePdfText(line)}) Tj ET`)
    .join("\n");

  const content = `${contentLines}\n`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${Buffer.byteLength(content, "utf8")} >> stream\n${content}endstream endobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.subarray(0, 4).toString("utf8") === "%PDF";
}
