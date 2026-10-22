export const publicDemoReadOnlyMessage = "The public demo is read-only except for creating leads.";
export const publicDemoMutationStatus = 403;

export function isPublicDemoReadOnly() {
  return process.env.NODE_ENV === "production";
}

export function isPublicDemoMutationBlocked(collection) {
  return isPublicDemoReadOnly() && collection !== "leads";
}

const recordCollections = new Set([
  "leads",
  "contacts",
  "companies",
  "deals",
  "activities",
  "projects",
]);

export function isPublicDemoRecordCollection(value) {
  return recordCollections.has(value);
}
