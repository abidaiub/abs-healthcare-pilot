import { toSVG } from "bwip-js/node";
import QRCode from "qrcode";

/**
 * Code 128 linear barcode as an SVG data URL. Code 128 is used because tube-reading
 * laboratory scanners and the analyzer interface both read the accession value from it.
 */
export function generateCode128SvgDataUrl(value: string): string {
  const svg = toSVG({
    bcid: "code128",
    text: value,
    height: 12,
    includetext: false,
    paddingwidth: 0,
    paddingheight: 0,
  });
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

/**
 * QR encoding of the same sample value, for handheld camera scanners. The payload carries
 * only the barcode value so a scanned label never exposes patient identity.
 */
export async function generateSampleQrSvgDataUrl(value: string, size = 96): Promise<string> {
  const svg = await QRCode.toString(value, {
    type: "svg",
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
  });
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

export type SampleLabelCodes = {
  barcodeSvgDataUrl: string;
  qrSvgDataUrl: string;
};

export async function generateSampleLabelCodes(value: string): Promise<SampleLabelCodes> {
  const [qrSvgDataUrl] = await Promise.all([generateSampleQrSvgDataUrl(value)]);
  return {
    barcodeSvgDataUrl: generateCode128SvgDataUrl(value),
    qrSvgDataUrl,
  };
}
