import type {
  Activity,
  Company,
  Contact,
  Deal,
  Lead,
  Project,
  RecordCollection,
} from "@/types/crm";

export class CrmValidationError extends Error {}
export class CrmNotFoundError extends Error {}
export class CrmConflictError extends Error {}

export type CrmRecord = Lead | Contact | Company | Deal | Activity | Project;

const fields: Record<RecordCollection, string[]> = {
  leads: ["id", "name", "email", "phone", "companyId", "companyName", "service", "source", "status", "score", "ownerId", "createdAt", "budget", "requirements", "notes"],
  contacts: ["id", "name", "email", "phone", "role", "companyId", "source", "ownerId", "notes"],
  companies: ["id", "name", "industry", "website", "size", "ownerId", "client", "location", "notes"],
  deals: ["id", "title", "companyId", "contactId", "value", "currency", "stage", "ownerId", "closeDate", "service", "notes"],
  activities: ["id", "title", "type", "dueAt", "priority", "ownerId", "relatedType", "relatedId", "status", "notes"],
  projects: ["id", "name", "companyId", "dealId", "ownerId", "status", "priority", "startDate", "deadline", "deliverables"],
};

const idPattern = /^[A-Za-z0-9_-]{1,128}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertString(record: Record<string, unknown>, key: string, required = true) {
  const value = record[key];
  if (typeof value !== "string" || (required && value.trim() === "")) {
    throw new CrmValidationError(`${key} must be a non-empty string.`);
  }
}

function assertOneOf(record: Record<string, unknown>, key: string, options: readonly string[]) {
  if (typeof record[key] !== "string" || !options.includes(record[key] as string)) {
    throw new CrmValidationError(`${key} must be one of the supported values.`);
  }
}

function assertDate(record: Record<string, unknown>, key: string) {
  assertString(record, key);
  if (Number.isNaN(Date.parse(record[key] as string))) {
    throw new CrmValidationError(`${key} must be a valid date.`);
  }
}

function assertAllowedFields(collection: RecordCollection, record: Record<string, unknown>) {
  const allowed = new Set(fields[collection]);
  const unexpected = Object.keys(record).find((key) => !allowed.has(key));
  if (unexpected) {
    throw new CrmValidationError(`Unexpected field: ${unexpected}.`);
  }
}

export function validateId(id: string) {
  if (!idPattern.test(id)) {
    throw new CrmValidationError("Record id has an invalid format.");
  }
}

export function validateRecord(collection: RecordCollection, input: unknown): CrmRecord {
  if (!isObject(input)) {
    throw new CrmValidationError("Request body must be a JSON object.");
  }
  assertAllowedFields(collection, input);
  assertString(input, "id");
  validateId(input.id as string);

  switch (collection) {
    case "leads":
      for (const key of ["name", "phone", "service", "source", "ownerId", "createdAt", "budget", "requirements"]) {
        assertString(input, key, key !== "phone" && key !== "budget" && key !== "requirements");
      }
      assertString(input, "companyId", false);
      if (input.companyName !== undefined) assertString(input, "companyName");
      if (!(input.companyId as string).trim() && input.companyName === undefined) {
        throw new CrmValidationError("companyName must be provided when companyId is empty.");
      }
      assertString(input, "email");
      if (!emailPattern.test(input.email as string)) throw new CrmValidationError("email must be valid.");
      assertOneOf(input, "status", ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"]);
      if (typeof input.score !== "number" || !Number.isFinite(input.score) || input.score < 0 || input.score > 100) {
        throw new CrmValidationError("score must be a number from 0 to 100.");
      }
      if (!Array.isArray(input.notes) || input.notes.some((note) => typeof note !== "string")) {
        throw new CrmValidationError("notes must be an array of strings.");
      }
      return input as unknown as Lead;
    case "contacts":
      for (const key of ["name", "phone", "role", "companyId", "source", "ownerId", "notes"]) {
        assertString(input, key, key !== "phone" && key !== "notes");
      }
      assertString(input, "email");
      if (!emailPattern.test(input.email as string)) throw new CrmValidationError("email must be valid.");
      return input as unknown as Contact;
    case "companies":
      for (const key of ["name", "industry", "website", "size", "ownerId", "location", "notes"]) {
        assertString(input, key, key !== "website" && key !== "location" && key !== "notes");
      }
      if (typeof input.client !== "boolean") throw new CrmValidationError("client must be a boolean.");
      return input as unknown as Company;
    case "deals":
      for (const key of ["title", "companyId", "contactId", "ownerId", "service", "notes"]) assertString(input, key, key !== "notes");
      if (typeof input.value !== "number" || !Number.isFinite(input.value) || input.value < 0) {
        throw new CrmValidationError("value must be a non-negative number.");
      }
      assertString(input, "currency");
      if (!/^[A-Z]{3}$/.test(input.currency as string)) throw new CrmValidationError("currency must be a three-letter code.");
      assertOneOf(input, "stage", ["New Opportunity", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"]);
      assertDate(input, "closeDate");
      return input as unknown as Deal;
    case "activities":
      for (const key of ["title", "ownerId", "relatedId", "notes"]) assertString(input, key, key !== "notes");
      assertOneOf(input, "type", ["Task", "Call", "Meeting", "Note", "Follow-up"]);
      assertOneOf(input, "priority", ["Low", "Medium", "High"]);
      assertOneOf(input, "relatedType", ["Lead", "Contact", "Company", "Deal", "Project"]);
      assertOneOf(input, "status", ["Upcoming", "Completed", "Overdue"]);
      assertDate(input, "dueAt");
      return input as unknown as Activity;
    case "projects":
      for (const key of ["name", "companyId", "ownerId"]) assertString(input, key);
      assertString(input, "dealId", false);
      assertDate(input, "startDate");
      assertDate(input, "deadline");
      assertOneOf(input, "status", ["Planning", "In Progress", "Review", "Completed", "On Hold"]);
      assertOneOf(input, "priority", ["Low", "Medium", "High"]);
      if (!Array.isArray(input.deliverables) || input.deliverables.some((item) =>
        !isObject(item) || typeof item.id !== "string" || !idPattern.test(item.id)
        || typeof item.title !== "string" || item.title.trim() === "" || typeof item.done !== "boolean"
        || Object.keys(item).some((key) => !["id", "title", "done"].includes(key)))) {
        throw new CrmValidationError("deliverables must contain valid id, title, and done values.");
      }
      return input as unknown as Project;
  }
}

export function mergeAndValidateRecord(
  collection: RecordCollection,
  current: CrmRecord,
  patch: unknown,
): CrmRecord {
  if (!isObject(patch)) throw new CrmValidationError("Request body must be a JSON object.");
  if ("id" in patch || "_id" in patch) throw new CrmValidationError("Record ids cannot be changed.");
  assertAllowedFields(collection, patch);
  return validateRecord(collection, { ...current, ...patch });
}
