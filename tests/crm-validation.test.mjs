import assert from "node:assert/strict";
import test from "node:test";
import {
  CrmValidationError,
  mergeAndValidateRecord,
  resolveLeadCompanyReference,
  validateRecord,
} from "../src/lib/crm-validation.ts";

const lead = {
  id: "lead_1",
  name: "Avery Morgan",
  email: "avery@example.com",
  phone: "",
  companyId: "company_1",
  service: "Web design",
  source: "Referral",
  status: "New",
  score: 50,
  ownerId: "owner_1",
  createdAt: "2026-10-20",
  budget: "",
  requirements: "",
  notes: [],
};

test("accepts a valid CRM record", () => {
  assert.deepEqual(validateRecord("leads", lead), lead);
});

test("accepts a lead with a typed company name and no company record", () => {
  const typedCompanyLead = { ...lead, companyId: "", companyName: "  Northstar Labs  " };
  assert.deepEqual(validateRecord("leads", typedCompanyLead), typedCompanyLead);
});

test("keeps a typed company name when its client-side company reference is not persisted", () => {
  const formLead = {
    ...lead,
    companyId: "company_created_in_client_state",
    companyName: "Northstar Labs",
  };
  const validated = validateRecord("leads", formLead);

  assert.deepEqual(resolveLeadCompanyReference(validated, false), {
    ...formLead,
    companyId: "",
  });
  assert.deepEqual(resolveLeadCompanyReference(validated, true), formLead);
});

test("requires a typed company name when a lead has no company id", () => {
  assert.throws(
    () => validateRecord("leads", { ...lead, companyId: "", companyName: "  " }),
    CrmValidationError,
  );
  assert.throws(
    () => validateRecord("leads", { ...lead, companyId: "" }),
    CrmValidationError,
  );
  assert.throws(
    () => resolveLeadCompanyReference(lead, false),
    (error) => error instanceof CrmValidationError
      && error.message === "companyId does not reference an existing record.",
  );
});

test("accepts valid contact, company, deal, activity, and project records", () => {
  assert.equal(validateRecord("contacts", {
    id: "contact_1", name: "Avery Morgan", email: "avery@example.com", phone: "",
    role: "Director", companyId: "company_1", source: "Referral", ownerId: "owner_1", notes: "",
  }).id, "contact_1");
  assert.equal(validateRecord("companies", {
    id: "company_1", name: "Example Co", industry: "Software", website: "", size: "1-10",
    ownerId: "owner_1", client: false, location: "", notes: "",
  }).id, "company_1");
  assert.equal(validateRecord("deals", {
    id: "deal_1", title: "Website", companyId: "company_1", contactId: "contact_1", value: 1200,
    currency: "USD", stage: "Qualified", ownerId: "owner_1", closeDate: "2026-11-01",
    service: "Web design", notes: "",
  }).id, "deal_1");
  assert.equal(validateRecord("activities", {
    id: "activity_1", title: "Discovery call", type: "Call", dueAt: "2026-10-20T12:00:00",
    priority: "Medium", ownerId: "owner_1", relatedType: "Lead", relatedId: "lead_1",
    status: "Upcoming", notes: "",
  }).id, "activity_1");
  assert.equal(validateRecord("projects", {
    id: "project_1", name: "Website launch", companyId: "company_1", dealId: "deal_1",
    ownerId: "owner_1", status: "Planning", priority: "Medium", startDate: "2026-10-20",
    deadline: "2026-12-01", deliverables: [{ id: "milestone_1", title: "Kickoff", done: false }],
  }).id, "project_1");
});

test("rejects unknown fields rather than accepting mass-assigned data", () => {
  assert.throws(
    () => validateRecord("leads", { ...lead, admin: true }),
    CrmValidationError,
  );
});

test("reports a missing lead id before database access is needed", () => {
  assert.throws(
    () => validateRecord("leads", {}),
    (error) => error instanceof CrmValidationError && error.message === "id must be a non-empty string.",
  );
});

test("rejects invalid email, enum, id, and score values", () => {
  assert.throws(() => validateRecord("leads", { ...lead, email: "not-an-email" }), CrmValidationError);
  assert.throws(() => validateRecord("leads", { ...lead, status: "Archived" }), CrmValidationError);
  assert.throws(() => validateRecord("leads", { ...lead, id: "../other-record" }), CrmValidationError);
  assert.throws(() => validateRecord("leads", { ...lead, score: 101 }), CrmValidationError);
});

test("validates merged updates and prevents changing record ids", () => {
  assert.deepEqual(
    mergeAndValidateRecord("leads", lead, { status: "Qualified" }),
    { ...lead, status: "Qualified" },
  );
  assert.throws(
    () => mergeAndValidateRecord("leads", lead, { id: "replacement" }),
    CrmValidationError,
  );
  assert.throws(
    () => mergeAndValidateRecord("leads", lead, { status: "Unknown" }),
    CrmValidationError,
  );
});
