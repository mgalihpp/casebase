"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
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
