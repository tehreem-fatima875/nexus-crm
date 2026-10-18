import { Suspense } from "react";
import { RecordWorkspace } from "@/features/records/record-workspace";
import { RouteFallback } from "@/components/shared/route-fallback";

async function ContactsContent({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  const params = await searchParams;
  return <RecordWorkspace kind="contacts" initialCreate={params.create === "1"} />;
}

export default function ContactsRoute({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  return <Suspense fallback={<RouteFallback />}><ContactsContent searchParams={searchParams} /></Suspense>;
}