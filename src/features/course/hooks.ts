"use client";

import { useQuery } from "@tanstack/react-query";
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
