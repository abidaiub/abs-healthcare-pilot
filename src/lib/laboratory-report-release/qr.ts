import QRCode from "qrcode";
import { buildReportVerificationUrl } from "@/lib/laboratory-report-release/verification-url";

/** Server-generated PNG buffer for PDF embedding. */
export async function generateQrPngBuffer(token: string, size = 120): Promise<Buffer> {
  const url = buildReportVerificationUrl(token);
  return QRCode.toBuffer(url, {
    type: "png",
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
  });
}

/** Server-generated SVG data URL for printable HTML. */
export async function generateQrSvgDataUrl(token: string, size = 120): Promise<string> {
  const url = buildReportVerificationUrl(token);
  const svg = await QRCode.toString(url, {
    type: "svg",
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
  });
  const encoded = Buffer.from(svg, "utf8").toString("base64");
  return `data:image/svg+xml;base64,${encoded}`;
}

export function extractVerificationUrlFromQrPayload(payload: string): string | null {
  try {
    const parsed = new URL(payload);
    if (!parsed.pathname.startsWith("/verify/report/")) return null;
    return payload;
  } catch {
    return null;
  }
}
