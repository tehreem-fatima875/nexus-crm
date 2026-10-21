import { connection, NextResponse } from "next/server";
import { ensureCrmIndexes, getAllCrmData } from "@/lib/crm-data";
import { getDatabase } from "@/lib/mongodb";
import { crmErrorResponse } from "@/lib/crm-http";

export async function GET() {
  await connection();
  try {
    const db = await getDatabase();
    await ensureCrmIndexes(db);
    return NextResponse.json(await getAllCrmData(db));
  } catch (error) {
    return crmErrorResponse(error);
  }
}
