import { Suspense } from "react";
import { ProjectsWorkspace } from "@/features/operations/operations-workspaces";
import { RouteFallback } from "@/components/shared/route-fallback";

async function ProjectsContent({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  const params = await searchParams;
  return <ProjectsWorkspace initialCreate={params.create === "1"} />;
}

export default function ProjectsRoute({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  return <Suspense fallback={<RouteFallback />}><ProjectsContent searchParams={searchParams} /></Suspense>;
}