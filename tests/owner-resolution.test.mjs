import assert from "node:assert/strict";
import test from "node:test";
import { ownerIdByName } from "../src/lib/format.ts";

const data = {
  owners: [{ id: "owner-1", name: "Maya Chen" }],
};

test("resolves a typed owner name despite casing and surrounding whitespace", () => {
  assert.equal(ownerIdByName(data, "  maya chen "), "owner-1");
});

test("does not silently assign an unknown typed owner", () => {
  assert.equal(ownerIdByName(data, "Unknown Owner"), undefined);
});
