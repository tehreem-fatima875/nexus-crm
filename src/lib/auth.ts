import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const sessionCookieName = "nexus-demo-session";
export const sessionDurationSeconds = 8 * 60 * 60;

export type DemoAuthConfig = {
  username: string;
  password: string;
  secret: string;
};

export function getDemoUsername() {
  return process.env.DEMO_USERNAME ?? (process.env.NODE_ENV !== "production" ? "demo" : "");
}

export function getDemoAuthConfig(): DemoAuthConfig {
  const development = process.env.NODE_ENV !== "production";
  const username = getDemoUsername();
  const password = process.env.DEMO_PASSWORD ?? (development ? "nexus-demo" : "");
  const secret = process.env.DEMO_AUTH_SECRET ?? (development ? "nexus-local-demo-only-session-key" : "");

  if (!username || !password || !secret) {
    throw new Error("Set DEMO_USERNAME, DEMO_PASSWORD, and DEMO_AUTH_SECRET before enabling authentication.");
  }
  if (process.env.NODE_ENV === "production" && (secret.length < 32 || password.length < 12)) {
    throw new Error("Production requires a 32-character session secret and a 12-character demo password.");
  }
  return { username, password, secret };
}

export function verifyDemoCredentials(username: unknown, password: unknown, config: DemoAuthConfig) {
  return matchesCredential(username, config.username) && matchesCredential(password, config.password);
}

function matchesCredential(provided: unknown, expected: string) {
  if (typeof provided !== "string") return false;
  const providedHash = createHash("sha256").update(provided).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

export function logoutCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "strict" as const,
    path: "/",
    maxAge: 0,
  };
}

function signature(timestamp: string, secret: string) {
  return createHmac("sha256", secret).update(timestamp).digest();
}

export function createSessionToken(secret: string, now = Date.now()) {
  const timestamp = String(now);
  return `${timestamp}.${signature(timestamp, secret).toString("base64url")}`;
}

export function verifySessionToken(token: string | undefined, secret: string, now = Date.now()) {
  if (!token) return false;
  const [timestamp, encodedSignature, extra] = token.split(".");
  if (!timestamp || !encodedSignature || extra !== undefined || !/^\d{13}$/.test(timestamp)) return false;
  const issuedAt = Number(timestamp);
  if (issuedAt > now + 60_000 || now - issuedAt > sessionDurationSeconds * 1000) return false;

  const suppliedSignature = Buffer.from(encodedSignature, "base64url");
  const expectedSignature = signature(timestamp, secret);
  return suppliedSignature.length === expectedSignature.length
    && timingSafeEqual(suppliedSignature, expectedSignature);
}

export function isPublicAuthPath(pathname: string) {
  return pathname === "/login" || pathname === "/api/auth/login" || pathname === "/api/auth/logout";
}
