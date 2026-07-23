import type { BranchType } from "@/generated/prisma/client";

export const CURRENT_BRANCH_COOKIE = "abs-pilot-current-branch";

export const BRANCH_TYPES: BranchType[] = [
  "HEAD_OFFICE",
  "HOSPITAL",
  "CLINIC",
  "DIAGNOSTIC_CENTER",
  "COLLECTION_CENTER",
  "PHARMACY",
  "CORPORATE_OFFICE",
  "OTHER",
];

export const BRANCH_TYPE_I18N_KEYS: Record<BranchType, string> = {
  HEAD_OFFICE: "branch.types.headOffice",
  HOSPITAL: "branch.types.hospital",
  CLINIC: "branch.types.clinic",
  DIAGNOSTIC_CENTER: "branch.types.diagnosticCenter",
  COLLECTION_CENTER: "branch.types.collectionCenter",
  PHARMACY: "branch.types.pharmacy",
  CORPORATE_OFFICE: "branch.types.corporateOffice",
  OTHER: "branch.types.other",
};
