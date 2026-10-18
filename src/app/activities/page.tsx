import { Suspense } from "react";
import { ActivitiesWorkspace } from "@/features/operations/operations-workspaces";
import { RouteFallback } from "@/components/shared/route-fallback";

async function ActivitiesContent({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  const params = await searchParams;
  return <ActivitiesWorkspace initialCreate={params.create === "1"} />;
}

export default function ActivitiesRoute({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  return <Suspense fallback={<RouteFallback />}><ActivitiesContent searchParams={searchParams} /></Suspense>;
}