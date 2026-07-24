import type { MedicationCatalogStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { MEDICATION_ERROR_CODES } from "@/lib/medication/errors";
import { normalizeMedicationText } from "@/lib/medication/normalize";

export const medicationCatalogInclude = {
  generic: true,
  manufacturer: true,
  category: true,
  dosageForm: true,
  route: true,
  unit: true,
  ingredients: { include: { generic: true }, orderBy: { sequence: "asc" as const } },
  aliases: true,
  branchMappings: { include: { branch: { select: { id: true, code: true, name: true } } } },
} as const;

export async function assertTenantOwnsMedication(tenantId: string, medicationId: string) {
  const item = await prisma.medicationCatalogItem.findFirst({
    where: { id: medicationId, tenantId },
    include: medicationCatalogInclude,
  });
  if (!item) {
    throw new Error(MEDICATION_ERROR_CODES.MEDICATION_NOT_FOUND);
  }
  return item;
}

export async function listMedications(tenantId: string, filters?: {
  query?: string;
  status?: MedicationCatalogStatus;
  activeOnly?: boolean;
}) {
  const query = filters?.query?.trim();
  return prisma.medicationCatalogItem.findMany({
    where: {
      tenantId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.activeOnly ? { status: "ACTIVE", isActive: true } : {}),
      ...(query
        ? {
            OR: [
              { brandName: { contains: query, mode: "insensitive" } },
              { genericDisplayName: { contains: query, mode: "insensitive" } },
              { internalCode: { contains: query, mode: "insensitive" } },
              { barcode: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      generic: true,
      manufacturer: true,
      dosageForm: true,
      category: true,
      branchMappings: { include: { branch: { select: { code: true, name: true } } } },
    },
    orderBy: [{ brandName: "asc" }, { internalCode: "asc" }],
    take: 200,
  });
}

export async function searchPrescriptionMedications(
  tenantId: string,
  query: string,
  branchId?: string,
) {
  const term = query.trim();
  if (term.length < 2) return [];

  const items = await prisma.medicationCatalogItem.findMany({
    where: {
      tenantId,
      status: "ACTIVE",
      isActive: true,
      isPrescriptionEnabled: true,
      AND: [
        {
          OR: [
            { brandName: { contains: term, mode: "insensitive" } },
            { genericDisplayName: { contains: term, mode: "insensitive" } },
            { internalCode: { contains: term, mode: "insensitive" } },
            { barcode: { equals: term, mode: "insensitive" } },
            { generic: { genericName: { contains: term, mode: "insensitive" } } },
            { manufacturer: { name: { contains: term, mode: "insensitive" } } },
            { aliases: { some: { normalizedAlias: { contains: normalizeMedicationText(term) } } } },
            {
              ingredients: {
                some: { generic: { genericName: { contains: term, mode: "insensitive" } } },
              },
            },
          ],
        },
        ...(branchId
          ? [
              {
                OR: [
                  { branchMappings: { none: {} } },
                  { branchMappings: { some: { branchId, isAvailable: true } } },
                ],
              },
            ]
          : []),
      ],
    },
    include: {
      generic: true,
      manufacturer: true,
      dosageForm: true,
      route: true,
      ingredients: { include: { generic: true }, orderBy: { sequence: "asc" } },
    },
    take: 25,
    orderBy: { brandName: "asc" },
  });

  return items;
}

export function buildMedicationDisplayName(item: {
  brandName: string;
  genericDisplayName: string | null;
  displayStrength: string | null;
  dosageForm?: { shortName: string | null; displayName: string } | null;
}): string {
  const parts = [item.brandName];
  if (item.genericDisplayName) parts.push(`(${item.genericDisplayName})`);
  if (item.displayStrength) parts.push(item.displayStrength);
  if (item.dosageForm) parts.push(item.dosageForm.shortName ?? item.dosageForm.displayName);
  return parts.join(" ");
}

export async function medicationReferencedByPrescription(tenantId: string, medicationId: string) {
  const count = await prisma.prescriptionMedicine.count({
    where: { tenantId, medicationCatalogItemId: medicationId },
  });
  return count > 0;
}
