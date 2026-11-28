"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useCoursePath(courseId: string) {
  const trpc = useTRPC();
  return useQuery(
    trpc.course.path.queryOptions({ courseId }, { retry: false }),
  );
}

export function useCourseList() {
  const trpc = useTRPC();
  return useQuery(trpc.course.list.queryOptions());
}

export function useOpenChest() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.mission.openChest.mutationOptions({
      onSettled: () =>
        Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.course.path.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.progress.streak.queryKey(),
          }),
        ]),
    }),
  );
}
