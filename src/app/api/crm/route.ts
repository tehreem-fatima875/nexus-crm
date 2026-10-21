import { connection, NextResponse } from "next/server";
import { ensureCrmIndexes, getAllCrmData } from "@/lib/crm-data";
import { crmErrorResponse } from "@/lib/crm-http";
import { getDatabase } from "@/lib/mongodb";
import { getPublicDemoData } from "@/lib/public-demo";
import { isPublicDemoReadOnly } from "@/lib/public-demo-policy.mjs";

export async function GET() {
  await connection();
  if (isPublicDemoReadOnly()) {
    return NextResponse.json(getPublicDemoData(), {
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const db = await getDatabase();
    await ensureCrmIndexes(db);
    return NextResponse.json(await getAllCrmData(db));
  } catch (error) {
    return crmErrorResponse(error);
  }
}
