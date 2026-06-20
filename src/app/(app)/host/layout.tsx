import { requireHostSession } from "@/lib/auth";

export default async function HostWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireHostSession();
  return children;
}
