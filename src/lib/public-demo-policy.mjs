export const publicDemoReadOnlyMessage = "The public demo is read-only. Changes are not saved.";
export const publicDemoMutationStatus = 403;

export function isPublicDemoReadOnly() {
  return process.env.NODE_ENV === "production";
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
