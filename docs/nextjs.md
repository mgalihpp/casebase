# Next.js 16 (App Router)

Versi proyek: `next@16.4.6`. Sumber: Context7 `/vercel/next.js` (v16).

## Perubahan penting di Next.js 16

- **Middleware berganti nama menjadi Proxy.** Berkas `middleware.ts` menjadi `proxy.ts`, dan fungsi ekspornya bernama `proxy`. Migrasi otomatis: `npx @next/codemod@canary middleware-to-proxy .`
- **Cache Components** diaktifkan lewat `cacheComponents: true` di `next.config.ts`. Opsi lama `experimental.dynamicIO` dan `experimental.useCache` sudah pindah ke sini.
- Penggantian `fetch` dengan opsi cache lama ke `'use cache'`, `cacheLife`, dan `cacheTag` dari `next/cache`.

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

## Route Handler

Berkas `route.ts` di folder `app/` mengekspor fungsi HTTP. Metode yang didukung: `GET`, `HEAD`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`.

```ts
// app/api/example/route.ts
export async function GET(request: Request) {
  return Response.json({ ok: true })
}

export async function POST(request: Request) {
  const body = await request.json()
  return Response.json(body, { status: 201 })
}
```

Di proyek ini, route handler dipakai untuk `app/api/trpc/[trpc]/route.ts` dan `app/api/auth/[...all]/route.ts`.

## Cookies dan header di server

```ts
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')
  return new Response('ok', {
    headers: { 'Set-Cookie': `token=${token?.value ?? ''}` },
  })
}
```

`cookies()` dan `headers()` dari `next/headers` harus di-`await`.

## Proxy (pengganti middleware)

Proxy berjalan sebelum permintaan selesai. Gunakan untuk pengecekan sesi awal dan redirect. Jangan jadikan Proxy satu-satunya pertahanan. Cek otorisasi tetap harus dilakukan di server (tRPC procedure).

```ts
// proxy.ts
import { NextRequest, NextResponse } from 'next/server'

export default async function proxy(req: NextRequest) {
  const session = req.cookies.get('better-auth.session_token')
  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
```

## Catatan untuk proyek ini

- Ikuti `AGENTS.md`: baca panduan di `node_modules/next/dist/docs/` untuk versi terpasang sebelum menulis kode baru.
- Cache Components akan memunculkan galat build untuk data yang tidak dibungkus `<Suspense>`. Aktifkan hanya jika memang dibutuhkan.
