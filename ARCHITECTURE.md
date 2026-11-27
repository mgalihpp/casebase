# Arsitektur SQL Quest (CaseBase)

Dokumen ini meringkas arsitektur. Detail lengkap ada di SDD (Software Design Description) dan SRS v0.2 yang tertaut di sana.

## Ringkasan

SQL Quest berjalan sebagai satu aplikasi Next.js yang di-deploy ke Vercel, dengan tRPC sebagai API dan PostgreSQL terkelola sebagai database. Mesin query latihan berjalan di browser (WebAssembly atau JavaScript) dan di server untuk penilaian ulang, tanpa server sandbox terpisah.

## Stack

| Lapisan | Pilihan | Status |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript | Terpasang |
| Styling | Tailwind CSS 4 | Terpasang |
| API | tRPC v11 lewat route handler `src/app/api/trpc/[trpc]` | Terpasang (procedure contoh) |
| Data fetching klien | TanStack Query via `@trpc/tanstack-react-query` | Terpasang |
| Validasi | Zod | Terpasang |
| Database | PostgreSQL terkelola (Neon atau Supabase) | Belum disambung |
| ORM & migrasi | Drizzle ORM (`pg`) + drizzle-kit | Terpasang, migrasi belum dibuat |
| Auth | Better Auth: Google OAuth dan email+password, sesi di PostgreSQL, cookie HttpOnly | Terpasang, belum dicoba end-to-end |
| Mesin query SQL Dasar | sql.js | Direncanakan |
| Mesin query PostgreSQL | PGlite (WASM) | Direncanakan (lulus POC, muat pertama di HP masih perlu diukur) |
| Mesin query NoSQL | mingo (JSON) | Direncanakan |
| Offline & PWA | Service worker, IndexedDB | Direncanakan |
| Notifikasi | Web Push | Direncanakan |
| Penjadwalan | Vercel Cron | Direncanakan |
| Hosting | Vercel (deploy otomatis dari GitHub, preview per branch) | Direncanakan |

## Keputusan desain

| ID | Keputusan | Alasan | Alternatif yang ditolak |
|---|---|---|---|
| D-01 | Website mobile-first dengan Next.js dan PWA | Satu kode untuk HP dan desktop, bisa dipasang ke layar utama | Aplikasi iOS native (dibatalkan 27 Nov) |
| D-02 | tRPC lewat route handler Next.js | Tipe API sama di klien dan server, tanpa server API terpisah | REST manual, layanan backend terpisah |
| D-03 | PostgreSQL terkelola (Neon atau Supabase) | Relasional cocok untuk progres dan liga; jalan bersama Vercel | MongoDB. Penyedia dipilih Supabase |
| D-04 | Hosting di Vercel, termasuk Vercel Cron | Deploy otomatis dan preview per branch | VPS sendiri |
| D-05 | Mesin query di JavaScript dan WebAssembly, tanpa server sandbox | Gratis, jalan offline, tidak ada database latihan yang bisa dibobol | Runner Docker di Railway, Fly.io, atau VPS. Lulus POC |
| D-06 | SQL Dasar memakai sql.js, bukan MySQL asli | Materi Kasus 01 sama sintaksnya di SQLite dan MySQL | Container MySQL. Didukung POC |
| D-07 | Server menilai ulang setiap jawaban, XP dan peringkat hanya diberikan server | Peringkat tidak bisa dicurangi dari browser | Penilaian hanya di browser (usulan, ditolak) |
| D-08 | Konten kasus disimpan sebagai JSON di tabel `case_content` | Kasus baru ditambah tanpa deploy ulang (DC-MNT-01) | Konten ditulis di kode (usulan, ditolak) |
| D-09 | Better Auth untuk Google OAuth dan email | Pustaka TypeScript dengan adapter Drizzle, sesi di PostgreSQL, lupa kata sandi dan hapus akun sudah tersedia | Auth.js, Clerk, Supabase Auth |
| D-10 | Drizzle ORM untuk akses database | Skema bertipe TypeScript dan migrasi SQL yang terbaca | Prisma |
| D-11 | Produk gratis selama MVP | Nyawa dan koin hanya mekanik game, tanpa pembayaran | Freemium atau langganan |
| D-12 | PGlite memakai templat database per seed dengan `BEGIN ... ROLLBACK` dan `SAVEPOINT` | `initdb` per query terlalu mahal (2,2 dtk di server, sekitar 6 dtk di HP). Templat menurunkan soal transaksi ke 1 sampai 5 ms | Database baru per query (sekitar 800 ms untuk soal transaksi). Usulan, hasil POC |

