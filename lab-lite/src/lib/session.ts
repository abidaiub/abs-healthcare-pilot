import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { assertPermission } from "./authorization";
import { resolveSession } from "../services/identity";

export const SESSION_COOKIE = "abs_lab_lite_session";

export async function currentPrincipal() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? resolveSession(token) : null;
}

export async function requirePrincipal(resource?: string, action?: string, allowPasswordChange = false) {
  const principal = await currentPrincipal();
  if (!principal) redirect("/login");
  if (principal.forcePasswordChange && !allowPasswordChange) redirect("/change-password");
  if (resource && action) assertPermission(principal, resource, action);
  return principal;
}

export async function principalFromRequest(request: Request) {
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const cookie = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.split("=").slice(1).join("=");
  const token = bearer ?? cookie;
  return token ? resolveSession(decodeURIComponent(token)) : null;
}

export async function authorizeRequest(request: Request, resource: string, action: string) {
  const principal = await principalFromRequest(request);
  if (!principal) {
    const error = new Error("Unauthenticated") as Error & { status?: number };
    error.status = 401;
    throw error;
  }
  if (principal.forcePasswordChange) {
    const error = new Error("Password change required") as Error & { status?: number };
    error.status = 403;
    throw error;
  }
  assertPermission(principal, resource, action);
  return principal;
}

export function errorResponse(error: unknown) {
  const status = typeof error === "object" && error && "status" in error ? Number((error as { status: number }).status) : 400;
  return Response.json({ error: error instanceof Error ? error.message : "Request failed" }, { status });
}
