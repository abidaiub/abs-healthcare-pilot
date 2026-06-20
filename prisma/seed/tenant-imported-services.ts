import { importHostServicesByCode } from "../../src/lib/diagnostic/host-service-import";
import type { PrismaClient } from "../../src/generated/prisma/client";

const DEFAULT_IMPORT_CODES = ["CBC", "FBS", "LIPID", "XRCHEST", "ECG"];

export async function seedTenantImportedServices(
  prisma: PrismaClient,
  tenantId: string,
  branchId: string,
) {
  const existing = await prisma.tenantService.count({ where: { tenantId } });
  if (existing > 0) return;

  await importHostServicesByCode(prisma, {
    tenantId,
    serviceCodes: DEFAULT_IMPORT_CODES,
    branchIds: [branchId],
    createdBy: "seed",
  });
}
