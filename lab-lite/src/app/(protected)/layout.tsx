import Link from "next/link";
import { requirePrincipal } from "../../lib/session";
import { logoutAction } from "../actions";
export const dynamic = "force-dynamic";
export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const p = await requirePrincipal(undefined, undefined, true);
  return <><header><strong>ABS Lab Lite</strong><Link href="/">Home</Link><Link href="/catalog">Catalog</Link><Link href="/directories">Directories</Link><Link href="/patients">Patients</Link><Link href="/billing">Billing</Link><Link href="/reports/collections">Collections report</Link><Link href="/settings">Settings</Link><Link href="/change-password">Password</Link><span>{p.displayName}</span><form action={logoutAction}><button>Sign out</button></form></header>{children}</>;
}
