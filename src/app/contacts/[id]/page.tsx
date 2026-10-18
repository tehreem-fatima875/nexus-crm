import { RecordDetailPage } from "@/features/records/record-detail";

export default async function ContactDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RecordDetailPage kind="contacts" id={id} />;
}