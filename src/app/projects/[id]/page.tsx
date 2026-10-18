import { RecordDetailPage } from "@/features/records/record-detail";

export default async function ProjectDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RecordDetailPage kind="projects" id={id} />;
}