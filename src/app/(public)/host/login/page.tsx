import { HostLoginForm } from "@/components/login/HostLoginForm";
import { getModuleBreadcrumb } from "@/lib/module-registry";

export default function HostLoginPage() {
  return (
    <>
      <div className="sr-only">{getModuleBreadcrumb("hostLogin")}</div>
      <HostLoginForm />
    </>
  );
}
