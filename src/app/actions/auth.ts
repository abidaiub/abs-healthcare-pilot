"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseSession, SESSION_COOKIE } from "@/lib/session";

export async function logoutAction() {
  const cookieStore = await cookies();
  const session = parseSession(cookieStore.get(SESSION_COOKIE)?.value);
  cookieStore.delete(SESSION_COOKIE);
  redirect(session?.loginKind === "host" ? "/host/login" : "/login");
}

export async function getTenantOptions() {
  return prisma.tenant.findMany({
    where: { isActive: true },
    include: {
      branches: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { tenantName: "asc" },
  });
}
