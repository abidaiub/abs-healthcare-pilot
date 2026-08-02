import type {
  AnalyzerImportChannel,
  AnalyzerImportErrorCode,
  AnalyzerImportStatus,
  ResultSource,
} from "@/generated/prisma/client";

export const ANALYZER_IMPORT_STATUS_I18N: Record<AnalyzerImportStatus, string> = {
  PENDING: "laboratoryLis.status.pending",
  SUCCESS: "laboratoryLis.status.success",
  ERROR: "laboratoryLis.status.error",
  QUARANTINED: "laboratoryLis.status.quarantined",
  DUPLICATE: "laboratoryLis.status.duplicate",
  RECONCILED: "laboratoryLis.status.reconciled",
};

export const ANALYZER_IMPORT_CHANNEL_I18N: Record<AnalyzerImportChannel, string> = {
  HL7: "laboratoryLis.channel.hl7",
  ASTM: "laboratoryLis.channel.astm",
  CSV: "laboratoryLis.channel.csv",
  API: "laboratoryLis.channel.api",
  MIDDLEWARE: "laboratoryLis.channel.middleware",
};

export const ANALYZER_IMPORT_ERROR_I18N: Record<AnalyzerImportErrorCode, string> = {
  UNMAPPED_TEST_CODE: "laboratoryLis.importError.unmappedTestCode",
  UNKNOWN_SAMPLE_BARCODE: "laboratoryLis.importError.unknownSampleBarcode",
  SAMPLE_REJECTED: "laboratoryLis.importError.sampleRejected",
  TEST_ALREADY_COMPLETED: "laboratoryLis.importError.testAlreadyCompleted",
  DUPLICATE_MESSAGE: "laboratoryLis.importError.duplicateMessage",
  PARAMETER_NOT_FOUND: "laboratoryLis.importError.parameterNotFound",
  BRANCH_SCOPE_MISMATCH: "laboratoryLis.importError.branchScopeMismatch",
  INVALID_PAYLOAD: "laboratoryLis.importError.invalidPayload",
};

export const RESULT_SOURCE_I18N: Record<ResultSource, string> = {
  MANUAL_ENTRY: "laboratoryLis.resultSource.manualEntry",
  ANALYZER_IMPORT: "laboratoryLis.resultSource.analyzerImport",
  CALCULATED: "laboratoryLis.resultSource.calculated",
  EXTERNAL_API: "laboratoryLis.resultSource.externalApi",
};

/** Statuses that still need operator attention on the LIS worklist. */
export const OPEN_ANALYZER_IMPORT_STATUSES: AnalyzerImportStatus[] = [
  "PENDING",
  "ERROR",
  "QUARANTINED",
];

/** A quarantined or errored message may be reconciled and replayed. */
export function isReconcilable(status: AnalyzerImportStatus): boolean {
  return status === "QUARANTINED" || status === "ERROR" || status === "PENDING";
}

/** Once a message produced a result it must never be replayed. */
export function isTerminalImportStatus(status: AnalyzerImportStatus): boolean {
  return status === "SUCCESS" || status === "RECONCILED" || status === "DUPLICATE";
}
