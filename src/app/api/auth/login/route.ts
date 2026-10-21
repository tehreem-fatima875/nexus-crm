import { NextResponse } from "next/server";
import {
  createSessionToken,
  getDemoAuthConfig,
  sessionCookieName,
  sessionDurationSeconds,
  verifyDemoCredentials,
} from "@/lib/auth";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const requestHost = request.headers.get("host");
  if (origin) {
    try {
      if (!requestHost || new URL(origin).host !== requestHost) {
        return NextResponse.json({ error: "Cross-origin sign-in is not allowed." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid sign-in origin." }, { status: 403 });
    }
  }

  let config: ReturnType<typeof getDemoAuthConfig>;
  try {
    config = getDemoAuthConfig();
  } catch {
    return NextResponse.json({ error: "Demo authentication is not configured on the server." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter a username and password." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Enter a username and password." }, { status: 400 });
  }
  const credentials = body as Record<string, unknown>;
  if (!verifyDemoCredentials(credentials.username, credentials.password, config)) {
    return NextResponse.json({ error: "The username or password is incorrect." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(sessionCookieName, createSessionToken(config.secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: sessionDurationSeconds,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
