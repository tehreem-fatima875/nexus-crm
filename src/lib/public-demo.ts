import { initialDemoData } from "@/data/demo-data";
import type { DemoData, RecordCollection } from "@/types/crm";
import { isPublicDemoRecordCollection } from "./public-demo-policy.mjs";

export function getPublicDemoData(): DemoData {
  return structuredClone(initialDemoData);
}

export function isRecordCollection(value: string): value is RecordCollection {
  return isPublicDemoRecordCollection(value);
}

export function getPublicDemoRecords(collection: RecordCollection) {
  return getPublicDemoData()[collection];
}

export function getPublicDemoRecord(collection: RecordCollection, id: string) {
  return getPublicDemoRecords(collection).find((record) => record.id === id);
}
