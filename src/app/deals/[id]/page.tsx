import { RecordDetailPage } from "@/features/records/record-detail";

export default async function DealDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RecordDetailPage kind="deals" id={id} />;
}