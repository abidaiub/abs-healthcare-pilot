import PDFDocument from "pdfkit";
import type { LabReportSnapshot } from "@/lib/laboratory-report-release/snapshot";
import { generateQrPngBuffer } from "@/lib/laboratory-report-release/qr";

/**
 * Server-side PDF with embedded QR image (pdfkit).
 * Latin text only; multilingual/RTL PDF remains a known pilot limitation.
 */
export async function generateReportPdfBuffer(
  snapshot: LabReportSnapshot,
  verificationToken?: string | null,
): Promise<Buffer> {
  const qrBuffer = verificationToken ? await generateQrPngBuffer(verificationToken, 100) : null;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).text(snapshot.tenant.name, { align: "center" });
    doc.fontSize(10).text(`${snapshot.branch.name} · Laboratory Diagnostic Report`, { align: "center" });
    doc.moveDown();

    doc.fontSize(11).text(`Report: ${snapshot.reportNumber}  Version: ${snapshot.versionNumber}`);
    doc.text(`Patient: ${snapshot.patient.fullName} (${snapshot.patient.patientNumber})`);
    doc.text(`Test: ${snapshot.test.testName}`);
    doc.text(`Sample: ${snapshot.sample.accessionNumber}`);
    doc.moveDown();

    doc.fontSize(12).text("Results", { underline: true });
    doc.moveDown(0.5);
    for (const item of snapshot.results) {
      doc.fontSize(10).text(
        `${item.parameterName}: ${item.valueDisplay}${item.unit ? ` ${item.unit}` : ""} [${item.abnormalFlag}]`,
      );
    }

    doc.moveDown();
    doc.text(`Verified by: ${snapshot.verifier.displayName}`);
    if (snapshot.verifier.verifiedAt) {
      doc.text(`Verified at: ${new Date(snapshot.verifier.verifiedAt).toLocaleString()}`);
    }
    if (snapshot.isAmended) {
      doc.fillColor("#7c3aed").text("AMENDED REPORT").fillColor("#000000");
    }

    if (qrBuffer) {
      doc.moveDown();
      doc.fontSize(10).text("Scan QR code to verify report authenticity:");
      doc.image(qrBuffer, 50, doc.y, { width: 100 });
      doc.moveDown(5);
      doc.fontSize(8).text(`Report ${snapshot.reportNumber} · Version ${snapshot.versionNumber}`);
    }

    doc.end();
  });
}

export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.subarray(0, 4).toString("utf8") === "%PDF";
}

export function pdfContainsEmbeddedImage(buffer: Buffer): boolean {
  const text = buffer.toString("latin1");
  return text.includes("/Subtype /Image") || text.includes("/XObject");
}
