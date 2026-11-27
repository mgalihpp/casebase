import "server-only";

import {
  createTRPCOptionsProxy,
  type TRPCQueryOptions,
  unstable_createHydrateClient,
} from "@trpc/tanstack-react-query";
import { headers } from "next/headers";
import { cache } from "react";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { makeQueryClient } from "./query-client";

export const getQueryClient = cache(makeQueryClient);

const createContext = async () =>
  createTRPCContext({ headers: await headers() });

export const trpc = createTRPCOptionsProxy({
  ctx: createContext,
  router: appRouter,
  queryClient: getQueryClient,
});

export const HydrateClient = unstable_createHydrateClient(getQueryClient);

export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient();
  if (queryOptions.queryKey[1]?.type === "infinite") {
    void queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void queryClient.prefetchQuery(queryOptions);
  }
}

export const caller = appRouter.createCaller(createContext);
