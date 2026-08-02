import {
  Prisma,
  type AnalyzerImportChannel,
  type AnalyzerImportErrorCode,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { computeAbnormalFlag } from "@/lib/laboratory-result/abnormal-flags";
import { ensureLabResultDraft } from "@/lib/laboratory-result/draft";
import { validateResultValue } from "@/lib/laboratory-result/validation";
import { LAB_LIS_ERROR_CODES } from "@/lib/laboratory-lis/errors";
import {
  parseAnalyzerMessage,
  type AnalyzerObservation,
  type ParsedAnalyzerMessage,
} from "@/lib/laboratory-lis/parse";

export type IngestAnalyzerMessageInput = {
  tenantId: string;
  /** Branch the receiving analyzer belongs to. Messages never cross this boundary. */
  branchId: string;
  userId: string;
  channel: AnalyzerImportChannel;
  rawPayload: string;
};

export type IngestOutcome =
  | {
      ok: true;
      queueId: string;
      status: "SUCCESS" | "RECONCILED";
      labResultId: string;
      appliedCount: number;
    }
  | {
      ok: false;
      queueId: string | null;
      status: "QUARANTINED" | "DUPLICATE";
      errorCode: AnalyzerImportErrorCode;
      errorMessage: string;
    }
  | { ok: false; queueId: null; status: "REJECTED"; errorCode: string; errorMessage: string };

/** Thrown inside the attach transaction so nothing is written when a message cannot be trusted. */
class QuarantineError extends Error {
  constructor(
    readonly errorCode: AnalyzerImportErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "QuarantineError";
  }
}

type AttachOverrides = {
  machineSampleId?: string;
  machineTestCodeMap?: Record<string, string>;
};

async function recordQuarantine(input: {
  tenantId: string;
  queueId: string;
  errorCode: AnalyzerImportErrorCode;
  errorMessage: string;
  markStatus: "QUARANTINED" | "DUPLICATE";
}) {
  await prisma.$transaction(async (tx) => {
    await tx.analyzerImportQueue.update({
      where: { id: input.queueId },
      data: {
        processedStatus: input.markStatus,
        attemptCount: { increment: 1 },
        processedAt: new Date(),
      },
    });
    await tx.analyzerErrorQueue.create({
      data: {
        tenantId: input.tenantId,
        queueId: input.queueId,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
      },
    });
  });
}

/**
 * Resolves the sample strictly by machine barcode or accession number within the tenant and
 * branch. Patient name is never used as a matching key.
 */
async function resolveSample(
  tx: Prisma.TransactionClient,
  input: { tenantId: string; branchId: string; machineSampleId: string },
) {
  const sample = await tx.labSample.findFirst({
    where: {
      tenantId: input.tenantId,
      OR: [
        { barcodeValue: input.machineSampleId },
        { accessionNumber: input.machineSampleId },
      ],
    },
    include: { labOrder: { select: { id: true, branchId: true } } },
  });

  if (!sample) {
    throw new QuarantineError(
      "UNKNOWN_SAMPLE_BARCODE",
      `No sample matches machine sample id ${input.machineSampleId}`,
    );
  }
  if (sample.branchId !== input.branchId) {
    throw new QuarantineError(
      "BRANCH_SCOPE_MISMATCH",
      "Sample belongs to a different branch than the receiving analyzer",
    );
  }
  if (sample.sampleStatus === "REJECTED" || sample.recollectionRequired) {
    throw new QuarantineError(
      "SAMPLE_REJECTED",
      "Sample is rejected or awaiting recollection and cannot accept results",
    );
  }
  return sample;
}

function toNumericOrNull(value: string): number | null {
  const cleaned = value.replace(/[<>=]/g, "").trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

async function attachMessage(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    branchId: string;
    userId: string;
    queueId: string;
    analyzerId: string | null;
    parsed: ParsedAnalyzerMessage;
    overrides: AttachOverrides;
  },
) {
  const machineSampleId = input.overrides.machineSampleId?.trim() || input.parsed.machineSampleId;
  const sample = await resolveSample(tx, {
    tenantId: input.tenantId,
    branchId: input.branchId,
    machineSampleId,
  });

  if (!input.analyzerId) {
    throw new QuarantineError(
      "INVALID_PAYLOAD",
      "Message does not identify a registered analyzer for this branch",
    );
  }

  const mappings = await tx.analyzerMapping.findMany({
    where: { tenantId: input.tenantId, analyzerId: input.analyzerId, isActive: true },
  });

  type ResolvedObservation = {
    observation: AnalyzerObservation;
    tenantServiceId: string;
    parameterCode: string;
  };

  const resolved: ResolvedObservation[] = [];
  for (const observation of input.parsed.observations) {
    const machineTestCode =
      input.overrides.machineTestCodeMap?.[observation.machineTestCode]?.trim() ||
      observation.machineTestCode;
    const mapping = mappings.find((row) => row.machineTestCode === machineTestCode);
    if (!mapping) {
      throw new QuarantineError(
        "UNMAPPED_TEST_CODE",
        `Machine test code ${machineTestCode} is not mapped for this analyzer`,
      );
    }
    resolved.push({
      observation,
      tenantServiceId: mapping.tenantServiceId,
      parameterCode: mapping.parameterCode ?? machineTestCode,
    });
  }

  const serviceIds = [...new Set(resolved.map((row) => row.tenantServiceId))];
  if (serviceIds.length !== 1) {
    throw new QuarantineError(
      "INVALID_PAYLOAD",
      "Message mixes observations from more than one catalog service",
    );
  }
  const tenantServiceId = serviceIds[0];

  const sampleTest = await tx.labSampleTest.findFirst({
    where: {
      labSampleId: sample.id,
      labOrderTest: { tenantId: input.tenantId, tenantServiceId },
    },
    include: { labOrderTest: true },
  });

  if (!sampleTest) {
    throw new QuarantineError(
      "UNMAPPED_TEST_CODE",
      "Mapped test is not ordered against the transmitted sample",
    );
  }

  const orderTest = sampleTest.labOrderTest;
  if (orderTest.status === "COMPLETED" || orderTest.status === "CANCELLED") {
    throw new QuarantineError(
      "TEST_ALREADY_COMPLETED",
      `Test is already ${orderTest.status.toLowerCase()} and cannot accept an import`,
    );
  }

  const existingResult = await tx.labResult.findFirst({
    where: { tenantId: input.tenantId, labOrderTestId: orderTest.id, status: { not: "CANCELLED" } },
    select: { id: true, status: true },
  });
  if (
    existingResult &&
    ["VERIFIED", "RELEASE_PENDING", "RELEASED", "AMENDED"].includes(existingResult.status)
  ) {
    throw new QuarantineError(
      "TEST_ALREADY_COMPLETED",
      `Result is already ${existingResult.status} and must be corrected through the MOD-23 amendment workflow`,
    );
  }

  const draft = await ensureLabResultDraft(tx, {
    tenantId: input.tenantId,
    labOrderTestId: orderTest.id,
    userId: input.userId,
    branchId: input.branchId,
  });
  if (!draft.ok) {
    throw new QuarantineError("INVALID_PAYLOAD", draft.errorCode);
  }

  const items = await tx.labResultItem.findMany({
    where: { tenantId: input.tenantId, labResultId: draft.labResultId },
  });

  const now = new Date();
  let appliedCount = 0;

  for (const row of resolved) {
    const item = items.find(
      (candidate) => candidate.parameterCode.toUpperCase() === row.parameterCode.toUpperCase(),
    );
    if (!item) {
      throw new QuarantineError(
        "PARAMETER_NOT_FOUND",
        `Parameter ${row.parameterCode} does not exist on the result template`,
      );
    }

    const numericValue = item.resultType === "NUMERIC" ? toNumericOrNull(row.observation.value) : null;
    const textValue = item.resultType === "NUMERIC" ? null : row.observation.value || null;

    const validation = validateResultValue({
      resultType: item.resultType,
      numericValue,
      textValue,
      choiceValue: null,
      booleanValue: null,
      decimalPlaces: item.decimalPlaces,
      isRequired: item.isRequired,
    });
    if (!validation.ok) {
      throw new QuarantineError(
        "INVALID_PAYLOAD",
        `Transmitted value for ${row.parameterCode} failed validation: ${validation.errorCode}`,
      );
    }

    const flagResult = computeAbnormalFlag({
      resultType: item.resultType,
      numericValue,
      textValue,
      choiceValue: null,
      booleanValue: null,
      lowerBound: item.lowerBoundSnapshot ? Number(item.lowerBoundSnapshot) : null,
      upperBound: item.upperBoundSnapshot ? Number(item.upperBoundSnapshot) : null,
      criticalLow: item.criticalLowSnapshot ? Number(item.criticalLowSnapshot) : null,
      criticalHigh: item.criticalHighSnapshot ? Number(item.criticalHighSnapshot) : null,
      unitSnapshot: item.unitSnapshot,
      parameterUnit: item.unitSnapshot,
      rangeUnit: item.unitSnapshot,
    });

    await tx.labResultItem.update({
      where: { id: item.id },
      data: {
        numericValue: numericValue == null ? null : new Prisma.Decimal(numericValue),
        textValue,
        abnormalFlag: flagResult.flag,
        isCritical: flagResult.isCritical,
        resultSource: "ANALYZER_IMPORT",
        analyzerId: input.analyzerId,
        importedAt: now,
        importQueueId: input.queueId,
      },
    });

    if (flagResult.isCritical) {
      const openEvent = await tx.labCriticalValueEvent.findFirst({
        where: { labResultItemId: item.id, acknowledgedAt: null },
      });
      if (!openEvent) {
        await tx.labCriticalValueEvent.create({
          data: {
            tenantId: input.tenantId,
            labResultId: draft.labResultId,
            labResultItemId: item.id,
            detectedById: input.userId,
          },
        });
      }
    }

    appliedCount += 1;
  }

  await tx.labResult.update({
    where: { id: draft.labResultId },
    data: { status: "IN_PROGRESS", recordVersion: { increment: 1 } },
  });

  return { labResultId: draft.labResultId, labSampleId: sample.id, labOrderTestId: orderTest.id, appliedCount };
}

async function resolveAnalyzerId(input: {
  tenantId: string;
  branchId: string;
  analyzerCode: string | null;
}): Promise<string | null> {
  if (!input.analyzerCode) return null;
  const analyzer = await prisma.analyzer.findFirst({
    where: {
      tenantId: input.tenantId,
      branchId: input.branchId,
      analyzerCode: input.analyzerCode,
      isActive: true,
    },
    select: { id: true },
  });
  return analyzer?.id ?? null;
}

/**
 * Archives a raw analyzer message and attaches it to the matching result. Idempotent on
 * `(tenantId, messageControlId)`: a repeated message is recorded as DUPLICATE and never
 * creates a second result value.
 */
export async function ingestAnalyzerMessage(
  input: IngestAnalyzerMessageInput,
): Promise<IngestOutcome> {
  const parsedResult = parseAnalyzerMessage(input.channel, input.rawPayload);
  if (!parsedResult.ok) {
    return {
      ok: false,
      queueId: null,
      status: "REJECTED",
      errorCode: parsedResult.errorCode,
      errorMessage: "Message could not be parsed and was not queued",
    };
  }
  const parsed = parsedResult.message;

  const existing = await prisma.analyzerImportQueue.findFirst({
    where: { tenantId: input.tenantId, messageControlId: parsed.messageControlId },
    select: { id: true },
  });
  if (existing) {
    await prisma.analyzerErrorQueue.create({
      data: {
        tenantId: input.tenantId,
        queueId: existing.id,
        errorCode: "DUPLICATE_MESSAGE",
        errorMessage: `Message control id ${parsed.messageControlId} was already received`,
      },
    });
    return {
      ok: false,
      queueId: existing.id,
      status: "DUPLICATE",
      errorCode: "DUPLICATE_MESSAGE",
      errorMessage: LAB_LIS_ERROR_CODES.LAB_LIS_DUPLICATE_MESSAGE,
    };
  }

  const analyzerId = await resolveAnalyzerId({
    tenantId: input.tenantId,
    branchId: input.branchId,
    analyzerCode: parsed.analyzerCode,
  });

  const queue = await prisma.analyzerImportQueue.create({
    data: {
      tenantId: input.tenantId,
      branchId: input.branchId,
      analyzerId,
      machineSampleId: parsed.machineSampleId,
      machineTestCode: parsed.observations[0]?.machineTestCode ?? null,
      messageControlId: parsed.messageControlId,
      importChannel: input.channel,
      rawPayload: input.rawPayload,
      processedStatus: "PENDING",
    },
  });

  return processQueuedMessage({
    tenantId: input.tenantId,
    branchId: input.branchId,
    userId: input.userId,
    queueId: queue.id,
    analyzerId,
    parsed,
    overrides: {},
    successStatus: "SUCCESS",
  });
}

/** Runs the attach transaction for an already-archived queue row. */
export async function processQueuedMessage(input: {
  tenantId: string;
  branchId: string;
  userId: string;
  queueId: string;
  analyzerId: string | null;
  parsed: ParsedAnalyzerMessage;
  overrides: AttachOverrides;
  successStatus: "SUCCESS" | "RECONCILED";
}): Promise<IngestOutcome> {
  try {
    const attached = await prisma.$transaction(async (tx) => {
      const outcome = await attachMessage(tx, {
        tenantId: input.tenantId,
        branchId: input.branchId,
        userId: input.userId,
        queueId: input.queueId,
        analyzerId: input.analyzerId,
        parsed: input.parsed,
        overrides: input.overrides,
      });

      await tx.analyzerImportQueue.update({
        where: { id: input.queueId },
        data: {
          processedStatus: input.successStatus,
          processedAt: new Date(),
          processedById: input.userId,
          attemptCount: { increment: 1 },
          labSampleId: outcome.labSampleId,
          labOrderTestId: outcome.labOrderTestId,
          labResultId: outcome.labResultId,
          ...(input.overrides.machineSampleId
            ? { machineSampleId: input.overrides.machineSampleId.trim() }
            : {}),
        },
      });

      return outcome;
    });

    return {
      ok: true,
      queueId: input.queueId,
      status: input.successStatus,
      labResultId: attached.labResultId,
      appliedCount: attached.appliedCount,
    };
  } catch (error) {
    const quarantine =
      error instanceof QuarantineError
        ? { errorCode: error.errorCode, errorMessage: error.message }
        : {
            errorCode: "INVALID_PAYLOAD" as AnalyzerImportErrorCode,
            errorMessage: error instanceof Error ? error.message : "Unhandled import failure",
          };

    await recordQuarantine({
      tenantId: input.tenantId,
      queueId: input.queueId,
      errorCode: quarantine.errorCode,
      errorMessage: quarantine.errorMessage,
      markStatus: "QUARANTINED",
    });

    return {
      ok: false,
      queueId: input.queueId,
      status: "QUARANTINED",
      errorCode: quarantine.errorCode,
      errorMessage: quarantine.errorMessage,
    };
  }
}
