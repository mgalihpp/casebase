# Drizzle ORM dan drizzle-kit (PostgreSQL)

Versi proyek: `drizzle-orm@^0.45.4` dan `drizzle-kit@^0.31.11`. Driver: `pg@^8.23.1`. Sumber: Context7 `/drizzle-team/drizzle-orm-docs`.

## Koneksi dengan node-postgres

```ts
// src/server/db/index.ts
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
export const db = drizzle({ client: pool })
```

Gunakan `Pool` sendiri jika butuh kontrol atas koneksi. Pada deploy serverless (Vercel), atur ukuran pool kecil dan pastikan koneksi ditutup dengan benar.

## Definisi tabel

```ts
// src/server/db/schema.ts
import { pgTable, text, integer, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const users = pgTable(
  'users',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    email: varchar({ length: 256 }).notNull(),
    name: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('email_idx').on(t.email)],
)
```

Foreign key:

```ts
ownerId: integer('owner_id').notNull().references(() => users.id),
```

Untuk relasi yang merujuk ke dirinya sendiri, gunakan `(): AnyPgColumn => users.id`.

## Query dasar

```ts
import { eq, and, desc } from 'drizzle-orm'

const rows = await db.select().from(users).where(eq(users.email, email))

await db.insert(users).values({ email, name })

await db
  .update(users)
  .set({ name: 'baru' })
  .where(eq(users.id, 1))

await db.delete(users).where(eq(users.id, 1))
```

Relational query builder (`db.query.users.findMany({ with: { ... } })`) memerlukan objek skema diteruskan ke `drizzle()`.

## Transaksi

```ts
await db.transaction(async (tx) => {
  await tx.insert(users).values({ email: 'a@b.c' })
  await tx.insert(users).values({ email: 'd@e.f' })
})
```

## drizzle-kit: generate dan migrate

Konfigurasi:

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

Alur kerja:

```bash
npx drizzle-kit generate   # buat berkas SQL dari perubahan skema TypeScript
npx drizzle-kit migrate    # terapkan migrasi yang belum dijalankan ke database
```

`generate` membaca folder migrasi sebelumnya, mencari selisih dengan skema saat ini, lalu menulis berkas `migration.sql` dan `snapshot.json`. `migrate` hanya menjalankan migrasi yang belum tercatat di database.

## Catatan untuk proyek ini

- `ARCHITECTURE.md` menyebut bahwa `drizzle.config.ts` harus menunjuk ke pola `./src/**/schema.ts` atau daftar berkas eksplisit saat tabel fitur pertama ditambahkan. Dokumentasi drizzle-kit mendukung `schema` sebagai array atau glob.
- Tabel Better Auth dibuat oleh CLI Better Auth (lihat [better-auth.md](better-auth.md)). Simpan hasilnya di `src/server/db/auth-schema.ts`.
- Konfigurasi `drizzle.config.ts` di repo saat ini memakai `dotenv`. Pastikan `DATABASE_URL` tersedia untuk `drizzle-kit`.
