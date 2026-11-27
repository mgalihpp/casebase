# TanStack Query v5 (React)

Versi proyek: `@tanstack/react-query@^5.108.4`. Sumber: Context7 `/tanstack/query` (v5).

## Setup QueryClient di Next.js App Router

`QueryClient` dibuat per request di server dan dipakai ulang di browser. Dengan begitu cache tidak dibagi antarpengguna.

```tsx
// src/app/providers.tsx
'use client'

import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (isServer) return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

Hindari membuat `QueryClient` di level modul yang dipakai server. Cache akan bocor antarpengguna.

## Query dan mutation

```tsx
const query = useQuery({ queryKey: ['todos'], queryFn: getTodos })

const queryClient = useQueryClient()
const mutation = useMutation({
  mutationFn: postTodo,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

Return Promise dari `invalidateQueries` di dalam `onSuccess` atau `onSettled`. Dengan begitu status `isPending` mutation tetap true sampai data terbaru selesai dimuat.

## Optimistic update

```tsx
const addTodoMutation = useMutation({
  mutationFn: (newTodo: string) => axios.post('/api/data', { text: newTodo }),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})
```

## Dengan tRPC

Integrasi lewat `@trpc/tanstack-react-query` memakai `queryOptions` dan `mutationOptions` dari proxy tRPC. Lihat [trpc.md](trpc.md).

## Prefetch dan hydration di Server Components

Prefetch di server, lalu kirim cache ke klien dengan `HydrateClient` (dari `@trpc/tanstack-react-query`) atau `dehydrate`. Untuk streaming, `ReactQueryStreamedHydration` dari `@tanstack/react-query-next-experimental` juga tersedia.
