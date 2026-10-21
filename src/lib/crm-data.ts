import "server-only";

import type { Db, Document } from "mongodb";
import { owners } from "@/data/owners";
import type { Activity, Company, Contact, Deal, DemoData, Lead, Project, RecordCollection } from "@/types/crm";
import {
  CrmConflictError,
  CrmNotFoundError,
  CrmValidationError,
  mergeAndValidateRecord,
  validateId,
  validateRecord,
  type CrmRecord,
} from "@/lib/crm-validation";

export const recordCollections: RecordCollection[] = [
  "leads",
  "contacts",
  "companies",
  "deals",
  "activities",
  "projects",
];

const ownerIds = new Set(owners.map((owner) => owner.id));
const collectionIndexes: Record<RecordCollection, string[]> = {
  leads: ["ownerId", "companyId", "status", "source"],
  contacts: ["ownerId", "companyId"],
  companies: ["ownerId"],
  deals: ["ownerId", "companyId", "contactId", "stage"],
  activities: ["ownerId", "relatedId", "dueAt", "status"],
  projects: ["ownerId", "companyId", "dealId", "deadline", "status"],
};
let indexSetup: Promise<void> | null = null;

export function isRecordCollection(value: string): value is RecordCollection {
  return recordCollections.includes(value as RecordCollection);
}

export function ensureCrmIndexes(db: Db): Promise<void> {
  if (!indexSetup) {
    indexSetup = Promise.all(recordCollections.map(async (name) => {
      const collection = db.collection<Document>(name);
      await collection.createIndex({ id: 1 }, { unique: true });
      await Promise.all(collectionIndexes[name].map((field) => collection.createIndex({ [field]: 1 })));
    })).then(() => undefined).catch((error: unknown) => {
      indexSetup = null;
      throw error;
    });
  }
  return indexSetup;
}

function cleanDocument<T>(document: Document): T {
  const record = { ...document };
  delete record._id;
  return record as T;
}

export async function getAllCrmData(db: Db): Promise<DemoData> {
  const rows = await Promise.all(recordCollections.map((name) =>
    db.collection<Document>(name).find({}, { projection: { _id: 0 } }).toArray()));
  const records = Object.fromEntries(recordCollections.map((name, index) => [
    name,
    rows[index].map((document) => cleanDocument<CrmRecord>(document)),
  ])) as Pick<DemoData, RecordCollection>;

  return {
    ...records,
    owners,
  };
}

export async function getCrmRecords(db: Db, collection: RecordCollection): Promise<CrmRecord[]> {
  const documents = await db.collection<Document>(collection)
    .find({}, { projection: { _id: 0 } })
    .toArray();
  return documents.map((document) => cleanDocument<CrmRecord>(document));
}

async function assertReference(db: Db, collection: string, id: string, label: string) {
  if (!id) return;
  if (collection === "owners") {
    if (!ownerIds.has(id)) throw new CrmValidationError(`${label} is not a known workspace owner.`);
    return;
  }
  const record = await db.collection(collection).findOne({ id }, { projection: { _id: 1 } });
  if (!record) throw new CrmValidationError(`${label} does not reference an existing record.`);
}

export async function assertCrmReferences(db: Db, collection: RecordCollection, record: CrmRecord) {
  switch (collection) {
    case "leads": {
      const lead = record as Lead;
      await Promise.all([
        assertReference(db, "companies", lead.companyId, "companyId"),
        assertReference(db, "owners", lead.ownerId, "ownerId"),
      ]);
      return;
    }
    case "contacts": {
      const contact = record as Contact;
      await Promise.all([
        assertReference(db, "companies", contact.companyId, "companyId"),
        assertReference(db, "owners", contact.ownerId, "ownerId"),
      ]);
      return;
    }
    case "companies":
      await assertReference(db, "owners", (record as Company).ownerId, "ownerId");
      return;
    case "deals": {
      const dealRecord = record as Deal;
      const [company, contact] = await Promise.all([
        db.collection("companies").findOne({ id: dealRecord.companyId }, { projection: { _id: 1 } }),
        db.collection("contacts").findOne({ id: dealRecord.contactId }, { projection: { _id: 1 } }),
      ]);
      if (!company) throw new CrmValidationError("companyId does not reference an existing company.");
      if (!contact) throw new CrmValidationError("contactId does not reference an existing contact.");
      await assertReference(db, "owners", dealRecord.ownerId, "ownerId");
      return;
    }
    case "activities": {
      const activity = record as Activity;
      const relatedCollection: Record<Activity["relatedType"], RecordCollection> = {
        Lead: "leads",
        Contact: "contacts",
        Company: "companies",
        Deal: "deals",
        Project: "projects",
      };
      await Promise.all([
        assertReference(db, relatedCollection[activity.relatedType], activity.relatedId, "relatedId"),
        assertReference(db, "owners", activity.ownerId, "ownerId"),
      ]);
      return;
    }
    case "projects": {
      const project = record as Project;
      await Promise.all([
        assertReference(db, "companies", project.companyId, "companyId"),
        assertReference(db, "owners", project.ownerId, "ownerId"),
      ]);
      if (project.dealId) {
        const deal = await db.collection("deals").findOne({ id: project.dealId }, { projection: { _id: 1 } });
        if (!deal) throw new CrmValidationError("dealId does not reference an existing deal.");
      }
    }
  }
}

