import { NextResponse } from "next/server";
import {
  CrmConflictError,
  CrmNotFoundError,
  CrmValidationError,
} from "@/lib/crm-validation";

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new CrmValidationError("Request body must contain valid JSON.");
  }
}

export function crmErrorResponse(error: unknown) {
  if (error instanceof CrmValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof CrmNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof CrmConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  const errorType = error instanceof Error ? error.name : "Unknown error";
  console.error(`CRM API request failed (${errorType}).`);
  return NextResponse.json({ error: "CRM storage is unavailable. Check the server configuration." }, { status: 500 });
}
