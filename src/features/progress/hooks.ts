"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useStreak() {
  const trpc = useTRPC();
  return useQuery(trpc.progress.streak.queryOptions());
}
