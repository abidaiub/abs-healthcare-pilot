import { randomBytes } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { calculateAgeInDays } from "@/lib/laboratory-result/age";
import { verificationReviewInclude } from "@/lib/laboratory-verification/queries";

export type LabReportSnapshot = {
  schemaVersion: 1;
  reportNumber: string;
  versionNumber: number;
  resultVersion: number;
  isAmended: boolean;
  amendmentReason?: string | null;
  tenant: {
    name: string;
    logoUrl?: string | null;
    reportHeaderLogoUrl?: string | null;
  };
  branch: {
    code: string;
    name: string;
    address?: string | null;
    city?: string | null;
  };
  patient: {
    patientNumber: string;
    fullName: string;
    gender: string;
    dateOfBirth?: string | null;
    ageDisplay: string;
  };
  order: {
    orderNumber: string;
    orderedAt: string;
    doctorName?: string | null;
    clinicalNote?: string | null;
  };
  sample: {
    accessionNumber: string;
    collectedAt?: string | null;
    receivedAt?: string | null;
    sampleType?: string | null;
    container?: string | null;
  };
  test: {
    testName: string;
    testCode?: string | null;
    departmentName?: string | null;
  };
  results: Array<{
    parameterCode: string;
    parameterName: string;
    valueDisplay: string;
    unit?: string | null;
    referenceRange?: string | null;
    abnormalFlag: string;
    isCritical: boolean;
    technicianComment?: string | null;
  }>;
  reportNote?: string | null;
  verifier: {
    displayName: string;
    designation?: string | null;
    registrationNumber?: string | null;
    verifiedAt: string;
    verificationComment?: string | null;
  };
  releasedAt?: string | null;
};

export type ReleaseResultPayload = Prisma.LabResultGetPayload<{
  include: typeof verificationReviewInclude;
}>;

function formatAgeDisplay(dateOfBirth: Date | null | undefined, referenceDate: Date | null | undefined): string {
  if (!dateOfBirth) return "—";
  const ageDays = calculateAgeInDays(dateOfBirth, referenceDate ?? new Date());
  if (ageDays == null) return "—";
  const years = Math.floor(ageDays / 365.25);
  if (years >= 1) return `${years} y`;
  const months = Math.floor(ageDays / 30.4375);
  if (months >= 1) return `${months} mo`;
  return `${ageDays} d`;
}

function formatResultValue(item: ReleaseResultPayload["items"][number]): string {
  if (item.numericValue != null) {
    return Number(item.numericValue).toFixed(item.decimalPlaces ?? 2);
  }
  if (item.textValue) return item.textValue;
  if (item.choiceValue) return item.choiceValue;
  if (item.booleanValue != null) return item.booleanValue ? "Yes" : "No";
  return "—";
}

export function buildReportSnapshot(input: {
  result: ReleaseResultPayload;
  tenant: {
    tenantName: string;
    logoUrl?: string | null;
    reportHeaderLogoUrl?: string | null;
  };
  reportNumber: string;
  versionNumber: number;
  amendmentReason?: string | null;
  releasedAt?: Date | null;
}): LabReportSnapshot {
  const latestVerification = input.result.verifications.find((entry) => entry.decision === "VERIFIED");
  if (!latestVerification?.verifiedAt) {
    throw new Error("Verified snapshot requires successful verification");
  }

  return {
    schemaVersion: 1,
    reportNumber: input.reportNumber,
    versionNumber: input.versionNumber,
    resultVersion: input.result.recordVersion,
    isAmended: input.versionNumber > 1,
    amendmentReason: input.amendmentReason ?? null,
    tenant: {
      name: input.tenant.tenantName,
      logoUrl: input.tenant.logoUrl,
      reportHeaderLogoUrl: input.tenant.reportHeaderLogoUrl,
    },
    branch: {
      code: input.result.labOrder.branch.code,
      name: input.result.labOrder.branch.name,
    },
    patient: {
      patientNumber: input.result.labOrder.patient.patientNumber,
      fullName: input.result.labOrder.patient.fullName,
      gender: input.result.labOrder.patient.gender,
      dateOfBirth: input.result.labOrder.patient.dateOfBirth?.toISOString() ?? null,
      ageDisplay: formatAgeDisplay(
        input.result.labOrder.patient.dateOfBirth,
        input.result.referenceDate,
      ),
    },
    order: {
      orderNumber: input.result.labOrder.orderNumber,
      orderedAt: input.result.labOrder.orderedAt.toISOString(),
      doctorName: input.result.labOrder.doctor?.doctorName ?? null,
      clinicalNote: input.result.labOrder.clinicalNote,
    },
    sample: {
      accessionNumber: input.result.labSample.accessionNumber,
      collectedAt: input.result.labSample.collectedAt?.toISOString() ?? null,
      receivedAt: input.result.labSample.receivedAt?.toISOString() ?? null,
      sampleType: input.result.labSample.sampleType?.sampleType ?? null,
      container: input.result.labSample.sampleContainer?.containerType ?? null,
    },
    test: {
      testName: input.result.labOrderTest.testName,
      testCode: input.result.labOrderTest.testCode,
      departmentName: input.result.labOrderTest.department?.name ?? null,
    },
    results: input.result.items.map((item) => ({
      parameterCode: item.parameterCode,
      parameterName: item.parameterName,
      valueDisplay: formatResultValue(item),
      unit: item.unitSnapshot,
      referenceRange: item.referenceRangeSnapshot,
      abnormalFlag: item.abnormalFlag,
      isCritical: item.isCritical,
      technicianComment: item.technicianComment,
    })),
    reportNote: input.result.reportNote,
    verifier: {
      displayName: latestVerification.verifierDisplayNameSnapshot,
      designation: latestVerification.verifierDesignationSnapshot,
      registrationNumber: latestVerification.verifierRegistrationNumberSnapshot,
      verifiedAt: latestVerification.verifiedAt.toISOString(),
      verificationComment: latestVerification.verificationComment,
    },
    releasedAt: input.releasedAt?.toISOString() ?? null,
  };
}

export function parseReportSnapshot(raw: string): LabReportSnapshot {
  return JSON.parse(raw) as LabReportSnapshot;
}

export function serializeReportSnapshot(snapshot: LabReportSnapshot): string {
  return JSON.stringify(snapshot);
}

export function generateVerificationTokenValue(): string {
  return randomBytes(24).toString("hex");
}
