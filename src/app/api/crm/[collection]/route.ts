import { NextResponse } from "next/server";
import {
  createCrmRecord,
  ensureCrmIndexes,
  getCrmRecords,
  isRecordCollection,
} from "@/lib/crm-data";
import { crmErrorResponse, readJsonBody } from "@/lib/crm-http";
import { getDatabase } from "@/lib/mongodb";
import { CrmValidationError, validateRecord } from "@/lib/crm-validation";

type RouteContext = { params: Promise<{ collection: string }> };

async function getCollectionName(context: RouteContext) {
  const { collection } = await context.params;
  if (!isRecordCollection(collection)) throw new CrmValidationError("Unknown CRM collection.");
  return collection;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const collection = await getCollectionName(context);
    const db = await getDatabase();
    await ensureCrmIndexes(db);
    return NextResponse.json(await getCrmRecords(db, collection));
  } catch (error) {
    return crmErrorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const collection = await getCollectionName(context);
    const input = await readJsonBody(request);
    validateRecord(collection, input);
    const db = await getDatabase();
    await ensureCrmIndexes(db);
    const record = await createCrmRecord(db, collection, input);
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return crmErrorResponse(error);
  }
}
