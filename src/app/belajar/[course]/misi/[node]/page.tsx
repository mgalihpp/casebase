import { Suspense } from "react";
import { MissionScreen } from "@/features/mission/components/mission-screen";

export default function MisiPage({
  params,
}: PageProps<"/belajar/[course]/misi/[node]">) {
  return (
    <Suspense fallback={null}>
      <MissionRoute params={params} />
    </Suspense>
  );
}

async function MissionRoute({
  params,
}: {
  params: Promise<{ course: string; node: string }>;
}) {
  const { course, node } = await params;
  return <MissionScreen courseId={course} nodeKey={node} />;
}