## Gambaran komponen

```
Browser (PWA)
  ├─ UI Next.js (React 19, Tailwind)
  ├─ Mesin query lokal: sql.js (SQL Dasar), PGlite (PostgreSQL), mingo (NoSQL)
  │    └─ dijalankan di Web Worker, jawaban disimpan di IndexedDB saat offline
  └─ tRPC client (TanStack Query)
        │  HTTPS /api/trpc
        ▼
Vercel (Next.js server)
  ├─ tRPC route handler: penilaian ulang jawaban, XP, peringkat, liga
  ├─ Better Auth: /api/auth (Google OAuth, email+password)
  └─ Zod: validasi semua masukan
        │  Drizzle ORM
        ▼
PostgreSQL terkelola
  ├─ case_content: satu kasus = satu dokumen JSON
  ├─ tabel auth (dibuat oleh Better Auth)
  └─ tabel progres dan liga (lihat SDD 3.5)

Vercel Cron ──► route terjadwal (liga mingguan, dll.) ──► PostgreSQL
Web Push ──► notifikasi ke PWA
```

Database produksi tidak pernah menerima query dari pengguna (NFR-SEC-04). Query latihan selalu dijalankan di mesin lokal.

## Alur utama

**Jalankan dan Cek jawaban**
1. Klien memuat kasus lewat `mission.start`. Server membuang field `answer` sebelum mengirim soal, jadi kunci jawaban tidak pernah sampai ke browser.
2. Pengguna menjalankan query di mesin lokal. Hasil dibandingkan di browser untuk umpan balik cepat.
3. Pengguna menekan Cek. Klien mengirim `mission.check` ke server (usulan batas 20 per menit).
4. Server menjalankan ulang pemeriksaan dengan aturan dari `case_content`, lalu menghitung skor, akurasi, dan XP. Hanya server yang menulis XP dan peringkat.

**Data kasus**
- Satu kasus = satu dokumen JSON di `case_content.body`.
- Field `answer` adalah kunci jawaban dan tidak pernah dikirim ke klien.
- Field `aturanKolom` dipakai untuk penilaian, seragam dengan istilah di SDD 3.7.1.
- Field pemeriksa hanya ada untuk soal yang mengubah data, misalnya `SELECT * FROM arsip`.

**Offline**
- Mesin query dan kasus yang sudah dibuka disimpan oleh service worker.
- Jawaban yang dikerjakan offline disimpan di IndexedDB dan disinkronkan saat online. XP dan peringkat hanya diberikan server.

## Struktur folder (saat ini)

```
src/
  app/
    api/trpc/[trpc]/route.ts   handler tRPC
    api/auth/[...all]/route.ts handler Better Auth
    layout.tsx                 membungkus app dengan TRPCReactProvider
  lib/auth.ts                  konfigurasi Better Auth
  server/
    trpc.ts                    context dan builder procedure
    routers/_app.ts            router tRPC (AppRouter)
    db/
      index.ts                 instance Drizzle
      schema.ts                ekspor skema
      auth-schema.ts           tabel Better Auth (di-generate)
  trpc/client.tsx              provider dan hook tRPC untuk klien
drizzle.config.ts
.env.example
```

## Aturan struktur fitur

Kode per fitur ditaruh di `src/features/<nama-fitur>/`. Nama folder kebab-case dan memakai nama domain (misalnya `mission`, `league`, `profile`), bukan nama teknis.

```
src/features/<nama-fitur>/
  index.ts          satu-satunya pintu masuk publik fitur (barrel)
  router.ts         tRPC router fitur, digabung ke src/server/routers/_app.ts
  queries.ts        procedure baca (query): akses DB, hanya kode server
  mutations.ts      procedure tulis (mutation): akses DB, hanya kode server
  schemas.ts        skema Zod untuk input dan output
  schema.ts         definisi tabel Drizzle milik fitur (jika ada)
  types.ts          tipe yang dipakai lintas file fitur
  hooks.ts          hook klien (useTRPC) untuk fitur ini
  components/       komponen UI fitur
```

