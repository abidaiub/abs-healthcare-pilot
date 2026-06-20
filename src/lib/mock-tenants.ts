import {
  SAAS_TENANTS,
  type TenantStatus,
} from "@/lib/saas-foundation-data";

export type { TenantStatus };

/** Simplified tenant list for login forms and legacy imports */
export const MOCK_TENANTS = SAAS_TENANTS.map((tenant) => ({
  id: tenant.id,
  name: tenant.name,
  code: tenant.code,
  country: tenant.country,
  hospitals: tenant.hospitals,
  tenantStatus: tenant.tenantStatus as TenantStatus,
  branches: tenant.branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    code: branch.code,
    address: branch.address,
  })),
}));

export type MockTenant = (typeof MOCK_TENANTS)[number];
