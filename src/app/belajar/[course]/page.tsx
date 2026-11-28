import { Suspense } from "react";
import { LearnScreen } from "@/features/course/components/learn-screen";

export default function BelajarPage({
  params,
}: PageProps<"/belajar/[course]">) {
  return (
    <Suspense fallback={null}>
      <CoursePage params={params} />
    </Suspense>
  );
}

async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const { course } = await params;
  return <LearnScreen courseId={course} />;
}
