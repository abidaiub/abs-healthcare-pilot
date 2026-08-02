import type { AnalyzerImportChannel } from "@/generated/prisma/client";
import { LAB_LIS_ERROR_CODES } from "@/lib/laboratory-lis/errors";

export type AnalyzerObservation = {
  /** Machine-side test or parameter code, e.g. `WBC`. */
  machineTestCode: string;
  value: string;
  unit: string | null;
};

export type ParsedAnalyzerMessage = {
  messageControlId: string;
  /** Barcode/accession value transmitted by the machine. Patient names are never used. */
  machineSampleId: string;
  analyzerCode: string | null;
  observations: AnalyzerObservation[];
};

export type ParseResult =
  | { ok: true; message: ParsedAnalyzerMessage }
  | { ok: false; errorCode: string };

function splitSegments(raw: string): string[] {
  return raw
    .split(/[\r\n]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** First component of an HL7/ASTM field, e.g. `WBC^White Blood Cell` → `WBC`. */
function firstComponent(field: string | undefined): string {
  if (!field) return "";
  return field.split("^").map((part) => part.trim()).filter(Boolean)[0] ?? "";
}

/**
 * Minimal HL7 v2 ORU^R01 reader: MSH-10 message control id, OBR-3 / SPM-2 specimen id,
 * OBX-3 observation identifier, OBX-5 value, OBX-6 unit.
 */
function parseHl7(raw: string): ParseResult {
  const segments = splitSegments(raw);
  let messageControlId = "";
  let machineSampleId = "";
  let analyzerCode: string | null = null;
  const observations: AnalyzerObservation[] = [];

  for (const segment of segments) {
    const fields = segment.split("|");
    const name = fields[0]?.toUpperCase();

    if (name === "MSH") {
      // After splitting on '|', index 2 is MSH-3 (Sending Application = analyzer code).
      // Index 3 is MSH-4 (Sending Facility), which is the site, not the device.
      messageControlId = fields[9]?.trim() ?? "";
      analyzerCode = firstComponent(fields[2]) || firstComponent(fields[3]) || null;
    } else if (name === "OBR" && !machineSampleId) {
      machineSampleId = firstComponent(fields[3]);
    } else if (name === "SPM") {
      const specimenId = firstComponent(fields[2]);
      if (specimenId) machineSampleId = specimenId;
    } else if (name === "OBX") {
      const machineTestCode = firstComponent(fields[3]);
      const value = fields[5]?.trim() ?? "";
      const unit = firstComponent(fields[6]) || null;
      if (machineTestCode) observations.push({ machineTestCode, value, unit });
    }
  }

  if (!messageControlId) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_MESSAGE_CONTROL_ID_REQUIRED };
  }
  if (!machineSampleId) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_SAMPLE_ID_REQUIRED };
  }
  if (!observations.length) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_OBSERVATION_REQUIRED };
  }

  return { ok: true, message: { messageControlId, machineSampleId, analyzerCode, observations } };
}

/**
 * Minimal ASTM E1394 reader: H-record message id, O-record specimen id,
 * R-record test code / value / unit.
 */
function parseAstm(raw: string): ParseResult {
  const segments = splitSegments(raw);
  let messageControlId = "";
  let machineSampleId = "";
  let analyzerCode: string | null = null;
  const observations: AnalyzerObservation[] = [];

  for (const segment of segments) {
    const fields = segment.split("|");
    const recordType = fields[0]?.replace(/^\d+/, "").trim().toUpperCase();

    if (recordType === "H") {
      messageControlId = firstComponent(fields[13]) || firstComponent(fields[4]);
      analyzerCode = firstComponent(fields[4]) || null;
    } else if (recordType === "O") {
      machineSampleId = firstComponent(fields[2]) || firstComponent(fields[3]);
    } else if (recordType === "R") {
      const machineTestCode = fields[2]
        ?.split("^")
        .map((part) => part.trim())
        .filter(Boolean)
        .pop();
      const value = fields[3]?.trim() ?? "";
      const unit = fields[4]?.trim() || null;
      if (machineTestCode) observations.push({ machineTestCode, value, unit });
    }
  }

  if (!messageControlId) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_MESSAGE_CONTROL_ID_REQUIRED };
  }
  if (!machineSampleId) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_SAMPLE_ID_REQUIRED };
  }
  if (!observations.length) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_OBSERVATION_REQUIRED };
  }

  return { ok: true, message: { messageControlId, machineSampleId, analyzerCode, observations } };
}

/** Middleware/API/CSV payloads arrive already normalised as JSON. */
function parseJson(raw: string): ParseResult {
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_MESSAGE_INVALID };
  }

  if (typeof payload !== "object" || payload === null) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_MESSAGE_INVALID };
  }

  const record = payload as Record<string, unknown>;
  const messageControlId = typeof record.messageControlId === "string" ? record.messageControlId.trim() : "";
  const machineSampleId = typeof record.machineSampleId === "string" ? record.machineSampleId.trim() : "";
  const analyzerCode = typeof record.analyzerCode === "string" ? record.analyzerCode.trim() : null;
  const rawObservations = Array.isArray(record.observations) ? record.observations : [];

  const observations: AnalyzerObservation[] = [];
  for (const entry of rawObservations) {
    if (typeof entry !== "object" || entry === null) continue;
    const row = entry as Record<string, unknown>;
    const machineTestCode = typeof row.machineTestCode === "string" ? row.machineTestCode.trim() : "";
    if (!machineTestCode) continue;
    observations.push({
      machineTestCode,
      value: row.value == null ? "" : String(row.value).trim(),
      unit: typeof row.unit === "string" && row.unit.trim() ? row.unit.trim() : null,
    });
  }

  if (!messageControlId) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_MESSAGE_CONTROL_ID_REQUIRED };
  }
  if (!machineSampleId) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_SAMPLE_ID_REQUIRED };
  }
  if (!observations.length) {
    return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_OBSERVATION_REQUIRED };
  }

  return { ok: true, message: { messageControlId, machineSampleId, analyzerCode, observations } };
}

export function parseAnalyzerMessage(channel: AnalyzerImportChannel, raw: string): ParseResult {
  const payload = raw?.trim();
  if (!payload) return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_MESSAGE_INVALID };

  switch (channel) {
    case "HL7":
      return parseHl7(payload);
    case "ASTM":
      return parseAstm(payload);
    case "CSV":
    case "API":
    case "MIDDLEWARE":
      return parseJson(payload);
    default:
      return { ok: false, errorCode: LAB_LIS_ERROR_CODES.LAB_LIS_MESSAGE_INVALID };
  }
}
