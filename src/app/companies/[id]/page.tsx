import { RecordDetailPage } from "@/features/records/record-detail";

export default async function CompanyDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RecordDetailPage kind="companies" id={id} />;
}