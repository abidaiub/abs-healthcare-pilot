export const dynamic = "force-dynamic";

import { TenantLoginForm } from "@/components/login/TenantLoginForm";
import { getModuleBreadcrumb } from "@/lib/module-registry";
import { listTenantOptions } from "@/lib/diagnostic/queries";

export default async function LoginPage() {
  const tenants = await listTenantOptions();

  return (
    <>
      <div className="sr-only">{getModuleBreadcrumb("tenantLogin")}</div>
      <TenantLoginForm tenants={tenants} />
    </>
  );
}
