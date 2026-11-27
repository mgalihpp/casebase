# Dokumentasi Stack SQL Quest

Kumpulan dokumentasi resmi untuk library yang dipakai proyek, diambil dari Context7 (dokumentasi terkini dari sumber resmi) pada 27 Nov 2026.

| Berkas | Library | Versi di `package.json` | Versi dokumentasi yang diambil |
| --- | --- | --- | --- |
| [nextjs.md](nextjs.md) | Next.js (App Router) | 16.4.6 | 16.x (sumber v16.4.5) |
| [trpc.md](trpc.md) | tRPC | ^11.32.0 | 11.x (sumber v11.29.7) |
| [tanstack-query.md](tanstack-query.md) | TanStack Query | ^5.108.4 | 5.x |
| [drizzle.md](drizzle.md) | Drizzle ORM + drizzle-kit | ^0.45.4 / ^0.31.11 | terkini |
| [better-auth.md](better-auth.md) | Better Auth | ^1.7.28 | terkini |
| [zod.md](zod.md) | Zod | ^4.6.7 | 4.x |
| [tailwind.md](tailwind.md) | Tailwind CSS | 4.3.3 | 4.x |
| [pglite.md](pglite.md) | PGlite (PostgreSQL WASM) | belum dipasang | terkini |
| [sql-js.md](sql-js.md) | sql.js (SQLite WASM) | belum dipasang | terkini |
| [mingo.md](mingo.md) | mingo (query MongoDB di JSON) | belum dipasang | terkini |
| [vercel-cron.md](vercel-cron.md) | Vercel Cron Jobs | (platform) | terkini |
| [web-push.md](web-push.md) | web-push (Web Push untuk notifikasi) | belum dipasang | terkini |

## Catatan

- Potongan kode dalam berkas ini disalin dari dokumentasi, bukan hasil uji di proyek ini. Verifikasi dengan `bun run build` setelah dipakai.
- `AGENTS.md` meminta membaca panduan di `node_modules/next/dist/docs/` sebelum menulis kode Next.js. Itu lebih akurat untuk versi yang terpasang, dan sebaiknya dijadikan rujukan utama. Berkas `nextjs.md` di sini adalah ringkasan.
- Berkas ini tidak menggantikan SDD dan SRS. Keputusan desain ada di `ARCHITECTURE.md`.
