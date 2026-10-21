import { connection, NextResponse } from "next/server";
import { getAllCrmData } from "@/lib/crm-data";
import { crmErrorResponse } from "@/lib/crm-http";
import { getDatabase } from "@/lib/mongodb";

export async function GET() {
  await connection();
  try {
    const db = await getDatabase();
    return NextResponse.json(await getAllCrmData(db), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return crmErrorResponse(error);
  }
}
