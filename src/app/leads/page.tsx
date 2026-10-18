import { Suspense } from "react";
import { RecordWorkspace } from "@/features/records/record-workspace";
import { RouteFallback } from "@/components/shared/route-fallback";

async function LeadsContent({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  const params = await searchParams;
  return <RecordWorkspace kind="leads" initialCreate={params.create === "1"} />;
}

export default function LeadsRoute({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  return <Suspense fallback={<RouteFallback />}><LeadsContent searchParams={searchParams} /></Suspense>;
}