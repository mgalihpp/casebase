# tRPC v11

Versi proyek: `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query` (`^11.32.0`). Sumber: Context7 `/trpc/trpc` (v11).

## Inisialisasi dan router

```ts
// src/server/trpc.ts
import { initTRPC } from '@trpc/server'

export const createTRPCContext = async (opts: { headers: Headers }) => {
  return { headers: opts.headers, user: null as null | { id: string } }
}
export type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create()

export const createTRPCRouter = t.router
export const baseProcedure = t.procedure
```

```ts
// src/server/routers/_app.ts
import { z } from 'zod'
import { baseProcedure, createTRPCRouter } from '../trpc'

export const appRouter = createTRPCRouter({
  hello: baseProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => ({ greeting: `hello ${input.text}` })),
})

export type AppRouter = typeof appRouter
```

## Route handler (App Router)

Di App Router, gunakan fetch adapter (`fetchRequestHandler`), bukan adapter khusus Next.js Pages Router.

```ts
// src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createTRPCContext } from '@/server/trpc'
import { appRouter } from '@/server/routers/_app'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
  })

export { handler as GET, handler as POST }
```

## Procedure yang butuh login

Pola ini dipakai untuk `protectedProcedure` di `src/server/trpc.ts`.

```ts
import { TRPCError } from '@trpc/server'

export const protectedProcedure = baseProcedure.use(async (opts) => {
  if (!opts.ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return opts.next({ ctx: { user: opts.ctx.user } })
})
```

Middleware berikutnya (misalnya cek peran admin) bisa dibangun di atas `protectedProcedure`. Middleware dijalankan berurutan, sehingga `ctx.user` sudah non-null di tahap berikutnya.

## Validasi input dengan Zod

Setiap procedure yang menerima data dari klien harus punya `.input(...)`.

```ts
createUser: baseProcedure
  .input(z.object({ name: z.string().min(3), bio: z.string().max(142).optional() }))
  .mutation(async ({ input }) => {
    // gunakan input yang sudah tervalidasi
    return input
  }),
```

Input yang tidak lolos validasi menghasilkan `BAD_REQUEST`, dengan `ZodError` sebagai `cause`.

## Format galat

Untuk menampilkan galat validasi Zod di klien, tambahkan `errorFormatter` di `initTRPC`.

```ts
import { ZodError } from 'zod'

const t = initTRPC.context<Context>().create({
  errorFormatter(opts) {
    const { shape, error } = opts
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    }
  },
})
```

Untuk keamanan, formatter juga bisa menyembunyikan pesan dari `INTERNAL_SERVER_ERROR` agar detail internal tidak bocor ke klien.

## Di sisi klien (TanStack Query)

```ts
// src/trpc/client.tsx (ringkas)
import { createTRPCContext } from '@trpc/tanstack-react-query'
import type { AppRouter } from '@/server/routers/_app'

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()
```

Pemakaian di komponen:

```tsx
const trpc = useTRPC()
const { data } = useQuery(trpc.hello.queryOptions({ text: 'world' }))
const mutation = useMutation(trpc.createUser.mutationOptions())
```

## Prefetch di Server Components

```ts
// src/trpc/server.tsx
import 'server-only'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { cache } from 'react'
import { makeQueryClient } from './query-client'
import { appRouter } from '@/server/routers/_app'
import { createTRPCContext } from '@/server/trpc'
import { headers } from 'next/headers'

export const getQueryClient = cache(makeQueryClient)

const createContext = async () => createTRPCContext({ headers: await headers() })

export const trpc = createTRPCOptionsProxy({
  ctx: createContext,
  router: appRouter,
  queryClient: getQueryClient,
})

export const caller = appRouter.createCaller(createContext)
```

`cache()` dari React memastikan satu QueryClient per request. `import 'server-only'` mencegah modul ini terimpor dari klien.

## Caching respons tRPC

Untuk query publik, atur header `cache-control` lewat `responseMeta` di `fetchRequestHandler`. Jangan atur lewat `next.config` karena header itu bisa ditimpa di produksi.

## Catatan untuk proyek ini

- Sesuai `ARCHITECTURE.md`, tRPC router per fitur digabung di `src/server/routers/_app.ts`.
- Penilaian ulang jawaban (D-07) dilakukan di mutation server, bukan di komponen.
