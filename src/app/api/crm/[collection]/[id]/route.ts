import { NextResponse } from "next/server";
import {
  deleteCrmRecord,
  ensureCrmIndexes,
  getCrmRecord,
  updateCrmRecord,
} from "@/lib/crm-data";
import { crmErrorResponse, readJsonBody } from "@/lib/crm-http";
import { getDatabase } from "@/lib/mongodb";
import { CrmValidationError } from "@/lib/crm-validation";
import { getPublicDemoRecord, isRecordCollection } from "@/lib/public-demo";
import {
  isPublicDemoReadOnly,
  publicDemoMutationStatus,
  publicDemoReadOnlyMessage,
} from "@/lib/public-demo-policy.mjs";

type RouteContext = { params: Promise<{ collection: string; id: string }> };

async function getRouteKeys(context: RouteContext) {
  const { collection, id } = await context.params;
  if (!isRecordCollection(collection)) throw new CrmValidationError("Unknown CRM collection.");
  return { collection, id };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const keys = await getRouteKeys(context);
    if (isPublicDemoReadOnly()) {
      const record = getPublicDemoRecord(keys.collection, keys.id);
      if (!record) return NextResponse.json({ error: "CRM record not found." }, { status: 404 });
      return NextResponse.json(record, { headers: { "Cache-Control": "no-store" } });
    }
    const db = await getDatabase();
    await ensureCrmIndexes(db);
    return NextResponse.json(await getCrmRecord(db, keys.collection, keys.id));
  } catch (error) {
    return crmErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (isPublicDemoReadOnly()) {
    return NextResponse.json({ error: publicDemoReadOnlyMessage }, { status: publicDemoMutationStatus });
  }
  try {
    const keys = await getRouteKeys(context);
    const db = await getDatabase();
    await ensureCrmIndexes(db);
    return NextResponse.json(await updateCrmRecord(db, keys.collection, keys.id, await readJsonBody(request)));
  } catch (error) {
    return crmErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (isPublicDemoReadOnly()) {
    return NextResponse.json({ error: publicDemoReadOnlyMessage }, { status: publicDemoMutationStatus });
  }
  try {
    const keys = await getRouteKeys(context);
    const db = await getDatabase();
    await ensureCrmIndexes(db);
    await deleteCrmRecord(db, keys.collection, keys.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return crmErrorResponse(error);
  }
}
