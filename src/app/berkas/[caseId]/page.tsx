import { connection } from "next/server";
import { Suspense } from "react";
import { BerkasDetailView } from "@/features/case-file/components/berkas-detail-view";

async function BerkasDetailContent({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  await connection();
  const { caseId } = await params;
  return <BerkasDetailView caseId={caseId} />;
}

export default function BerkasDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <BerkasDetailContent params={params} />
    </Suspense>
  );
}
