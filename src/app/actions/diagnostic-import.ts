"use server";

import { prisma } from "@/lib/db";
import {
  HostServiceImportError,
  importHostServicesByCode,
  importHostServicesToTenant,
  type ImportHostServicesOutput,
} from "@/lib/diagnostic/host-service-import";
import { getSession, requireHostSession, requireTenantSession } from "@/lib/auth";
import { isHostSession } from "@/lib/session";

export type ImportHostServicesActionInput = {
  tenantId: string;
  hostServiceIds?: string[];
  serviceCodes?: string[];
  branchIds?: string[];
  assignAllBranches?: boolean;
};

async function assertImportAccess(requestedTenantId: string): Promise<string> {
  const session = await getSession();
  if (!session) {
    throw new HostServiceImportError("Authentication required.", "FORBIDDEN");
  }

  if (isHostSession(session)) {
    return requestedTenantId;
  }

  if (session.tenantId !== requestedTenantId) {
    throw new HostServiceImportError(
      "Tenant users may only import services for their own tenant.",
      "FORBIDDEN",
    );
  }

  return requestedTenantId;
}

export async function importHostServicesAction(
  input: ImportHostServicesActionInput,
): Promise<ImportHostServicesOutput> {
  const tenantId = await assertImportAccess(input.tenantId);
  const session = await getSession();
  const createdBy = session?.user.name;

  if (input.serviceCodes?.length) {
    return importHostServicesByCode(prisma, {
      tenantId,
      serviceCodes: input.serviceCodes,
      branchIds: input.branchIds,
      assignAllBranches: input.assignAllBranches ?? false,
      createdBy,
    });
  }

  if (!input.hostServiceIds?.length) {
    throw new HostServiceImportError(
      "Provide hostServiceIds or serviceCodes to import.",
      "HOST_SERVICE_NOT_FOUND",
    );
  }

  return importHostServicesToTenant(prisma, {
    tenantId,
    hostServiceIds: input.hostServiceIds,
    branchIds: input.branchIds,
    assignAllBranches: input.assignAllBranches ?? false,
    createdBy,
  });
}

/** Host admin — import host catalog services into any tenant. */
export async function hostImportHostServicesAction(
  input: ImportHostServicesActionInput,
): Promise<ImportHostServicesOutput> {
  await requireHostSession();
  return importHostServicesAction(input);
}

/** Tenant admin — import host catalog services into own tenant only. */
export async function tenantImportHostServicesAction(
  input: Omit<ImportHostServicesActionInput, "tenantId">,
): Promise<ImportHostServicesOutput> {
  const session = await requireTenantSession();
  return importHostServicesAction({
    ...input,
    tenantId: session.tenantId,
  });
}
