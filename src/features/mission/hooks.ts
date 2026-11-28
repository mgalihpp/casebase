"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useMissionStart(courseId: string, nodeKey: string) {
  const trpc = useTRPC();
  return useQuery(
    trpc.mission.start.queryOptions({ courseId, nodeKey }, { retry: false }),
  );
}

export function useMissionCheck() {
  const trpc = useTRPC();
  return useMutation(trpc.mission.check.mutationOptions());
}

export function useMissionHint() {
  const trpc = useTRPC();
  return useMutation(trpc.mission.hint.mutationOptions());
}

// Peta perlu data terbaru setelah misi ditandai gagal (node jadi "ulangi").
export function useMissionFail() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.mission.fail.mutationOptions({
      onSettled: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.course.path.queryKey(),
        }),
    }),
  );
}
