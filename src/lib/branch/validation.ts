import type { BranchType } from "@/generated/prisma/client";
import { BRANCH_TYPES } from "@/lib/branch/constants";

export type BranchFormInput = {
  code: string;
  name: string;
  branchType: BranchType;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  district: string | null;
  postalCode: string | null;
  countryCode: string | null;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  openingTime: string | null;
  closingTime: string | null;
  notes: string | null;
  isDefault: boolean;
};

function parseBranchType(value: string): BranchType | null {
  const normalized = value.trim().toUpperCase();
  return BRANCH_TYPES.includes(normalized as BranchType)
    ? (normalized as BranchType)
    : null;
}

export function parseBranchFormData(formData: FormData): BranchFormInput | { error: string } {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const branchTypeRaw = String(formData.get("branchType") ?? "OTHER").trim();
  const branchType = parseBranchType(branchTypeRaw);

  if (!code || !name) {
    return { error: "BRANCH_VALIDATION" };
  }

  if (!branchType) {
    return { error: "BRANCH_VALIDATION" };
  }

  const emailRaw = String(formData.get("email") ?? "").trim();
  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
    return { error: "BRANCH_VALIDATION" };
  }

  return {
    code,
    name,
    branchType,
    addressLine1: String(formData.get("addressLine1") ?? "").trim() || null,
    addressLine2: String(formData.get("addressLine2") ?? "").trim() || null,
    city: String(formData.get("city") ?? "").trim() || null,
    district: String(formData.get("district") ?? "").trim() || null,
    postalCode: String(formData.get("postalCode") ?? "").trim() || null,
    countryCode: String(formData.get("countryCode") ?? "").trim().toUpperCase() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: emailRaw || null,
    timezone: String(formData.get("timezone") ?? "").trim() || null,
    openingTime: String(formData.get("openingTime") ?? "").trim() || null,
    closingTime: String(formData.get("closingTime") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    isDefault: String(formData.get("isDefault") ?? "") === "true",
  };
}
