import { Prisma } from "@/generated/prisma/client";
import { resolvePatientAgeInDays } from "@/lib/laboratory-result/age";
import { LAB_RESULT_ERROR_CODES } from "@/lib/laboratory-result/errors";
import { selectReferenceRange } from "@/lib/laboratory-result/range-selection";

export type EnsureDraftResult =
  | { ok: true; labResultId: string; branchId: string; created: boolean }
  | { ok: false; errorCode: string };

function decimalOrNull(value: number | null | undefined): Prisma.Decimal | null {
  if (value == null) return null;
  return new Prisma.Decimal(value);
}

/**
 * Returns the active result for a lab order test, creating the draft with reference-range
 * snapshots when none exists. Shared by manual entry (MOD-22) and analyzer import so both
 * paths produce identical parameter lines and range snapshots.
 */
export async function ensureLabResultDraft(
  tx: Prisma.TransactionClient,
  input: { tenantId: string; labOrderTestId: string; userId: string; branchId?: string | null },
): Promise<EnsureDraftResult> {
  const orderTest = await tx.labOrderTest.findFirst({
    where: { id: input.labOrderTestId, tenantId: input.tenantId },
    include: {
      labOrder: {
        include: {
          patient: {
            select: { gender: true, dateOfBirth: true, estimatedAge: true, ageAsOfDate: true },
          },
        },
      },
      sampleTests: { include: { labSample: true } },
    },
  });

  if (!orderTest) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_ORDER_TEST_INVALID };
  }
  if (orderTest.status !== "READY_FOR_RESULT" && orderTest.status !== "RESULT_IN_PROGRESS") {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_SOURCE_NOT_READY };
  }

  const existing = await tx.labResult.findFirst({
    where: {
      tenantId: input.tenantId,
      labOrderTestId: input.labOrderTestId,
      status: { not: "CANCELLED" },
    },
    select: { id: true, branchId: true },
  });
  if (existing) {
    return { ok: true, labResultId: existing.id, branchId: existing.branchId, created: false };
  }

  const sampleLink = orderTest.sampleTests.find(
    (row) =>
      row.labSample.sampleStatus === "READY_FOR_RESULT" ||
      row.labSample.sampleStatus === "IN_PROCESS" ||
      row.labSample.sampleStatus === "RECEIVED",
  );
  if (!sampleLink) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_SAMPLE_INVALID };
  }

  const sample = sampleLink.labSample;
  if (input.branchId && sample.branchId !== input.branchId) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_BRANCH_ACCESS_DENIED };
  }

  const referenceDate = sample.collectedAt ?? sample.receivedAt ?? new Date();
  const patient = orderTest.labOrder.patient;
  const patientAgeDays = patient
    ? resolvePatientAgeInDays({
        dateOfBirth: patient.dateOfBirth,
        estimatedAge: patient.estimatedAge,
        ageAsOfDate: patient.ageAsOfDate,
        referenceDate,
      })
    : null;

  const parameters = orderTest.tenantServiceId
    ? await tx.serviceParameter.findMany({
        where: {
          tenantId: input.tenantId,
          tenantServiceId: orderTest.tenantServiceId,
          isActive: true,
        },
        include: {
          referenceRanges: { where: { isActive: true }, orderBy: { priority: "desc" } },
        },
        orderBy: { displayOrder: "asc" },
      })
    : [];

  if (!parameters.length) {
    return { ok: false, errorCode: LAB_RESULT_ERROR_CODES.LAB_RESULT_PARAMETER_NOT_FOUND };
  }

  const created = await tx.labResult.create({
    data: {
      tenantId: input.tenantId,
      branchId: sample.branchId,
      labOrderId: orderTest.labOrderId,
      labOrderTestId: input.labOrderTestId,
      labSampleId: sample.id,
      status: "DRAFT",
      referenceDate,
      patientAgeDays,
      enteredById: input.userId,
      enteredAt: new Date(),
      items: {
        create: parameters.map((parameter) => {
          const rangeSelection = selectReferenceRange(parameter.referenceRanges, {
            patientGender: patient?.gender ?? null,
            ageInDays: patientAgeDays ?? 0,
            parameterUnit: parameter.unit,
          });
          const range = rangeSelection.ok ? rangeSelection.range : null;
          return {
            tenantId: input.tenantId,
            serviceParameterId: parameter.id,
            parameterCode: parameter.parameterCode,
            parameterName: parameter.parameterName,
            resultType: parameter.resultType,
            decimalPlaces: parameter.decimalPlaces,
            isRequired: parameter.isRequired,
            unitSnapshot: parameter.unit,
            referenceRangeSnapshot: range?.snapshot ?? null,
            lowerBoundSnapshot: decimalOrNull(range?.lowerBound),
            upperBoundSnapshot: decimalOrNull(range?.upperBound),
            criticalLowSnapshot: decimalOrNull(range?.criticalLow),
            criticalHighSnapshot: decimalOrNull(range?.criticalHigh),
            selectedReferenceRangeId: range?.id ?? null,
            displayOrder: parameter.displayOrder,
          };
        }),
      },
    },
  });

  await tx.labOrderTest.update({
    where: { id: input.labOrderTestId },
    data: { status: "RESULT_IN_PROGRESS" },
  });

  return { ok: true, labResultId: created.id, branchId: created.branchId, created: true };
}
