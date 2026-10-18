import { Suspense } from "react";
import { DealsWorkspace } from "@/features/operations/operations-workspaces";
import { RouteFallback } from "@/components/shared/route-fallback";

async function DealsContent({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  const params = await searchParams;
  return <DealsWorkspace initialCreate={params.create === "1"} />;
}

export default function DealsRoute({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  return <Suspense fallback={<RouteFallback />}><DealsContent searchParams={searchParams} /></Suspense>;
}