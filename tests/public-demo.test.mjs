import assert from "node:assert/strict";
import test from "node:test";
import {
  isPublicDemoReadOnly,
  isPublicDemoRecordCollection,
  publicDemoMutationStatus,
  publicDemoReadOnlyMessage,
} from "../src/lib/public-demo-policy.mjs";

test("enables the read-only fixture mode only in production", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    assert.equal(isPublicDemoReadOnly(), true);
    process.env.NODE_ENV = "development";
    assert.equal(isPublicDemoReadOnly(), false);
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});

test("public CRM endpoints allow only known record collection names", () => {
  for (const collection of ["leads", "contacts", "companies", "deals", "activities", "projects"]) {
    assert.equal(isPublicDemoRecordCollection(collection), true);
  }
  assert.equal(isPublicDemoRecordCollection("owners"), false);
  assert.equal(isPublicDemoRecordCollection("unknown"), false);
});

test("blocks public create, update, and delete operations", () => {
  assert.equal(publicDemoMutationStatus, 403);
  assert.match(publicDemoReadOnlyMessage, /read-only/i);
  assert.match(publicDemoReadOnlyMessage, /not saved/i);
});
