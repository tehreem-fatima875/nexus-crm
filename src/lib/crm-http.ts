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

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "A non-Error value was thrown.";
  return message
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, "mongodb://[REDACTED]")
    .replace(/\b(password|passwd|pwd|token|secret|api[_-]?key)\s*[:=]\s*([^\s,&;]+)/gi, "$1=[REDACTED]")
    .replace(/dup key:\s*\{[^}]*\}/gi, "dup key: [REDACTED]")
    .slice(0, 500);
}

export function crmErrorResponse(error: unknown) {
  const errorType = error instanceof Error ? error.name : "Unknown error";
  const errorMessage = safeErrorMessage(error);
  const errorCode = error && typeof error === "object" && "code" in error
    && (typeof error.code === "number" || typeof error.code === "string")
    ? String(error.code).slice(0, 32)
    : undefined;

  if (error instanceof CrmValidationError) {
    console.warn(`CRM API validation failed (${errorType}): ${errorMessage}`);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof CrmNotFoundError) {
    console.warn(`CRM API record not found (${errorType}): ${errorMessage}`);
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof CrmConflictError) {
    console.warn(`CRM API conflict (${errorType}): ${errorMessage}`);
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  console.error(
    `CRM API request failed (${errorType}${errorCode === undefined ? "" : `, code ${errorCode}`}): ${errorMessage}`,
  );

  const message = errorCode === "13"
    ? "MongoDB denied this CRM operation. Check the database user's required access to nexus_crm."
    : errorType === "MongoServerSelectionError" || errorType === "MongoNetworkTimeoutError"
      ? "Unable to connect to MongoDB. Check MONGODB_URI and Atlas network access."
      : "CRM storage is unavailable. Check the server configuration.";
  return NextResponse.json({ error: message }, { status: 500 });
}
