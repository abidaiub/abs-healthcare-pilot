import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  isHostSession,
  isTenantSession,
  parseSession,
  SESSION_COOKIE,
  type SessionContext,
} from "@/lib/session";

export async function getSession(): Promise<SessionContext | null> {
  const cookieStore = await cookies();
  return parseSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function requireSession(): Promise<SessionContext> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireHostSession(): Promise<SessionContext> {
  const session = await getSession();
  if (!session) redirect("/host/login");
  if (!isHostSession(session)) redirect("/dashboard");
  return session;
}

export async function requireTenantSession(): Promise<SessionContext> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isTenantSession(session)) redirect("/host/dashboard");
  return session;
}
