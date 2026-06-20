import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { parseSession, SESSION_COOKIE } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/host/login", "/portal/reports"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isHostWorkspacePath(pathname: string): boolean {
  return pathname === "/host" || pathname.startsWith("/host/");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = parseSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    if (session?.loginKind === "host" && pathname === "/login") {
      return NextResponse.redirect(new URL("/host/dashboard", request.url));
    }

    if (session?.loginKind === "tenant" && pathname === "/host/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  if (!session) {
    const loginPath = isHostWorkspacePath(pathname) ? "/host/login" : "/login";
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  if (isHostWorkspacePath(pathname) && session.loginKind !== "host") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    !isHostWorkspacePath(pathname) &&
    !pathname.startsWith("/portal") &&
    session.loginKind === "host"
  ) {
    return NextResponse.redirect(new URL("/host/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
