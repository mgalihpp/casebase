import { Suspense } from "react";
import { connection } from "next/server";
import { ProfileView } from "@/features/profile/components/profile-view";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";

async function PrefetchedProfile() {
  await connection();
  void getQueryClient().prefetchQuery(trpc.profile.me.queryOptions());

  return (
    <HydrateClient>
      <ProfileView />
    </HydrateClient>
  );
}

export default function ProfilPage() {
  return (
    <Suspense fallback={null}>
      <PrefetchedProfile />
    </Suspense>
  );
}
