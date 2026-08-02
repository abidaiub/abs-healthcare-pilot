import { redirect } from "next/navigation";
import { PortalLoginForm } from "@/components/portal/PortalLoginForm";
import { getPortalSession } from "@/lib/portal/session";

export default async function PortalLoginPage() {
  const session = await getPortalSession();
  if (session) redirect("/portal/reports");

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <PortalLoginForm />
    </main>
  );
}
