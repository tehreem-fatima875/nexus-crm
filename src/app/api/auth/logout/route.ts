import { NextResponse } from "next/server";
import { logoutCookieOptions, sessionCookieName } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(sessionCookieName, "", logoutCookieOptions(process.env.NODE_ENV === "production"));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
