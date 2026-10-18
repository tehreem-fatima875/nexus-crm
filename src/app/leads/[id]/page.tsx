import { RecordDetailPage } from "@/features/records/record-detail";

export default async function LeadDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RecordDetailPage kind="leads" id={id} />;
}