Aturan:

1. **Satu fitur, satu folder.** Logika fitur tidak ditaruh di `src/app`, `src/server/routers/_app.ts`, atau `src/lib`. Dua file tersebut hanya merakit: `_app.ts` menggabungkan `router` dari setiap fitur, dan `app/` hanya memanggil komponen dan hook dari `features`.
2. **Impor lintas fitur lewat `index.ts`.** Fitur lain tidak boleh mengimpor file dalam (misalnya `features/mission/queries.ts`). Yang diekspor dari `index.ts` hanya yang memang dipakai luar.
3. **Baca dan tulis dipisah.** Procedure baca di `queries.ts`, tulis di `mutations.ts`. Keduanya memakai `baseProcedure.query` atau `.mutation` dan mengambil input lewat skema di `schemas.ts`.
4. **Setiap input divalidasi Zod.** Tidak ada procedure tanpa `.input(...)` jika menerima data dari klien. Procedure yang butuh login memakai `protectedProcedure` (akan ditambahkan di `src/server/trpc.ts`).
5. **Kode server tidak boleh bocor ke klien.** File `queries.ts`, `mutations.ts`, dan `schema.ts` hanya diimpor dari `router.ts` dan kode server. Komponen dan `hooks.ts` hanya memakai tipe dari `AppRouter`, bukan modul DB.
6. **Hook klien membungkus tRPC.** Komponen memanggil `hooks.ts`, bukan `useTRPC` langsung. Ini membuat nama query dan key cache ada di satu tempat.
7. **Logika penilaian hanya di server.** Pemeriksaan jawaban, XP, dan peringkat ada di fitur server (`mutations.ts` atau modul penilaian), tidak di komponen. Kode yang sama dengan mesin query lokal boleh dibagi lewat `src/lib`, tetapi keputusan skor tetap di server (D-07).
8. **Tabel DB milik fitur.** Tabel didefinisikan di `features/<nama>/schema.ts`, lalu diekspor ulang dari `src/server/db/schema.ts`. Ketika tabel fitur pertama ditambahkan, `drizzle.config.ts` harus dibuat menunjuk ke pola `./src/**/schema.ts` atau daftar file eksplisit (saat ini masih satu file).
9. **Shared kecil tetap di luar fitur.** `src/lib` untuk util lintas fitur (misalnya format waktu, konstanta), `src/components/ui` untuk komponen UI generik. Jika sesuatu baru dipakai satu fitur, taruh di fitur itu dulu.

Contoh, fitur `mission` (dari SDD 3.6: `mission.start` dan `mission.check`):

```
src/features/mission/
  index.ts          export { missionRouter } dan hook yang dipakai halaman
  router.ts         createTRPCRouter({ start: queries.start, check: mutations.check })
  queries.ts        start: ambil kasus tanpa field answer
  mutations.ts      check: nilai ulang jawaban, tulis skor dan XP
  schemas.ts        skema input start dan check
  hooks.ts          useMissionStart, useMissionCheck
  components/       MissionPanel, QueryEditor, ...
```

Saat fitur `mission` dibuat, `src/server/routers/_app.ts` cukup menambah satu baris: `mission: missionRouter`.

## Konfigurasi

Variabel lingkungan ada di `.env.example`:

- `DATABASE_URL`: koneksi PostgreSQL
- `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## Pertanyaan terbuka

- Penyedia PostgreSQL final: Neon atau Supabase (SDD mencatat Supabase untuk D-03, perlu dikonfirmasi).
- Berapa koin untuk satu petunjuk, dan apakah petunjuk tetap bisa dibuka saat koin habis.
- Jumlah peserta per zona liga, aturan naik dan turun, dan nama semua jenjang liga.
- Apakah jawaban salah ikut mengurangi skor misi, selain petunjuk.
- Batas memori WASM (misalnya `SELECT repeat('x', 500000000)`) belum diuji.
- Waktu muat PGlite pertama di HP Android asli dan p95 `/api/poc/check` di Vercel belum diukur.
