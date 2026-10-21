import assert from "node:assert/strict";
import test from "node:test";
import { updatePassword } from "../scripts/reset-demo-password.mjs";
import {
  createSessionToken,
  getDemoAuthConfig,
  getDemoUsername,
  isPublicAuthPath,
  logoutCookieOptions,
  sessionDurationSeconds,
  verifyDemoCredentials,
  verifySessionToken,
} from "../src/lib/auth.ts";

test("accepts a correctly signed demo session and rejects a modified signature", () => {
  const now = 1_800_000_000_000;
  const token = createSessionToken("test-session-secret", now);
  assert.equal(verifySessionToken(token, "test-session-secret", now), true);
  assert.equal(verifySessionToken(token, "different-secret", now), false);
  assert.equal(verifySessionToken(`${token}x`, "test-session-secret", now), false);
});

test("expires demo sessions and rejects malformed or future-issued tokens", () => {
  const now = 1_800_000_000_000;
  const token = createSessionToken("test-session-secret", now);
  assert.equal(verifySessionToken(token, "test-session-secret", now + sessionDurationSeconds * 1000 + 1), false);
  assert.equal(verifySessionToken(createSessionToken("test-session-secret", now + 120_000), "test-session-secret", now), false);
  assert.equal(verifySessionToken("invalid", "test-session-secret", now), false);
});

test("only login and logout endpoints bypass the demo-session gate", () => {
  assert.equal(isPublicAuthPath("/login"), true);
  assert.equal(isPublicAuthPath("/api/auth/login"), true);
  assert.equal(isPublicAuthPath("/api/auth/logout"), true);
  assert.equal(isPublicAuthPath("/api/crm"), false);
  assert.equal(isPublicAuthPath("/dashboard"), false);
});

test("uses the configured username and defaults the local demo username consistently", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousUsername = process.env.DEMO_USERNAME;
  try {
    process.env.NODE_ENV = "development";
    delete process.env.DEMO_USERNAME;
    assert.equal(getDemoUsername(), "demo");
    assert.equal(getDemoAuthConfig().username, getDemoUsername());

    process.env.DEMO_USERNAME = "configured-demo";
    assert.equal(getDemoUsername(), "configured-demo");
    assert.equal(getDemoAuthConfig().username, getDemoUsername());
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousUsername === undefined) delete process.env.DEMO_USERNAME;
    else process.env.DEMO_USERNAME = previousUsername;
  }
});

test("accepts only exact configured demo credentials", () => {
  const config = { username: "demo-user", password: "a-local-test-password", secret: "test-secret" };
  assert.equal(verifyDemoCredentials("demo-user", "a-local-test-password", config), true);
  assert.equal(verifyDemoCredentials("demo-user ", "a-local-test-password", config), false);
  assert.equal(verifyDemoCredentials("demo-user", "wrong-password", config), false);
  assert.equal(verifyDemoCredentials(undefined, "a-local-test-password", config), false);
});

test("logout clears the session cookie with secure cookie attributes", () => {
  assert.deepEqual(logoutCookieOptions(false), {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  assert.equal(logoutCookieOptions(true).secure, true);
});

test("password reset updates only the password setting and safely quotes special characters", () => {
  const updated = updatePassword("MONGODB_URI=mongodb://example\nDEMO_PASSWORD=old-value\nOTHER_SETTING=kept\n", "new$pass=phrase");
  assert.match(updated, /^MONGODB_URI=mongodb:\/\/example$/m);
  assert.match(updated, /^DEMO_PASSWORD="new\\\$pass=phrase"$/m);
  assert.match(updated, /^OTHER_SETTING=kept$/m);
  assert.equal((updated.match(/^DEMO_PASSWORD=/gm) ?? []).length, 1);
});
