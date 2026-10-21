import { NextResponse } from "next/server";
import { createCrmRecord, ensureCrmIndexes, getCrmRecords } from "@/lib/crm-data";
import { crmErrorResponse, readJsonBody } from "@/lib/crm-http";
import { getDatabase } from "@/lib/mongodb";
import { CrmValidationError, validateRecord } from "@/lib/crm-validation";
import { getPublicDemoRecords, isRecordCollection } from "@/lib/public-demo";
import {
  isPublicDemoReadOnly,
  publicDemoMutationStatus,
  publicDemoReadOnlyMessage,
} from "@/lib/public-demo-policy.mjs";

type RouteContext = { params: Promise<{ collection: string }> };

async function getCollectionName(context: RouteContext) {
  const { collection } = await context.params;
  if (!isRecordCollection(collection)) throw new CrmValidationError("Unknown CRM collection.");
  return collection;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const collection = await getCollectionName(context);
    if (isPublicDemoReadOnly()) {
      return NextResponse.json(getPublicDemoRecords(collection), {
        headers: { "Cache-Control": "no-store" },
      });
    }
    const db = await getDatabase();
    await ensureCrmIndexes(db);
    return NextResponse.json(await getCrmRecords(db, collection));
  } catch (error) {
    return crmErrorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  if (isPublicDemoReadOnly()) {
    return NextResponse.json({ error: publicDemoReadOnlyMessage }, { status: publicDemoMutationStatus });
  }
  try {
    const collection = await getCollectionName(context);
    const input = await readJsonBody(request);
    validateRecord(collection, input);
    const db = await getDatabase();
    await ensureCrmIndexes(db);
    return NextResponse.json(await createCrmRecord(db, collection, input), { status: 201 });
  } catch (error) {
    return crmErrorResponse(error);
  }
}
