# Better Auth

Versi proyek: `better-auth@^1.7.28`. Sumber: Context7 `/better-auth/better-auth`.

## Konfigurasi server dengan Drizzle

```ts
// src/lib/auth.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from '@/server/db'
import * as schema from '@/server/db/auth-schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
})
```

Catatan: `drizzleAdapter` menerima `provider: 'pg' | 'mysql' | 'sqlite'`. Untuk PostgreSQL pakai `'pg'`.

## Route handler di Next.js

```ts
// src/app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
```

Pertahankan path `/api/auth/[...all]` agar konfigurasi default cocok.

## Membaca sesi di server

```ts
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const session = await auth.api.getSession({
  headers: await headers(),
})
```

Panggil ini di server component, route handler, atau procedure tRPC. Di tRPC, `headers` biasanya sudah tersedia di context.

## Skema database

Better Auth membutuhkan tabel untuk pengguna, sesi, akun, dan verifikasi.

```bash
npx auth@latest generate   # buat skema untuk Drizzle
npx auth@latest migrate    # terapkan langsung (hanya adapter Kysely bawaan)
```

Karena proyek memakai Drizzle, jalankan `generate`, lalu jalankan `drizzle-kit generate` dan `drizzle-kit migrate` (lihat [drizzle.md](drizzle.md)). Simpan hasilnya di `src/server/db/auth-schema.ts`, sesuai `ARCHITECTURE.md`.

## Google OAuth

Tambahkan `scope` jika perlu:

```ts
google: {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  scope: ['email', 'profile'],
}
```

Redirect URI di Google Cloud Console harus mengarah ke `/api/auth/callback/google` pada domain Vercel dan domain lokal.

## Plugin Next.js

Plugin `nextCookies` memastikan cookie yang diatur Better Auth ikut terkirim saat dipanggil dari server action atau server component. Lihat dokumentasi Better Auth untuk detail pemasangan.

## Catatan untuk proyek ini

- Verifikasi end-to-end belum dilakukan (lihat `ARCHITECTURE.md`). Setelah konfigurasi jalan, cek daftar, masuk, dan keluar.
- Akun dan sesi disimpan di PostgreSQL (D-09). Sesi memakai cookie HttpOnly.
- Lupa kata sandi dan hapus akun perlu layanan email dan konfirmasi terpisah (lihat `docs/BACKLOQ.md`).
