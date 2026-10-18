import { Suspense } from "react";
import { RecordWorkspace } from "@/features/records/record-workspace";
import { RouteFallback } from "@/components/shared/route-fallback";

async function CompaniesContent({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  const params = await searchParams;
  return <RecordWorkspace kind="companies" initialCreate={params.create === "1"} />;
}

export default function CompaniesRoute({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  return <Suspense fallback={<RouteFallback />}><CompaniesContent searchParams={searchParams} /></Suspense>;
}