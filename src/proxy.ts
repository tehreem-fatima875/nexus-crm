import { NextRequest, NextResponse } from "next/server";
import { getDemoAuthConfig, isPublicAuthPath, sessionCookieName, verifySessionToken } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publicPath = isPublicAuthPath(pathname);

  let authenticated = false;
  try {
    const config = getDemoAuthConfig();
    authenticated = verifySessionToken(request.cookies.get(sessionCookieName)?.value, config.secret);
  } catch {
    authenticated = false;
  }

  if (publicPath) {
    if (pathname === "/login" && authenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }
  if (authenticated) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