export async function getCrmRecord(db: Db, collection: RecordCollection, id: string): Promise<CrmRecord> {
  validateId(id);
  const document = await db.collection<Document>(collection).findOne(
    { id },
    { projection: { _id: 0 } },
  );
  if (!document) throw new CrmNotFoundError("Record not found.");
  return cleanDocument<CrmRecord>(document);
}

export async function createCrmRecord(db: Db, collection: RecordCollection, input: unknown): Promise<CrmRecord> {
  const record = validateRecord(collection, input);
  const records = db.collection<Document>(collection);
  const matches = (document: Document | null) => {
    if (!document) return false;
    const existing = cleanDocument<Record<string, unknown>>(document);
    const candidate = record as unknown as Record<string, unknown>;
    return Object.keys(candidate).length === Object.keys(existing).length
      && Object.keys(candidate).every((key) => JSON.stringify(candidate[key]) === JSON.stringify(existing[key]));
  };
  const existing = await records.findOne({ id: record.id });
  if (existing) {
    if (matches(existing)) return record;
    throw new CrmConflictError("A record with this id already exists.");
  }
  await assertCrmReferences(db, collection, record);
  try {
    await records.insertOne(record);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      if (matches(await records.findOne({ id: record.id }))) return record;
      throw new CrmConflictError("A record with this id already exists.");
    }
    throw error;
  }
  return record;
}

export async function updateCrmRecord(
  db: Db,
  collection: RecordCollection,
  id: string,
  patch: unknown,
): Promise<CrmRecord> {
  validateId(id);
  const current = await getCrmRecord(db, collection, id);
  const updated = mergeAndValidateRecord(collection, current, patch);
  await assertCrmReferences(db, collection, updated);
  await db.collection<Document>(collection).updateOne({ id }, { $set: updated });
  return updated;
}

async function hasReferences(db: Db, collection: RecordCollection, id: string) {
  const checks: Promise<Document | null>[] = [];
  const findReference = (name: RecordCollection, field: string) =>
    db.collection<Document>(name).findOne({ [field]: id }, { projection: { _id: 1 } });

  if (collection === "companies") {
    checks.push(findReference("leads", "companyId"), findReference("contacts", "companyId"),
      findReference("deals", "companyId"), findReference("projects", "companyId"));
  } else if (collection === "contacts") {
    checks.push(findReference("deals", "contactId"));
  } else if (collection === "deals") {
    checks.push(findReference("projects", "dealId"));
  }

  const relatedType: Partial<Record<RecordCollection, string>> = {
    leads: "Lead",
    contacts: "Contact",
    companies: "Company",
    deals: "Deal",
    projects: "Project",
  };
  if (relatedType[collection]) {
    checks.push(db.collection<Document>("activities").findOne(
      { relatedType: relatedType[collection], relatedId: id },
      { projection: { _id: 1 } },
    ));
  }

  return (await Promise.all(checks)).some(Boolean);
}

export async function deleteCrmRecord(db: Db, collection: RecordCollection, id: string) {
  validateId(id);
  await getCrmRecord(db, collection, id);
  if (await hasReferences(db, collection, id)) {
    throw new CrmConflictError("This record is linked to other CRM records and cannot be deleted.");
  }
  const result = await db.collection<Document>(collection).deleteOne({ id });
  if (!result.deletedCount) throw new CrmNotFoundError("Record not found.");
}
